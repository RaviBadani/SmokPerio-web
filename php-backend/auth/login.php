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

require_once __DIR__ . '/../config/db.php';

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);
if (!$input) {
    $input = $_POST;
}

$email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM practitioners WHERE LOWER(email) = LOWER(:email)");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $passwordMatches = password_verify($password, $user['password']);
        
        // Auto-upgrade legacy hash if needed
        if (!$passwordMatches && $password === $user['password']) {
            $passwordMatches = true;
            $newHashed = password_hash($password, PASSWORD_BCRYPT);
            $upStmt = $pdo->prepare("UPDATE practitioners SET password = :p WHERE id = :id");
            $upStmt->execute([':p' => $newHashed, ':id' => $user['id']]);
        }
        
        if ($passwordMatches) {
            $token = bin2hex(random_bytes(32));
            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "token" => $token,
                "user" => [
                    "id" => (int)$user['id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "role" => isset($user['role']) ? $user['role'] : 'user'
                ]
            ]);
            exit();
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
            exit();
        }
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Authentication service temporarily unavailable."]);
}
?>
