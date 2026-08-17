<?php
// auth/update_profile.php
require_once __DIR__ . "/../config.php";

$data = json_decode(file_get_contents("php://input"), true);
$email = '';
if (is_array($data) && !empty($data['email'])) {
    $email = trim($data['email']);
} else if (!empty($_POST['email'])) {
    $email = trim($_POST['email']);
}

$name = '';
if (is_array($data) && !empty($data['name'])) {
    $name = trim($data['name']);
} else if (!empty($_POST['name'])) {
    $name = trim($_POST['name']);
}

$specialization = isset($data['specialization']) ? trim($data['specialization']) : '';
$clinic_name = isset($data['clinic_name']) ? trim($data['clinic_name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';

$email = strtolower($email);

if (empty($email) || empty($name)) {
    http_response_code(400);
    echo json_encode(array("error" => "Email and Full Name are required."));
    exit();
}

try {
    // Add columns dynamically if missing
    try {
        $conn->exec("ALTER TABLE practitioners ADD COLUMN specialization VARCHAR(255) DEFAULT 'Periodontist Specialist'");
    } catch(Exception $e) {}

    try {
        $conn->exec("ALTER TABLE practitioners ADD COLUMN clinic_name VARCHAR(255) DEFAULT 'SmokPerio AI Dental Clinic'");
    } catch(Exception $e) {}

    try {
        $conn->exec("ALTER TABLE practitioners ADD COLUMN phone VARCHAR(50) DEFAULT ''");
    } catch(Exception $e) {}

    // Update practitioner profile details
    $stmt = $conn->prepare("UPDATE practitioners SET name = :name, specialization = :spec, clinic_name = :clinic, phone = :phone WHERE LOWER(email) = LOWER(:email)");
    $stmt->execute(array(
        ":name" => $name,
        ":spec" => $specialization,
        ":clinic" => $clinic_name,
        ":phone" => $phone,
        ":email" => $email
    ));

    echo json_encode(array(
        "message" => "Profile updated successfully.",
        "name" => $name,
        "specialization" => $specialization,
        "clinic_name" => $clinic_name,
        "phone" => $phone
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Database error: " . $e->getMessage()));
}
?>
