<?php
/**
 * SmokPerio AI — Direct Email Forwarder (Gmail SMTP / Standard SMTP)
 * Sends transactional OTP emails directly via personal Gmail without third-party APIs.
 * Supports:
 *  1. Direct TLS/SSL socket connection to smtp.gmail.com (Port 587 or 465)
 *  2. Standard PHP mail() / sendmail fallback
 */

// ── Email Configuration ──────────────────────────────────────────────────
define('MAIL_SMTP_HOST',   'smtp.gmail.com');
define('MAIL_SMTP_PORT',   587); // 587 for TLS, 465 for SSL
define('MAIL_SMTP_USER',   'ravikumarbadani@gmail.com');
define('MAIL_SMTP_PASS',   'phmricvqefxtvifw'); // 16-character Google App Password
define('MAIL_FROM_EMAIL',  'ravikumarbadani@gmail.com');
define('MAIL_FROM_NAME',   'SmokPerio AI');

/**
 * Send an OTP security code to a recipient email.
 *
 * @param  string $toEmail   Recipient email address
 * @param  string $otp       6-digit OTP security code
 * @param  string $purpose   'verify' or 'reset'
 * @return bool              true on success, false on failure
 */
function sendOtpEmail($toEmail, $otp, $purpose = 'reset') {
    $toEmail = trim($toEmail);
    $subject = ($purpose === 'verify')
        ? 'SmokPerio AI Verification Code: ' . $otp
        : 'SmokPerio AI Password Reset Code: ' . $otp;

    $actionLabel = ($purpose === 'verify') ? 'verify your account' : 'reset your password';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SmokPerio AI Security Code</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);max-width:560px;width:100%;">
      <!-- Header banner -->
      <tr>
        <td style="background:linear-gradient(135deg,#1A3557 0%,#0D9488 100%);padding:32px 36px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">SmokPerio AI</h1>
          <p style="color:#B0DEFF;margin:6px 0 0;font-size:13px;letter-spacing:0.3px;">Clinical Periodontal Risk Assessment</p>
        </td>
      </tr>
      <!-- Content body -->
      <tr>
        <td style="padding:36px 36px 28px 36px;">
          <h2 style="color:#1A3557;font-size:19px;margin:0 0 12px;font-weight:600;">Security Verification Code</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
            A request was made to <strong>{$actionLabel}</strong>. Use the 6-digit security code below to complete the verification:
          </p>
          <!-- OTP badge -->
          <div style="background:#f8fafc;border:2px dashed #0D9488;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#1A3557;font-family:'SF Pro Display','Courier New',monospace;">{$otp}</div>
            <div style="font-size:12px;color:#64748b;margin-top:6px;">Valid for 15 minutes</div>
          </div>
          <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 6px;">
            &#9888;&#65039; <strong>Security Notice:</strong> Never share this code with anyone.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:18px 36px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">
            &copy; 2026 SmokPerio AI &bull; Automated notification
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;

    // Direct SMTP socket (Gmail SMTP server)
    $sent = _sendViaSmtpSocket($toEmail, $subject, $html, $otp);
    if ($sent) return true;

    // Fallback: Standard PHP mail()
    $sent = _sendViaPhpMail($toEmail, $subject, $html, $otp);
    if ($sent) return true;

    error_log("[SmokPerio Mailer] Failed delivery to: " . $toEmail);
    return false;
}

/**
 * Sends email via native PHP TCP/TLS socket directly to Gmail SMTP server.
 */
function _sendViaSmtpSocket($toEmail, $subject, $htmlBody, $otp) {
    $host = MAIL_SMTP_HOST;
    $port = MAIL_SMTP_PORT;
    $user = MAIL_SMTP_USER;
    $pass = str_replace(' ', '', MAIL_SMTP_PASS);
    $from = MAIL_FROM_EMAIL;
    $name = MAIL_FROM_NAME;

    $errno  = 0;
    $errstr = '';

    $isSsl = ($port == 465);
    $connectHost = $isSsl ? 'ssl://' . $host : $host;

    $socket = @fsockopen($connectHost, $port, $errno, $errstr, 12);
    if (!$socket) {
        error_log("[SmokPerio SMTP] Socket connect failed: {$errstr} ({$errno})");
        return false;
    }

    $read = function() use ($socket) {
        $data = '';
        while ($line = fgets($socket, 512)) {
            $data .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $data;
    };

    $cmd = function($c) use ($socket, $read) {
        fputs($socket, $c . "\r\n");
        return $read();
    };

    $greeting = $read();
    if (strpos($greeting, '220') === false) {
        fclose($socket);
        return false;
    }

    $cmd('EHLO localhost');

    if (!$isSsl) {
        $startTls = $cmd('STARTTLS');
        if (strpos($startTls, '220') === false) {
            fclose($socket);
            return false;
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return false;
        }
        $cmd('EHLO localhost');
    }

    // Authenticate with Gmail
    $authReq = $cmd('AUTH LOGIN');
    if (strpos($authReq, '334') === false) {
        fclose($socket);
        return false;
    }

    $cmd(base64_encode($user));
    $authPass = $cmd(base64_encode($pass));
    if (strpos($authPass, '235') === false) {
        error_log("[SmokPerio SMTP] Gmail AUTH failed: {$authPass}");
        fclose($socket);
        return false;
    }

    // Envelope
    $mailFrom = $cmd("MAIL FROM:<{$from}>");
    if (strpos($mailFrom, '250') === false) { fclose($socket); return false; }

    $rcptTo = $cmd("RCPT TO:<{$toEmail}>");
    if (strpos($rcptTo, '250') === false) { fclose($socket); return false; }

    // Send DATA
    $cmd('DATA');

    $boundary = '=_smokperio_' . md5(uniqid());
    $date     = date('r');
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encodedName = '=?UTF-8?B?' . base64_encode($name) . '?=';

    $headers  = "Date: {$date}\r\n";
    $headers .= "From: {$encodedName} <{$from}>\r\n";
    $headers .= "Reply-To: <{$from}>\r\n";
    $headers .= "To: <{$toEmail}>\r\n";
    $headers .= "Subject: {$encodedSubject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n\r\n";

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= "Your SmokPerio AI security OTP code is: {$otp}\nValid for 15 minutes.\n\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $body .= $htmlBody . "\r\n";
    $body .= "--{$boundary}--\r\n";
    $body .= "\r\n.\r\n";

    fputs($socket, $headers . $body);
    $dataResp = $read();

    $cmd('QUIT');
    fclose($socket);

    return (strpos($dataResp, '250') !== false);
}

/**
 * Fallback via standard PHP mail()
 */
function _sendViaPhpMail($toEmail, $subject, $htmlBody, $otp) {
    $from = MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>';
    $boundary = '=_smokperio_' . md5(uniqid());

    $headers  = "From: {$from}\r\n";
    $headers .= "Reply-To: " . MAIL_FROM_EMAIL . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $message  = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $message .= "Your SmokPerio AI security OTP code is: {$otp}\nValid for 15 minutes.\r\n\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $message .= $htmlBody . "\r\n\r\n";
    $message .= "--{$boundary}--\r\n";

    return @mail($toEmail, $subject, $message, $headers);
}
?>
