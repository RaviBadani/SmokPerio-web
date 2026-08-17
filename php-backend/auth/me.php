<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query("SELECT id, name, email FROM practitioners ORDER BY id ASC LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        http_response_code(200);
        echo json_encode([
            "id" => (int)$user['id'],
            "name" => $user['name'],
            "email" => $user['email']
        ]);
        exit();
    }
} catch (Exception $e) {}

http_response_code(200);
echo json_encode([
    "id" => 1,
    "name" => "Dr. Aris Thorne",
    "email" => "doctor@simats.edu"
]);
?>
