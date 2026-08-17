<?php
/**
 * SmokPerio AI — Brevo SMTP Debug Script
 * Run from browser: http://localhost/smokperio/debug_smtp.php
 * Prints step-by-step SMTP conversation to diagnose exactly where it fails.
 */
require_once __DIR__ . '/config/mailer.php';

echo "<pre style='font-family:monospace;font-size:14px;background:#1e1e1e;color:#d4d4d4;padding:20px;'>";
echo "<b style='color:#4ec9b0;'>SmokPerio AI — SMTP Debug</b>\n\n";

$host = 'smtp-relay.brevo.com';
$port = 587;

echo "Connecting to {$host}:{$port}...\n";
$socket = @fsockopen($host, $port, $errno, $errstr, 10);

if (!$socket) {
    echo "<span style='color:red'>❌ Connection FAILED: {$errstr} ({$errno})</span>\n";
    echo "</pre>"; exit();
}

echo "<span style='color:#6a9955'>✅ TCP connected</span>\n\n";

$step = function($label, $cmd = null) use ($socket) {
    if ($cmd !== null) {
        fputs($socket, $cmd . "\r\n");
        echo "<span style='color:#569cd6'>→ " . htmlspecialchars($cmd) . "</span>\n";
    }
    $resp = '';
    while ($line = fgets($socket, 512)) {
        $resp .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    $color = (intval($resp) >= 400) ? 'red' : '#4ec9b0';
    echo "<span style='color:{$color}'>← " . htmlspecialchars(trim($resp)) . "</span>\n\n";
    return $resp;
};

$step('Greeting');
$step('EHLO', 'EHLO smokperio.local');
$step('STARTTLS', 'STARTTLS');

echo "Upgrading to TLS...\n";
if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
    echo "<span style='color:red'>❌ TLS upgrade FAILED — check OpenSSL in php.ini</span>\n";
    echo "</pre>"; fclose($socket); exit();
}
echo "<span style='color:#6a9955'>✅ TLS active</span>\n\n";

$step('EHLO (post-TLS)', 'EHLO smokperio.local');
$step('AUTH LOGIN', 'AUTH LOGIN');

$user = SMTP_USER;
$pass = SMTP_PASS;
echo "→ [base64 of: {$user}]\n";
fputs($socket, base64_encode($user) . "\r\n");
$r1 = '';
while ($l = fgets($socket, 512)) { $r1 .= $l; if (substr($l,3,1)===' ') break; }
echo "<span style='color:#4ec9b0'>← " . htmlspecialchars(trim($r1)) . "</span>\n\n";

echo "→ [base64 of SMTP password]\n";
fputs($socket, base64_encode($pass) . "\r\n");
$authResp = '';
while ($l = fgets($socket, 512)) { $authResp .= $l; if (substr($l,3,1)===' ') break; }
$authColor = (strpos($authResp, '235') !== false) ? '#6a9955' : 'red';
echo "<span style='color:{$authColor}'>← " . htmlspecialchars(trim($authResp)) . "</span>\n\n";

if (strpos($authResp, '235') !== false) {
    echo "<span style='color:#6a9955;font-size:16px'>✅ AUTH SUCCESSFUL — SMTP credentials are valid!</span>\n";
} else {
    echo "<span style='color:red;font-size:16px'>❌ AUTH FAILED (535) — Credentials rejected by Brevo.\n";
    echo "Fix: Go to brevo.com → Profile → SMTP & API → regenerate SMTP key</span>\n";
}

fputs($socket, "QUIT\r\n");
fclose($socket);
echo "</pre>";
?>
