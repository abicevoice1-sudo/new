<?php
// PDO connection (MariaDB/MySQL, utf8mb4, UTC session) + shared route helpers.

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = (int)(getenv('DB_PORT') ?: 3306);
    $db   = getenv('DB_NAME') ?: 'shiarishta';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASSWORD') ?: '';

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $db);
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    // Store every timestamp as UTC so NOW() matches gmdate() in PHP.
    $pdo->exec("SET time_zone = '+00:00'");

    return $pdo;
}

function requestJson(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    // Node's express.json({limit:'2mb'}) rejects oversized bodies too.
    if (strlen($raw) > 2_000_000) {
        je('Payload too large.', 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        je('Invalid JSON body.', 400);
    }
    return $data;
}

function currentUser(): ?array
{
    $token = hbearer();
    if ($token === null) {
        return null;
    }

    try {
        return jwtVerify($token, jwtSecret());
    } catch (Throwable) {
        return null;
    }
}

function requireAuthUser(): array
{
    $user = currentUser();
    if ($user === null) {
        je('Authentication required', 401);
    }
    return $user;
}

function requireAdminUser(): array
{
    $user = requireAuthUser();
    if (empty($user['isAdmin'])) {
        je('Admin access required', 403);
    }
    return $user;
}

function sanitizeText(?string $value, int $max = 2000): string
{
    $value = trim((string)($value ?? ''));
    if (mb_strlen($value) > $max) {
        $value = mb_substr($value, 0, $max);
    }
    return $value;
}

// Session payload — exact Node sessionOf() shape: {uid,email,displayName,isAdmin,emailVerified}.
function makeMemberSession(array $row): array
{
    return [
        'uid' => (string)($row['id'] ?? ''),
        'email' => (string)($row['email'] ?? ''),
        'displayName' => (string)($row['display_name'] ?? ''),
        'isAdmin' => (bool)($row['is_admin'] ?? false),
        'emailVerified' => (bool)($row['email_verified'] ?? false),
    ];
}

// Node's visibleProfile(): privacy tiers + blocks enforced here, not in the UI.
// $viewer is the decoded JWT (or null). Returns null when the row must be hidden.
function visibleProfile(array $row, ?array $viewer): ?array
{
    if (!empty($row['is_blocked'])) {
        return null;
    }
    $ownerId = (string)($row['user_id'] ?? $row['id'] ?? '');
    if (($row['visibility'] ?? 'members') === 'private' && ($viewer === null || (string)$viewer['uid'] !== $ownerId)) {
        return null;
    }
    $isOwner = $viewer !== null && (string)$viewer['uid'] === $ownerId;

    if (($row['visibility'] ?? 'members') === 'public' || ($viewer !== null && isset($viewer['uid'])) || $isOwner) {
        $photosLocked = ($row['photos_visibility'] ?? 'members') === 'private' && !$isOwner;
        return [
            'id' => $ownerId,
            'displayName' => $row['display_name'] ?? null,
            'age' => $row['age'] ?? null,
            'gender' => $row['gender'] ?? null,
            'city' => $row['city'] ?? null,
            'country' => $row['country'] ?? null,
            'sect' => $row['sect'] ?? null,
            'profession' => $row['profession'] ?? null,
            'bio' => $row['bio'] ?? null,
            'expectations' => $row['expectations'] ?? null,
            'aboutFamily' => $row['about_family'] ?? null,
            'is_verified' => (bool)($row['is_verified'] ?? false),
            'visibility' => $row['visibility'] ?? 'members',
            'photo' => $photosLocked ? null : ($row['photo_url'] ?? null),
        ];
    }
    return [
        'id' => $ownerId,
        'displayName' => $row['display_name'] ?? null,
        'age' => $row['age'] ?? null,
        'profession' => $row['profession'] ?? null,
        'is_verified' => (bool)($row['is_verified'] ?? false),
        'expectations' => $row['expectations'] ?? null,
        'aboutFamily' => $row['about_family'] ?? null,
        'visibility' => $row['visibility'] ?? 'members',
        'locked' => true,
    ];
}
