<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/mailer.php";

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);
if (!$input) $input = $_POST;

$email = isset($input['email']) ? strtolower(trim($input['email'])) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid email address is required."]);
    exit();
}

try {
    // Generate secure 6-digit OTP code
    $otp = sprintf("%06d", mt_rand(100000, 999999));

    if (isset($pdo)) {
        // Clear old OTP records for this email
        $deleteStmt = $pdo->prepare("DELETE FROM password_resets WHERE LOWER(email) = LOWER(:email)");
        $deleteStmt->execute(['email' => $email]);

        // Insert new active OTP record into database using database time
        $insertStmt = $pdo->prepare("INSERT INTO password_resets (email, otp, expires_at) VALUES (:email, :otp, DATE_ADD(NOW(), INTERVAL 15 MINUTE))");
        $insertStmt->execute([
            'email' => $email,
            'otp'   => $otp
        ]);
    }

    // Forward OTP to user's email directly
    sendOtpEmail($email, $otp, 'verify');

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Security verification code sent to " . $email . ". Please check your inbox."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
