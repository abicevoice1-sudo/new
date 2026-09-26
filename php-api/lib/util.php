<?php
// Contact-stripping regex — mirrors server/routes/messages.js CONTACT_RE.
const CONTACT_RE = '/(\b[\w.+-]+@[\w-]+\.[\w.]+\b)|(\+?\d[\d\s\-().]{7,}\d)|(whatsapp|telegram|signal|instagram|snapchat|facebook)\s*[:@]?\s*[\w.]+/i';

function cleanMessage(?string $body): string {
    $body = trim((string)($body ?? ''));
    if ($body === '') return '';
    if (mb_strlen($body) > 5000) $body = mb_substr($body, 0, 5000);
    if (preg_match(CONTACT_RE, $body)) {
        return '[Removed: sharing contact details is not allowed before mutual consent. Keep the conversation here.]';
    }
    return $body;
}

function validEmail(?string $e): bool {
    if ($e === null) return false;
    return (bool)filter_var(trim($e), FILTER_VALIDATE_EMAIL);
}

function uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    $hex = bin2hex($data);
    return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
}

function sha256Hex(string $s): string { return hash('sha256', (string)$s); }

function randomBase64Url(int $bytes): string {
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

function nowIso(): string { return gmdate('Y-m-d H:i:s'); }

function nowPlus(string $interval): string {
    return date('Y-m-d H:i:s', strtotime($interval));
}

function publicBase(): string {
    $u = getenv('CLIENT_URL') ?: 'http://localhost:5173';
    return trim(explode(',', $u)[0]);
}
