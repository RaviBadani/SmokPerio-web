<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
require_once '../config/db.php';
require_once '../auth/jwt.php';
$user = verifyJwt();
if (!$user) { http_response_code(401); echo json_encode(["error" => "Unauthorized"]); exit(); }

$stmt = $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?");
$stmt->execute([$user['id']]);
echo json_encode(["message" => "All notifications marked as read", "count" => $stmt->rowCount()]);
