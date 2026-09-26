<?php
// Standalone check of the mail transport resolution + fallback chain.
// Run: php tests/mail-transport-check.php
declare(strict_types=1);

function resolveTransport(): string
{
    $host = trim((string)(getenv('SMTP_HOST') ?: ''));
    $t = strtolower(trim((string)(getenv('MAIL_TRANSPORT') ?: '')));
    if ($t !== '') return $t;
    return $host !== '' ? 'smtp'
        : (((getenv('APP_ENV') ?: 'development') === 'production') ? 'mail' : 'dev');
}

$cases = [
    // [label, env overrides, expected transport, note]
    ['prod, no SMTP (the cPanel-without-credentials case)',
        ['APP_ENV' => 'production', 'SMTP_HOST' => ''], 'mail',
        'must NOT be dev - otherwise verify/reset links are silently lost'],
    ['prod + SMTP_HOST set',
        ['APP_ENV' => 'production', 'SMTP_HOST' => 'smtp.example.com'], 'smtp',
        'explicit credentials win'],
    ['development, no SMTP',
        ['APP_ENV' => 'development', 'SMTP_HOST' => ''], 'dev',
        'local suites rely on the [mail:dev] log'],
    ['prod but MAIL_TRANSPORT=dev forced',
        ['APP_ENV' => 'production', 'SMTP_HOST' => '', 'MAIL_TRANSPORT' => 'dev'], 'dev',
        'explicit override wins (the dangerous-but-intentional state)'],
    ['prod, MAIL_TRANSPORT=mail forced, SMTP_HOST empty',
        ['APP_ENV' => 'production', 'SMTP_HOST' => '', 'MAIL_TRANSPORT' => 'mail'], 'mail',
        'explicit override wins'],
];

$fail = 0;
foreach ($cases as [$label, $env, $want, $note]) {
    foreach (['APP_ENV', 'SMTP_HOST', 'MAIL_TRANSPORT'] as $k) {
        putenv($k); // clear
    }
    foreach ($env as $k => $v) putenv("$k=$v");
    $got = resolveTransport();
    $ok = ($got === $want);
    if (!$ok) $fail++;
    printf("%s  %-52s -> %-5s (want %s)\n", $ok ? 'PASS' : 'FAIL', $label, $got, $want);
    printf("      %s\n", $note);
}

// The production-without-SMTP case is the one that must never resolve to 'dev'.
putenv('APP_ENV=production'); putenv('SMTP_HOST='); putenv('MAIL_TRANSPORT');
$prod = resolveTransport();
printf("\n%s  production + no SMTP resolves to '%s' (%s)\n",
    $prod === 'mail' ? 'PASS' : 'FAIL', $prod,
    $prod === 'mail' ? 'mail will be attempted, then dev-log fallback' : 'EMAIL WOULD BE LOST');

exit($fail === 0 ? 0 : 1);