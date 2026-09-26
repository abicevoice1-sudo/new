<?php
// One-off, idempotent: re-encrypt legacy plaintext rows now that encryption at
// rest is enabled. Safe to re-run — rows already tagged `v1:` are skipped.
//
// Run from php-api/:  php tests/reencrypt-legacy.php
// Add `--dry-run` first to see the counts without writing.
declare(strict_types=1);

require __DIR__ . '/../lib/bootstrap.php';
require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/util.php';

$dryRun = in_array('--dry-run', $argv ?? [], true);

$plain = db()->prepare("SELECT id, body FROM messages WHERE body NOT LIKE 'v1:%'");
$plain->execute();
$rows = $plain->fetchAll();

printf("legacy plaintext message rows: %d%s\n", count($rows), $dryRun ? '  (dry run, nothing written)' : '');
if (!$rows) {
    echo "Nothing to do — every message is already encrypted.\n";
    exit(0);
}

$migrated = 0;
$failed = 0;
$upd = db()->prepare('UPDATE messages SET body = ? WHERE id = ?');

foreach ($rows as $r) {
    $before = (string)$r['body'];
    if ($before === '') continue;
    try {
        $cipher = encAtRest($before);
        // Prove the round-trip before we commit it to the database.
        if (decAtRest($cipher) !== $before) {
            printf("  SKIP  %s — round-trip mismatch, left untouched\n", $r['id']);
            $failed++;
            continue;
        }
        if (!$dryRun) $upd->execute([$cipher, $r['id']]);
        $migrated++;
    } catch (Throwable $e) {
        printf("  ERROR %s — %s\n", $r['id'], $e->getMessage());
        $failed++;
    }
}

printf("migrated: %d, failed: %d%s\n", $migrated, $failed, $dryRun ? '  (dry run)' : '');

$check = db()->prepare("SELECT COUNT(*) AS n FROM messages WHERE body NOT LIKE 'v1:%'");
$check->execute();
$remaining = (int)$check->fetch()['n'];
printf("rows still plaintext: %d\n", $remaining);

exit($failed === 0 ? 0 : 1);