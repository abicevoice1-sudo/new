<?php
// Profile read routes — exact parity with server/routes/profiles.js.
// GET / browse with filters (privacy tiers + blocks in visibleProfile)
// GET /:id one profile (404 when hidden)
// GET /me, PUT /me owner read/update (mutations mirror profileMutations.js)
// POST /:id/interest express interest; matched = mutual

declare(strict_types=1);

function routeProfiles(string $method, array $segments): void
{
    $id = $segments[0] ?? null;

    if ($method === 'GET' && $id === null) { profilesList(); return; }
    if ($method === 'GET' && $id === 'me') { profileMe(); return; }
    if ($method === 'PUT' && $id === 'me') { profileUpdate(); return; }
    if ($method === 'GET' && $id !== null) { profileById($id); return; }
    if ($method === 'POST' && $id !== null && ($segments[1] ?? '') === 'interest') { profileInterest($id); return; }

    json(['error' => 'Profile endpoint not found'], 404);
}

function profilesList(): void
{
    $viewer = currentUser();
    $params = [];
    $where = ['p.is_blocked = 0'];

    $minAge = $_GET['minAge'] ?? null;
    $maxAge = $_GET['maxAge'] ?? null;
    $gender = $_GET['gender'] ?? null;
    $sect = $_GET['sect'] ?? null;
    $search = $_GET['search'] ?? null;
    $verifiedOnly = ($_GET['verifiedOnly'] ?? 'false') === 'true';

    if ($minAge !== null && $minAge !== '') { $where[] = 'p.age >= ?'; $params[] = (int)$minAge; }
    if ($maxAge !== null && $maxAge !== '') { $where[] = 'p.age <= ?'; $params[] = (int)$maxAge; }
    if ($gender !== null && in_array($gender, ['male', 'female'], true)) { $where[] = 'p.gender = ?'; $params[] = $gender; }
    if ($sect !== null && $sect !== '' && $sect !== 'Any sect') { $where[] = 'p.sect = ?'; $params[] = $sect; }
    if ($verifiedOnly) { $where[] = 'p.is_verified = 1'; }
    if ($search !== null && trim((string)$search) !== '') {
        // utf8mb4_unicode_ci LIKE is case-insensitive — parity with ILIKE.
        $where[] = '(p.display_name LIKE ? OR p.profession LIKE ? OR p.city LIKE ?)';
        $term = '%' . trim((string)$search) . '%';
        $params[] = $term; $params[] = $term; $params[] = $term;
    }

    if ($viewer === null) {
        $where[] = "p.visibility <> 'private'";
    } else {
        $where[] = "(p.visibility <> 'private' OR p.user_id = ?)";
        $params[] = $viewer['uid'];
    }

    $sql = 'SELECT p.* FROM profiles p WHERE ' . implode(' AND ', $where) . ' ORDER BY p.created_at DESC LIMIT 100';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $list = [];
    foreach ($rows as $row) {
        $view = visibleProfile($row, $viewer);
        if ($view !== null) $list[] = $view;
    }

    json($list);
}

function profileMe(): void
{
    $user = requireAuthUser();
    $stmt = db()->prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1');
    $stmt->execute([$user['uid']]);
    $row = $stmt->fetch();

    if (!$row) {
        je('Profile not found.', 404);
    }

    json(visibleProfile($row, $user));
}

function profileById(string $id): void
{
    $stmt = db()->prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    $viewer = currentUser();
    $view = $row ? visibleProfile($row, $viewer) : null;
    if (!$view) {
        // Same 404 for missing, blocked, and private-from-you — no probing.
        je('Profile not found.', 404);
    }

    json($view);
}
function profileUpdate(): void
{
    $user = requireAuthUser();
    $b = requestJson();

    // Validation parity with profileMutations.js.
    $age = ($b['age'] ?? null) === null || $b['age'] === '' ? null : (int)$b['age'];
    if ($age !== null && (!ctype_digit((string)$b['age']) || $age < 18 || $age > 100)) {
        je('Age must be between 18 and 100.', 400);
    }
    if (!empty($b['gender']) && !in_array($b['gender'], ['male', 'female'], true)) {
        je('Invalid gender.', 400);
    }
    foreach (['visibility', 'photos_visibility', 'photosVisibility'] as $f) {
        if (!empty($b[$f]) && !in_array($b[$f], ['public', 'members', 'private'], true)) {
            je("Invalid {$f}.", 400);
        }
    }
    if (!empty($b['bio']) && strlen((string)$b['bio']) > 2000) {
        je('Bio must be under 2000 characters.', 400);
    }

    $cols = ['display_name', 'displayName', 'age', 'gender', 'city', 'country',
        'sect', 'profession', 'bio', 'expectations', 'aboutFamily',
        'visibility', 'photos_visibility', 'photosVisibility'];
    $sets = [];
    $values = [];
    foreach ($cols as $key) {
        if (!array_key_exists($key, $b)) continue;
        $col = match ($key) {
            'displayName' => 'display_name',
            'aboutFamily' => 'about_family',
            'photosVisibility' => 'photos_visibility',
            default => $key,
        };
        $v = $key === 'age' ? $age : ($b[$key] === '' ? null : $b[$key]);
        if ($col === 'display_name' && ($v === null || trim((string)$v) === '')) continue;
        $sets[] = "{$col} = ?";
        $values[] = $v;
    }
    if (!$sets) {
        je('Nothing to update.', 400);
    }
    $values[] = $user['uid'];

    $sql = 'UPDATE profiles SET ' . implode(', ', $sets) . ', updated_at = UTC_TIMESTAMP() WHERE user_id = ?';
    db()->prepare($sql)->execute($values);

    $fetch = db()->prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1');
    $fetch->execute([$user['uid']]);
    $row = $fetch->fetch();

    json(['ok' => true, 'profile' => $row]);
}

function profileInterest(string $id): void
{
    $user = requireAuthUser();

    if ($id === (string)$user['uid']) {
        je('You cannot express interest in yourself.', 400);
    }
    $stmt = db()->prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        je('Profile not found.', 404);
    }

    // Idempotent: PK conflict on (from,to) is a no-op, like ON CONFLICT DO NOTHING.
    $insert = db()->prepare('INSERT IGNORE INTO interests (from_user_id, to_user_id) VALUES (?, ?)');
    $insert->execute([$user['uid'], $id]);

    $mutual = db()->prepare('SELECT 1 FROM interests WHERE from_user_id = ? AND to_user_id = ? LIMIT 1');
    $mutual->execute([$id, $user['uid']]);
    $mirrored = (bool)$mutual->fetch();

    json(['success' => true, 'matched' => $mirrored]);
}

