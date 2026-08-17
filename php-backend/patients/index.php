<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$patientId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$practitionerId = isset($_GET['practitioner_id']) ? (int)$_GET['practitioner_id'] : null;

// Read JSON input correctly
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);
if (!$input) $input = $_POST;

if (!$practitionerId && isset($input['practitioner_id'])) {
    $practitionerId = (int)$input['practitioner_id'];
}

function formatPatient($row, $pdo) {
    $cal = !empty($row['cal_values']) ? json_decode($row['cal_values'], true) : [3, 4, 4, 3];
    $ppd = !empty($row['ppd_values']) ? json_decode($row['ppd_values'], true) : [2, 3, 3, 2];
    $radioAnalysis = !empty($row['radiograph_analysis']) ? json_decode($row['radiograph_analysis'], true) : null;

    $preds = [];
    if ($pdo && !empty($row['id'])) {
        try {
            $stmt = $pdo->prepare("SELECT id, patient_id, result_json, created_at FROM predictions WHERE patient_id = :pid ORDER BY id DESC");
            $stmt->execute([':pid' => $row['id']]);
            while ($pRow = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $resultObj = json_decode($pRow['result_json'], true);
                $preds[] = [
                    "id" => (int)$pRow['id'],
                    "patient_id" => (int)$pRow['patient_id'],
                    "created_at" => $pRow['created_at'],
                    "result" => $resultObj
                ];
            }
        } catch (Exception $e) {}
    }

    return [
        "id" => (int)$row['id'],
        "practitioner_id" => isset($row['practitioner_id']) ? (int)$row['practitioner_id'] : 1,
        "name" => $row['name'],
        "age" => (int)$row['age'],
        "gender" => $row['gender'],
        "cigarettes_per_day" => isset($row['cigarettes_per_day']) ? (int)$row['cigarettes_per_day'] : 0,
        "years_smoking" => isset($row['years_smoking']) ? (int)$row['years_smoking'] : 0,
        "pack_years" => isset($row['pack_years']) ? (double)$row['pack_years'] : 0.0,
        "smoking_status" => isset($row['smoking_status']) ? $row['smoking_status'] : 'Non-Smoker',
        "cal_values" => is_array($cal) ? array_map('intval', $cal) : [3, 4, 4, 3],
        "ppd_values" => is_array($ppd) ? array_map('intval', $ppd) : [2, 3, 3, 2],
        "radiographic_bone_loss" => isset($row['radiographic_bone_loss']) ? (double)$row['radiographic_bone_loss'] : 0.0,
        "furcation_involvement" => !empty($row['furcation_involvement']) ? true : false,
        "il6_level" => isset($row['il6_level']) && $row['il6_level'] !== null ? (double)$row['il6_level'] : null,
        "tnf_alpha" => isset($row['tnf_alpha']) && $row['tnf_alpha'] !== null ? (double)$row['tnf_alpha'] : null,
        "radiograph_path" => isset($row['radiograph_path']) ? $row['radiograph_path'] : null,
        "radiograph_analysis" => $radioAnalysis,
        "predictions" => $preds,
        "created_at" => isset($row['created_at']) ? $row['created_at'] : date('Y-m-d H:i:s')
    ];
}

switch ($method) {
    case 'GET':
        try {
            if ($patientId) {
                $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = :id");
                $stmt->execute([':id' => $patientId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    http_response_code(200);
                    echo json_encode(formatPatient($row, $pdo));
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "message" => "Patient not found"]);
                }
            } else if ($practitionerId) {
                $stmt = $pdo->prepare("SELECT * FROM patients WHERE practitioner_id = :pid ORDER BY id DESC");
                $stmt->execute([':pid' => $practitionerId]);
                $patients = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $patients[] = formatPatient($row, $pdo);
                }
                http_response_code(200);
                echo json_encode($patients);
            } else {
                $stmt = $pdo->query("SELECT * FROM patients ORDER BY id DESC");
                $patients = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $patients[] = formatPatient($row, $pdo);
                }
                http_response_code(200);
                echo json_encode($patients);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database query error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $name = isset($input['name']) ? trim($input['name']) : '';
        $age = isset($input['age']) ? (int)$input['age'] : 0;
        $gender = isset($input['gender']) ? trim($input['gender']) : 'Unknown';
        $cigs = isset($input['cigarettes_per_day']) ? (int)$input['cigarettes_per_day'] : 0;
        $years = isset($input['years_smoking']) ? (int)$input['years_smoking'] : 0;
        $packYears = ($cigs / 20.0) * $years;
        $status = isset($input['smoking_status']) ? $input['smoking_status'] : ($cigs > 0 ? 'Smoker' : 'Non-Smoker');
        $pid = isset($input['practitioner_id']) ? (int)$input['practitioner_id'] : 1;
        
        $cal = isset($input['cal_values']) ? json_encode($input['cal_values']) : json_encode([3, 3, 4, 3]);
        $ppd = isset($input['ppd_values']) ? json_encode($input['ppd_values']) : json_encode([2, 3, 3, 2]);
        $boneLoss = isset($input['radiographic_bone_loss']) ? (double)$input['radiographic_bone_loss'] : 0.0;
        $furcation = !empty($input['furcation_involvement']) ? 1 : 0;
        $il6 = isset($input['il6_level']) ? (double)$input['il6_level'] : null;
        $tnf = isset($input['tnf_alpha']) ? (double)$input['tnf_alpha'] : null;

        try {
            $stmt = $pdo->prepare("INSERT INTO patients (practitioner_id, name, age, gender, cigarettes_per_day, years_smoking, pack_years, smoking_status, cal_values, ppd_values, radiographic_bone_loss, furcation_involvement, il6_level, tnf_alpha) VALUES (:pid, :name, :age, :gender, :cigs, :years, :packYears, :status, :cal, :ppd, :boneLoss, :furcation, :il6, :tnf)");
            $stmt->execute([
                ':pid' => $pid,
                ':name' => $name,
                ':age' => $age,
                ':gender' => $gender,
                ':cigs' => $cigs,
                ':years' => $years,
                ':packYears' => $packYears,
                ':status' => $status,
                ':cal' => $cal,
                ':ppd' => $ppd,
                ':boneLoss' => $boneLoss,
                ':furcation' => $furcation,
                ':il6' => $il6,
                ':tnf' => $tnf
            ]);
            $newId = (int)$pdo->lastInsertId();
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Patient created successfully", "id" => $newId]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to create patient: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        if ($patientId && $input) {
            try {
                $fields = [];
                $params = [':id' => $patientId];
                
                if (isset($input['name'])) { $fields[] = "name = :name"; $params[':name'] = $input['name']; }
                if (isset($input['age'])) { $fields[] = "age = :age"; $params[':age'] = (int)$input['age']; }
                if (isset($input['gender'])) { $fields[] = "gender = :gender"; $params[':gender'] = $input['gender']; }
                if (isset($input['cigarettes_per_day'])) { $fields[] = "cigarettes_per_day = :cigs"; $params[':cigs'] = (int)$input['cigarettes_per_day']; }
                if (isset($input['years_smoking'])) { $fields[] = "years_smoking = :years"; $params[':years'] = (int)$input['years_smoking']; }
                if (isset($input['smoking_status'])) { $fields[] = "smoking_status = :status"; $params[':status'] = $input['smoking_status']; }
                if (isset($input['cal_values'])) { $fields[] = "cal_values = :cal"; $params[':cal'] = json_encode($input['cal_values']); }
                if (isset($input['ppd_values'])) { $fields[] = "ppd_values = :ppd"; $params[':ppd'] = json_encode($input['ppd_values']); }
                if (isset($input['radiographic_bone_loss'])) { $fields[] = "radiographic_bone_loss = :bl"; $params[':bl'] = (double)$input['radiographic_bone_loss']; }
                if (isset($input['furcation_involvement'])) { $fields[] = "furcation_involvement = :fi"; $params[':fi'] = !empty($input['furcation_involvement']) ? 1 : 0; }
                if (isset($input['il6_level'])) { $fields[] = "il6_level = :il6"; $params[':il6'] = (double)$input['il6_level']; }
                if (isset($input['tnf_alpha'])) { $fields[] = "tnf_alpha = :tnf"; $params[':tnf'] = (double)$input['tnf_alpha']; }

                if (!empty($fields)) {
                    $sql = "UPDATE patients SET " . implode(", ", $fields) . " WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                }
            } catch (Exception $e) {}
        }
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Patient updated successfully"]);
        break;

    case 'DELETE':
        if ($patientId) {
            try {
                $stmt = $pdo->prepare("DELETE FROM patients WHERE id = :id");
                $stmt->execute([':id' => $patientId]);
            } catch (Exception $e) {}
        }
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Patient record deleted"]);
        break;
}
?>
