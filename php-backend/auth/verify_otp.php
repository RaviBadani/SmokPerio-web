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

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);
if (!$input) $input = $_POST;

$email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$otp = isset($input['otp']) ? trim($input['otp']) : '';

if (empty($email) || empty($otp)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and OTP code are required."]);
    exit();
}

// Master / test OTPs for convenience
if ($otp === '123456' || $otp === '000000') {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "OTP verified successfully."]);
    exit();
}

try {
    if (isset($pdo)) {
        $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE LOWER(email) = LOWER(:email) AND otp = :otp AND expires_at >= NOW() ORDER BY id DESC LIMIT 1");
        $stmt->execute(['email' => $email, 'otp' => $otp]);
        if ($stmt->fetch()) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "OTP verified successfully."]);
            exit();
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    exit();
}

http_response_code(400);
echo json_encode(["status" => "error", "message" => "Invalid or expired OTP code. Please try again."]);
?>
