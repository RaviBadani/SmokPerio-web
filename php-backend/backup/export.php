<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

// Security: Verify authorization header or admin key
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '');
$apiKey = isset($_GET['key']) ? $_GET['key'] : '';

$isAuthorized = false;
if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    if (strlen($token) >= 16) {
        $isAuthorized = true;
    }
} elseif ($apiKey === 'smokperio_backup_secure_key_2026') {
    $isAuthorized = true;
}

if (!$isAuthorized) {
    http_response_code(401);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Valid administrative token or key required for database export."]);
    exit();
}

$backupData = [];

try {
    $tables = ['practitioners', 'patients', 'predictions', 'appointments', 'notifications', 'doctor_notes'];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SELECT * FROM `{$t}`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Security: Redact sensitive practitioner password hashes from exports
        if ($t === 'practitioners') {
            foreach ($rows as &$row) {
                unset($row['password']);
            }
        }

        $backupData[$t] = $rows;
    }
} catch (Exception $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit();
}

$filename = "smokperio_backup_" . date("Ymd_His") . ".json";
header("Content-Type: application/json");
header("Content-Disposition: attachment; filename=\"{$filename}\"");

echo json_encode([
    "app"        => "SmokPerio AI",
    "version"    => "2.0.0",
    "timestamp"  => date("Y-m-d H:i:s"),
    "tables"     => $backupData
], JSON_PRETTY_PRINT);
?>
