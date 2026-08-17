<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$backupData = [];

try {
    $tables = ['practitioners', 'patients', 'predictions', 'appointments', 'notifications', 'doctor_notes'];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SELECT * FROM `{$t}`");
        $backupData[$t] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit();
}

$filename = "smokperio_backup_" . date("Ymd_His") . ".json";
header("Content-Type: application/json");
header("Content-Disposition: attachment; filename=\"{$filename}\"");

echo json_encode([
    "app"        => "SmokPerio AI",
    "version"    => "1.0.0",
    "timestamp"  => date("Y-m-d H:i:s"),
    "tables"     => $backupData
], JSON_PRETTY_PRINT);
?>
