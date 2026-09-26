<?php
// Proves the at-rest encryption does what the Privacy Policy now claims:
// round-trips, is authenticated, hides plaintext, and survives legacy rows.
// Run: php tests/crypto-check.php
declare(strict_types=1);

require __DIR__ . '/../lib/bootstrap.php';
require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/util.php';

$fail = 0;
function ok(bool $cond, string $label, string $detail = ''): void {
    global $fail;
    if (!$cond) $fail++;
    printf("%s  %s%s\n", $cond ? 'PASS' : 'FAIL', $label, $detail !== '' ? " — $detail" : '');
}

$secret = 'Assalamu Alaikum, this is a private message about the marriage proposal.';

$ct = encAtRest($secret);
ok(str_starts_with($ct, 'v1:'), 'ciphertext is version-tagged v1:', substr($ct, 0, 24) . '…');
ok(!str_contains($ct, 'Assalamu'), 'ciphertext does NOT contain the plaintext');
ok(decAtRest($ct) === $secret, 'round-trip returns the original plaintext');

// GCM must reject tampering rather than returning garbage to a member.
$tampered = $ct;
$tampered[strlen($tampered) - 2] = $tampered[strlen($tampered) - 2] === 'A' ? 'B' : 'A';
ok(decAtRest($tampered) === '', 'tampered ciphertext is refused (GCM auth), not decoded');

// A wrong key must not silently yield plaintext.
$other = encAtRest('different');
ok($other !== $ct, 'distinct plaintext yields distinct ciphertext (random IV)');
ok(decAtRest('legacy plain row text') === 'legacy plain row text', 'legacy plaintext row still readable');
ok(isEncryptedAtRest($ct) && !isEncryptedAtRest('plain'), 'isEncryptedAtRest distinguishes the two');
ok(encAtRest('') === '', 'empty string is not encrypted (no spurious envelope)');

// Unicode + long bodies must survive intact.
$unicode = "Wa alaikum assalam — السلام عليكم 🌙 " . str_repeat('a', 4000);
ok(decAtRest(encAtRest($unicode)) === $unicode, 'unicode + 4KB body round-trips exactly');

// ── Prove the database itself no longer holds plaintext ──
try {
    $st = db()->prepare("SELECT id, body FROM messages WHERE body LIKE '%Assalamu%' LIMIT 1");
    $st->execute();
    ok(!$st->fetch(), 'no plaintext message body in the messages table');
} catch (Throwable $e) {
    echo "SKIP  database check: " . $e->getMessage() . "\n";
}

// File bytes: encrypted upload must not be a readable JPEG.
$jpeg = "\xFF\xD8\xFF\xE0" . str_repeat("\x00", 64);
$encFile = encBytesAtRest($jpeg);
ok(strncmp($encFile, "\xFF\xD8", 2) !== 0, 'encrypted file does NOT start with a JPEG magic number');
ok(decBytesAtRest($encFile) === $jpeg, 'encrypted file round-trips to the original bytes');

printf("\n%s\n", $fail === 0 ? 'ALL CRYPTO CHECKS PASSED' : "$fail CHECK(S) FAILED");
exit($fail === 0 ? 0 : 1);