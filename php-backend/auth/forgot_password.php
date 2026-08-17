<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mailer.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
if (!$data) $data = $_POST;

$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid email is required"]);
    exit();
}

try {
    // Check if user exists in practitioners table
    if (isset($pdo)) {
        $checkStmt = $pdo->prepare("SELECT id FROM practitioners WHERE LOWER(email) = LOWER(:email)");
        $checkStmt->execute([':email' => $email]);
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "No account found with this email address."]);
            exit();
        }
    }

    // Generate 6-digit OTP and store in DB
    $otp = sprintf("%06d", mt_rand(100000, 999999));

    if (isset($pdo)) {
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$email]);

        $stmt = $pdo->prepare("INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))");
        $stmt->execute([$email, $otp]);
    }

    // Forward password reset OTP to email
    sendOtpEmail($email, $otp, 'reset');

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Password reset code sent to " . $email . ". Please check your inbox."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
