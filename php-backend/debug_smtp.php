<?php
/**
 * SmokPerio AI — SMTP Diagnostics Utility (Protected)
 */
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

$authKey = isset($_GET['key']) ? $_GET['key'] : '';
if ($authKey !== 'smokperio_debug_admin_key_2026') {
    http_response_code(403);
    echo "<h2 style='color:#b91c1c;font-family:sans-serif;'>403 Forbidden: Diagnostic tool is restricted to authorized personnel.</h2>";
    exit();
}

require_once __DIR__ . '/config/mailer.php';

echo "<pre style='font-family:monospace;font-size:14px;background:#1e1e1e;color:#d4d4d4;padding:20px;border-radius:8px;'>";
echo "<b style='color:#4ec9b0;'>SmokPerio AI — Protected SMTP Diagnostic Test</b>\n\n";

$host = MAIL_SMTP_HOST;
$port = MAIL_SMTP_PORT;

echo "Connecting to {$host}:{$port}...\n";
$socket = @fsockopen($host, $port, $errno, $errstr, 10);

if (!$socket) {
    echo "<span style='color:red'>❌ Connection FAILED: {$errstr} ({$errno})</span>\n";
    echo "</pre>"; exit();
}

echo "<span style='color:#6a9955'>✅ TCP connection established</span>\n\n";

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

echo "Upgrading socket to TLS...\n";
if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
    echo "<span style='color:red'>❌ TLS handshake failed</span>\n";
    echo "</pre>"; fclose($socket); exit();
}
echo "<span style='color:#6a9955'>✅ TLS Encryption Active</span>\n\n";

$step('EHLO (post-TLS)', 'EHLO smokperio.local');
$step('AUTH LOGIN', 'AUTH LOGIN');

$user = MAIL_SMTP_USER;
$pass = str_replace(' ', '', MAIL_SMTP_PASS);
echo "→ [Authentication Handshake with Gmail SMTP]\n";
fputs($socket, base64_encode($user) . "\r\n");
$r1 = '';
while ($l = fgets($socket, 512)) { $r1 .= $l; if (substr($l,3,1)===' ') break; }

fputs($socket, base64_encode($pass) . "\r\n");
$authResp = '';
while ($l = fgets($socket, 512)) { $authResp .= $l; if (substr($l,3,1)===' ') break; }

if (strpos($authResp, '235') !== false) {
    echo "<span style='color:#6a9955;font-size:16px'>✅ AUTH SUCCESSFUL — Gmail SMTP connection is fully operational!</span>\n";
} else {
    echo "<span style='color:red;font-size:16px'>❌ AUTH FAILED: " . htmlspecialchars(trim($authResp)) . "</span>\n";
}

fputs($socket, "QUIT\r\n");
fclose($socket);
echo "</pre>";
?>
