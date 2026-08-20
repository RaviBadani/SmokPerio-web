<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

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
$newPassword = isset($input['new_password']) ? trim($input['new_password']) : (isset($input['password']) ? trim($input['password']) : '');

if (empty($email) || empty($newPassword)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and new password are required."]);
    exit();
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "New password must be at least 6 characters long."]);
    exit();
}

try {
    if (isset($pdo)) {
        // Enforce OTP validation if an OTP was issued for this email
        if (!empty($otp)) {
            $checkStmt = $pdo->prepare("SELECT id FROM password_resets WHERE LOWER(email) = LOWER(:email) AND otp = :otp AND expires_at > NOW()");
            $checkStmt->execute([':email' => $email, ':otp' => $otp]);
            if (!$checkStmt->fetch()) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Invalid or expired OTP code."]);
                exit();
            }
        } else {
            // Check if there is an active reset request that required an OTP
            $checkPending = $pdo->prepare("SELECT id FROM password_resets WHERE LOWER(email) = LOWER(:email) AND expires_at > NOW()");
            $checkPending->execute([':email' => $email]);
            if ($checkPending->fetch()) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "OTP verification is required to reset password."]);
                exit();
            }
        }

        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE practitioners SET password = :pwd WHERE LOWER(email) = LOWER(:email)");
        $stmt->execute(['pwd' => $hashed, 'email' => $email]);

        // Clean up reset token
        $stmtDelete = $pdo->prepare("DELETE FROM password_resets WHERE LOWER(email) = LOWER(:email)");
        $stmtDelete->execute(['email' => $email]);

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Password updated successfully. You can now sign in."]);
        exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
    exit();
}

http_response_code(200);
echo json_encode(["status" => "success", "message" => "Password updated successfully."]);
?>
