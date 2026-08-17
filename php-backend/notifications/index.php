<?php
/**
 * Notifications REST API
 * GET  /notifications/index.php        → list all notifications for user
 * PUT  /notifications/mark_read.php?id → mark one as read
 * PUT  /notifications/mark_all_read.php → mark all as read
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db.php';
require_once '../auth/jwt.php';

$user = verifyJwt();
if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$stmt = $pdo->prepare(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
);
$stmt->execute([$user['id']]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
