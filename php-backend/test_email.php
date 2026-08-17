<?php
require_once __DIR__ . '/config/mailer.php';

$target = isset($_GET['to']) ? trim($_GET['to']) : 'ravibadani987@gmail.com';
$otp = sprintf("%06d", mt_rand(100000, 999999));

echo "Sending OTP [{$otp}] to: {$target} ...\n";
$result = sendOtpEmail($target, $otp, 'verify');

if ($result) {
    echo "RESULT: SUCCESS - Sent to {$target}\n";
} else {
    echo "RESULT: FAILED\n";
}
?>
