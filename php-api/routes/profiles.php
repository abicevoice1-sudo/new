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
    // Filters the browse UI exposes. These previously had no server-side
    // implementation at all, so the client filtered on fields the response
    // never contained and every one of them returned an empty list.
    $religiosity = $_GET['religiosity'] ?? null;
    $education   = $_GET['education'] ?? null;
    $marja       = $_GET['marja'] ?? null;
    $country     = $_GET['country'] ?? null;
    $photoAccess = $_GET['photoAccess'] ?? null;   // public | members | private
    $searchable  = static fn($v, $label) => ($v !== null && $v !== '' && $v !== "Any $label" && $v !== "Any $label.");
    if (array_key_exists('minAge', $_GET) && $_GET['minAge'] !== '' && $searchable($minAge, 'age')) { $where[] = 'p.age >= ?'; $params[] = (int)$minAge; }
    if (array_key_exists('maxAge', $_GET) && $_GET['maxAge'] !== '' && $searchable($maxAge, 'age')) { $where[] = 'p.age <= ?'; $params[] = (int)$maxAge; }
    if ($gender !== null && in_array($gender, ['male', 'female'], true)) { $where[] = 'p.gender = ?'; $params[] = $gender; }
    if ($searchable($sect, 'sect')) { $where[] = 'p.sect = ?'; $params[] = $sect; }
    if ($searchable($religiosity, 'level')) { $where[] = 'p.religiosity = ?'; $params[] = $religiosity; }
    if ($searchable($education, 'education')) { $where[] = 'p.education_level = ?'; $params[] = $education; }
    if ($searchable($marja, 'marja')) { $where[] = 'p.marja = ?'; $params[] = $marja; }
    if ($searchable($country, 'country')) { $where[] = 'p.country = ?'; $params[] = $country; }
    if ($searchable($photoAccess, 'photo')) { $where[] = 'p.photos_visibility = ?'; $params[] = $photoAccess; }
    $verifiedOnly = ($_GET['verifiedOnly'] ?? 'false') === 'true';
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
        'visibility', 'photos_visibility', 'photosVisibility',
        // Fields onboarding collects. These columns were added by
        // migrateAddProfileColumns(); without this mapping the answers were
        // accepted by the form and silently thrown away on save.
        'religiosity', 'educationLevel', 'marja', 'prayer', 'modesty', 'diet',
        'languages', 'ethnicity', 'incomeRange', 'maritalStatus', 'children',
        'childrenPlans', 'relocation', 'familyInvolvement', 'heightCm', 'timeline',
        'photoUrl'];

    // Accept the same key under both shapes. The browse filter sends `education`
    // (that is the query-param name) while the onboarding form sends
    // `educationLevel`; without this alias the value was silently dropped.
    $aliases = [
        'education'          => 'educationLevel',
        'education_level'    => 'educationLevel',
        'religiosity_level'  => 'religiosity',
        'marja_affiliation'  => 'marja',
        'family_involvement' => 'familyInvolvement',
        'children_plans'     => 'childrenPlans',
        'marital_status'     => 'maritalStatus',
        'income_range'       => 'incomeRange',
        'height_cm'          => 'heightCm',
        'photo_url'          => 'photoUrl',
    ];
    foreach ($aliases as $from => $to) {
        if (!array_key_exists($to, $b) && array_key_exists($from, $b)) {
            $b[$to] = $b[$from];
        }
    }
    $sets = [];
    $values = [];
    foreach ($cols as $key) {
        if (!array_key_exists($key, $b)) continue;
        $col = match ($key) {
            'displayName' => 'display_name',
            'aboutFamily' => 'about_family',
            'photosVisibility' => 'photos_visibility',
            'educationLevel' => 'education_level',
            'incomeRange' => 'income_range',
            'maritalStatus' => 'marital_status',
            'childrenPlans' => 'children_plans',
            'familyInvolvement' => 'family_involvement',
            'heightCm' => 'height_cm',
            'photoUrl' => 'photo_url',
            default => $key,
        };
        $v = in_array($key, ['age', 'heightCm'], true) && $b[$key] !== null && $b[$key] !== ''
            ? (int)$b[$key]
            : ($b[$key] === '' ? null : $b[$key]);
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

