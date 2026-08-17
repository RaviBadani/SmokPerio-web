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

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
if (!$id) { http_response_code(400); echo json_encode(["error" => "ID required"]); exit(); }

$stmt = $pdo->prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?");
$stmt->execute([$id, $user['id']]);
echo json_encode(["message" => "Marked as read"]);
