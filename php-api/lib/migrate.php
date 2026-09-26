<?php
// Idempotent schema migration — runs db/schema.sql statements on first boot.

function migrateSchema(): void
{
    static $done = false;
    if ($done) return;
    $done = true;

    $file = __DIR__ . '/../db/schema.sql';
    if (!is_file($file)) return;
    $sql = file_get_contents($file);
    if ($sql === false || trim($sql) === '') return;

    // Cheap "already migrated" probe. Must check a LATE table too: probing only
    // users.* would skip migration forever after a partial run (a lesson learned
    // the hard way — conversations/messages/profile_drafts never got created).
    try {
        $col = db()->query("SHOW COLUMNS FROM users LIKE 'email_verified'")->fetch();
        $tbl = db()->query("SHOW TABLES LIKE 'profile_drafts'")->fetch();
        if ($col && $tbl) return;
    } catch (Throwable) {
        // Table missing — fall through and create everything.
    }

    try {
        $statements = preg_split('/;\s*(?:\r?\n|$)/', $sql) ?: [];
        $errors = 0;
        foreach ($statements as $stmt) {
            // Strip comment lines FIRST: chunks between statements often begin
            // with "-- ..." comments (e.g. profile_drafts) — skipping any chunk
            // that starts with -- would silently never create those tables.
            $lines = array_filter(
                explode("\n", $stmt),
                fn($l) => !preg_match('/^\s*(--|#)/', $l)
            );
            $stmt = trim(implode("\n", $lines));
            // A UTF-8 BOM on the first chunk would otherwise be sent as SQL.
            $stmt = ltrim($stmt, "\xEF\xBB\xBF");
            if ($stmt === '') continue;
            try {
                db()->exec($stmt);
            } catch (Throwable $e) {
                // Keep going: one failing statement must not strand the rest of
                // the schema (the failure mode that left tables missing).
                $errors++;
                $msg = $e->getMessage();
                if (stripos($msg, 'already exists') === false) {
                    error_log('[api] migration statement failed: ' . substr($msg, 0, 200));
                }
            }
        }
        error_log($errors === 0 ? '[api] schema migrated' : "[api] schema migrated with {$errors} tolerated statement error(s)");
    } catch (Throwable $e) {
        error_log('[api] migration issue: ' . $e->getMessage());
    }
}
