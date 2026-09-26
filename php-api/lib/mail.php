<?php
// Mail adapter — SMTP when configured, console fallback otherwise.
// Mirrors server/mailer.js: without SMTP_HOST the exact message is logged
// ([mail:dev]) so local development and e2e runs can complete every flow.
function mailSend(array $opts): array {
    $to      = (string)($opts['to'] ?? '');
    $subject = (string)($opts['subject'] ?? '');
    $text    = (string)($opts['text'] ?? '');

    $host = getenv('SMTP_HOST');
    if ($host === false || $host === '' || $host === null) {
        error_log("[mail:dev] to=$to subject=\"$subject\"");
        error_log("[mail:dev] $text");
        return ['dev' => true];
    }
    $port = (int)getenv('SMTP_PORT') ?: 587;
    $user = getenv('SMTP_USER');
    $pass = getenv('SMTP_PASS');
    $from = getenv('MAIL_FROM') ?: 'Shiarishta <no-reply@shiarishta.com>';
    $secure = ($port === 465);
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return mailPhpMailer($from, $to, $subject, $text, $host, $port, $user, $pass, $secure);
    }
    $headers = "From: $from\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    $ok = @mail($to, $subject, $text, $headers);
    return ['sent' => (bool)$ok, 'method' => 'mail'];
}
function mailPhpMailer(string $from,string $to,string $sub,string $text,string $host,int $port,?string $user,?string $pass,bool $secure): array {
    $m = new \PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $m->isSMTP(); $m->Host=$host; $m->SMTPAuth=($user!==null&&$user!=='');
        $m->Username=$user; $m->Password=$pass;
        $m->SMTPSecure=$secure?\PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS:\PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $m->Port=$port; $m->setFrom($from); $m->addAddress($to);
        $m->Subject=$sub; $m->Body=$text; $m->isHTML(false); $m->send();
        return ['sent'=>true,'method'=>'smtp'];
    } catch (Exception $e) {
        error_log("[mail:smtp] failed: ".$m->ErrorInfo);
        return ['sent'=>false,'error'=>$m->ErrorInfo];
    }
}
