<?php
/**
 * Appointments REST API
 * GET    /appointments/index.php          → list all appointments for practitioner
 * POST   /appointments/index.php          → create appointment
 * PUT    /appointments/index.php?id=N     → update appointment
 * DELETE /appointments/index.php?id=N     → delete appointment
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare(
            "SELECT * FROM appointments WHERE practitioner_id = ? ORDER BY date DESC, time ASC"
        );
        $stmt->execute([$user['id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare(
            "INSERT INTO appointments (practitioner_id, patient_name, date, time, notes, status)
             VALUES (?, ?, ?, ?, ?, 'Scheduled')"
        );
        $stmt->execute([
            $user['id'],
            $data['patient_name'] ?? '',
            $data['date']         ?? '',
            $data['time']         ?? '',
            $data['notes']        ?? ''
        ]);
        http_response_code(201);
        echo json_encode(["id" => $pdo->lastInsertId(), "message" => "Appointment created"]);
        break;

    case 'PUT':
        if (!$id) { http_response_code(400); echo json_encode(["error" => "ID required"]); exit(); }
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare(
            "UPDATE appointments SET patient_name=?, date=?, time=?, notes=?, status=?
             WHERE id=? AND practitioner_id=?"
        );
        $stmt->execute([
            $data['patient_name'] ?? '',
            $data['date']         ?? '',
            $data['time']         ?? '',
            $data['notes']        ?? '',
            $data['status']       ?? 'Scheduled',
            $id,
            $user['id']
        ]);
        echo json_encode(["message" => "Appointment updated"]);
        break;

    case 'DELETE':
        if (!$id) { http_response_code(400); echo json_encode(["error" => "ID required"]); exit(); }
        $stmt = $pdo->prepare(
            "DELETE FROM appointments WHERE id=? AND practitioner_id=?"
        );
        $stmt->execute([$id, $user['id']]);
        echo json_encode(["message" => "Appointment deleted"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
