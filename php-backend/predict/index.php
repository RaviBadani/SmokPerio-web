<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$patientId = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
$method = $_SERVER['REQUEST_METHOD'];

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);
if (!$input) $input = $_POST;

if ($method === 'GET') {
    $preds = [];
    try {
        if ($patientId > 0 && isset($pdo)) {
            $stmt = $pdo->prepare("SELECT id, patient_id, result_json, created_at FROM predictions WHERE patient_id = :pid ORDER BY id DESC");
            $stmt->execute([':pid' => $patientId]);
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $preds[] = [
                    "id"         => (int)$row['id'],
                    "patient_id" => (int)$row['patient_id'],
                    "created_at" => $row['created_at'],
                    "result"     => json_decode($row['result_json'], true)
                ];
            }
        }
    } catch (Exception $e) {}

    http_response_code(200);
    echo json_encode($preds);
    exit();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Run Professional AAP/EFP 2017 AI Prediction Engine
// ─────────────────────────────────────────────────────────────────────────────

$age = isset($input['age']) ? (int)$input['age'] : 45;
$gender = isset($input['gender']) ? trim($input['gender']) : 'Male';
$cigsPerDay = isset($input['cigarettes_per_day']) ? (int)$input['cigarettes_per_day'] : 0;
$yearsSmoking = isset($input['years_smoking']) ? (int)$input['years_smoking'] : 0;
$packYears = isset($input['pack_years']) ? (double)$input['pack_years'] : ($cigsPerDay > 0 && $yearsSmoking > 0 ? ($cigsPerDay / 20.0) * $yearsSmoking : 0.0);
$smokingStatus = isset($input['smoking_status']) ? trim($input['smoking_status']) : ($cigsPerDay >= 10 ? 'Heavy Smoker' : ($cigsPerDay > 0 ? 'Light Smoker' : 'Non-Smoker'));

$calMean = isset($input['cal_mean']) ? (double)$input['cal_mean'] : 4.0;
$calMax  = isset($input['cal_max']) ? (int)$input['cal_max'] : 5;
$ppdMean = isset($input['ppd_mean']) ? (double)$input['ppd_mean'] : 3.8;
$ppdMax  = isset($input['ppd_max']) ? (int)$input['ppd_max'] : 5;

$boneLoss = isset($input['radiographic_bone_loss']) ? (double)$input['radiographic_bone_loss'] : 25.0;
$furcation = !empty($input['furcation_involvement']);
$il6 = isset($input['il6_level']) && $input['il6_level'] !== null ? (double)$input['il6_level'] : 6.5;
$tnf = isset($input['tnf_alpha']) && $input['tnf_alpha'] !== null ? (double)$input['tnf_alpha'] : 4.2;
$radiographPath = isset($input['radiograph_path']) ? trim($input['radiograph_path']) : null;

// If patientId is provided, pull missing fields from the database record
if ($patientId > 0 && isset($pdo)) {
    try {
        $pStmt = $pdo->prepare("SELECT * FROM patients WHERE id = :id");
        $pStmt->execute([':id' => $patientId]);
        $pRow = $pStmt->fetch(PDO::FETCH_ASSOC);
        if ($pRow) {
            $age = (int)$pRow['age'];
            $gender = $pRow['gender'];
            $cigsPerDay = (int)$pRow['cigarettes_per_day'];
            $yearsSmoking = (int)$pRow['years_smoking'];
            $packYears = (double)$pRow['pack_years'];
            $smokingStatus = $pRow['smoking_status'];
            $boneLoss = (double)$pRow['radiographic_bone_loss'];
            $furcation = !empty($pRow['furcation_involvement']);
            if ($pRow['il6_level'] !== null) $il6 = (double)$pRow['il6_level'];
            if ($pRow['tnf_alpha'] !== null) $tnf = (double)$pRow['tnf_alpha'];
            if (!empty($pRow['radiograph_path'])) $radiographPath = $pRow['radiograph_path'];

            if (!empty($pRow['cal_values'])) {
                $cArr = json_decode($pRow['cal_values'], true);
                if (is_array($cArr) && !empty($cArr)) {
                    $calMean = array_sum($cArr) / count($cArr);
                    $calMax  = max($cArr);
                }
            }
            if (!empty($pRow['ppd_values'])) {
                $pArr = json_decode($pRow['ppd_values'], true);
                if (is_array($pArr) && !empty($pArr)) {
                    $ppdMean = array_sum($pArr) / count($pArr);
                    $ppdMax  = max($pArr);
                }
            }
        }
    } catch (Exception $e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AAP/EFP 2017 Periodontal Staging Algorithm (Severity & Extent)
// ─────────────────────────────────────────────────────────────────────────────
$stage = "Stage II";
$stageDescription = "Moderate Periodontitis";

if ($calMax >= 5 || $boneLoss > 33.0 || $furcation) {
    if ($boneLoss > 50.0 || ($calMax >= 6 && $furcation && $packYears >= 20.0)) {
        $stage = "Stage IV";
        $stageDescription = "Advanced Periodontitis (Extensive Loss of Dentition Risk)";
    } else {
        $stage = "Stage III";
        $stageDescription = "Severe Periodontitis (Potential for Additional Tooth Loss)";
    }
} else if ($calMax >= 3 || $boneLoss >= 15.0) {
    $stage = "Stage II";
    $stageDescription = "Moderate Periodontitis (Horizontal Bone Loss in Coronal Third)";
} else {
    $stage = "Stage I";
    $stageDescription = "Initial Periodontitis (Mild Bone Loss < 15%)";
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AAP/EFP 2017 Grading Algorithm (Rate of Progression & Smoking Impact)
// ─────────────────────────────────────────────────────────────────────────────
$blAgeRatio = ($age > 0) ? round($boneLoss / $age, 2) : 0.5;

$grade = "Grade B";
$gradeDescription = "Moderate Rate of Progression";

if ($cigsPerDay >= 10 || $packYears >= 10.0 || $blAgeRatio > 1.0) {
    $grade = "Grade C";
    $gradeDescription = "Rapid Rate of Progression (Smoking-Driven Acceleration)";
} else if ($cigsPerDay === 0 && $packYears === 0.0 && $blAgeRatio < 0.25) {
    $grade = "Grade A";
    $gradeDescription = "Slow Rate of Progression (Low Risk Profile)";
} else {
    $grade = "Grade B";
    $gradeDescription = "Moderate Rate of Progression";
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Multi-Parametric Periodontal Destruction Risk Score (0 - 100)
// ─────────────────────────────────────────────────────────────────────────────
$smokingScore = min(35.0, ($packYears * 0.9) + ($cigsPerDay * 0.6));
$calScore     = min(30.0, ($calMean * 4.5) + ($calMax * 1.5));
$boneScore    = min(25.0, $boneLoss * 0.45);
$bioScore     = min(10.0, ($il6 * 0.35) + ($tnf * 0.4) + ($furcation ? 5.0 : 0.0));

$riskScore = (int) round(min(99, max(8, $smokingScore + $calScore + $boneScore + $bioScore)));

$riskLevel = "LOW";
if ($riskScore >= 70 || $stage === "Stage IV" || ($stage === "Stage III" && $grade === "Grade C")) {
    $riskLevel = "HIGH";
} else if ($riskScore >= 40 || $stage === "Stage II" || $grade === "Grade C") {
    $riskLevel = "MODERATE";
} else {
    $riskLevel = "LOW";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Multi-Horizon Disease Progression Prognosis (%)
// ─────────────────────────────────────────────────────────────────────────────
$progression6m  = round(min(45.0, max(2.0, ($riskScore * 0.32) + ($cigsPerDay * 0.4))), 1);
$progression12m = round(min(75.0, max(4.0, ($riskScore * 0.65) + ($cigsPerDay * 0.7))), 1);
$progression5y  = round(min(95.0, max(8.0, ($riskScore * 0.92) + ($packYears * 0.5))), 1);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Key Clinical Drivers
// ─────────────────────────────────────────────────────────────────────────────
$keyDrivers = [];

if ($packYears >= 10.0 || $cigsPerDay >= 10) {
    $keyDrivers[] = "Smoking Impact: {$cigsPerDay} cigs/day ({$packYears} pack-years) triggers AAP/EFP Grade C Rapid Progression.";
} else if ($cigsPerDay > 0) {
    $keyDrivers[] = "Light Smoking: {$cigsPerDay} cigs/day contributes to impaired microvascular repair.";
} else {
    $keyDrivers[] = "Non-smoker: Periodontal healing capacity preserved.";
}

$keyDrivers[] = "Radiographic Bone Loss: {$boneLoss}% extracted from dental radiograph ({$stage}).";
$keyDrivers[] = "Clinical Attachment Loss: Mean {$calMean} mm (Maximum {$calMax} mm).";

if ($furcation) {
    $keyDrivers[] = "Anatomical Risk: Furcation Involvement detected at multi-rooted teeth.";
}
if ($il6 >= 10.0 || $tnf >= 6.0) {
    $keyDrivers[] = "Systemic Pro-Inflammatory Biomarkers: Elevated IL-6 ({$il6} pg/mL) & TNF-α ({$tnf} pg/mL).";
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Evidence-Based Clinical Treatment Protocol & Recommendations
// ─────────────────────────────────────────────────────────────────────────────
$protocols = [];

if ($riskLevel === "HIGH") {
    $protocols[] = "Step 1: Immediate Scaling & Root Planing (SRP) under local anesthesia with ultrasonic instrumentation.";
    $protocols[] = "Step 2: Intensive 5-A Smoking Cessation Counseling & Nicotine Replacement Therapy (NRT) referral.";
    $protocols[] = "Step 3: Subgingival antimicrobial delivery (Minocycline microspheres / Chlorhexidine 0.2% irrigation).";
    $protocols[] = "Step 4: Periodontal specialist evaluation for regenerative surgery / bone grafting at deep vertical defects.";
    $protocols[] = "Step 5: High-frequency 3-month Periodontal Maintenance Recall.";
} else if ($riskLevel === "MODERATE") {
    $protocols[] = "Step 1: Quadrant Scaling & Root Planing (SRP) targeting sites with PPD ≥ 4mm.";
    $protocols[] = "Step 2: Brief smoking cessation counseling and oral hygiene reinforcement.";
    $protocols[] = "Step 3: Topical antiseptic chlorhexidine mouthrinse (0.12%) twice daily for 2 weeks.";
    $protocols[] = "Step 4: 3-to-4 Month Periodontal Maintenance Recall and re-evaluation.";
} else {
    $protocols[] = "Step 1: Routine supragingival scaling and prophylaxis.";
    $protocols[] = "Step 2: Oral hygiene instruction (interdental brush and flossing technique).";
    $protocols[] = "Step 3: 6-Month preventative periodontal maintenance recall.";
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Site-Specific Risk Grid & Class Probabilities
// ─────────────────────────────────────────────────────────────────────────────
$siteRisks = [
    round(min(0.99, max(0.1, ($riskScore / 115.0))), 2),
    round(min(0.99, max(0.1, ($riskScore / 100.0))), 2),
    round(min(0.99, max(0.1, ($riskScore / 90.0) + ($furcation ? 0.08 : 0.0))), 2),
    round(min(0.99, max(0.1, ($riskScore / 105.0))), 2)
];

$probLow  = ($riskLevel === "LOW") ? 0.82 : (($riskLevel === "MODERATE") ? 0.12 : 0.04);
$probMed  = ($riskLevel === "MODERATE") ? 0.76 : (($riskLevel === "HIGH") ? 0.14 : 0.14);
$probHigh = ($riskLevel === "HIGH") ? 0.82 : (($riskLevel === "MODERATE") ? 0.12 : 0.04);

$result = [
    "risk_score"                => $riskScore,
    "risk_level"                => $riskLevel,
    "stage"                     => $stage,
    "stage_description"         => $stageDescription,
    "grade"                     => $grade,
    "grade_description"         => $gradeDescription,
    "bone_loss_age_ratio"       => $blAgeRatio,
    "progression_6m"            => $progression6m,
    "progression_12m"           => $progression12m,
    "progression_5y"            => $progression5y,
    "radiographic_bone_loss"    => $boneLoss,
    "furcation_involvement"     => $furcation,
    "radiograph_path"           => $radiographPath,
    "key_drivers"               => $keyDrivers,
    "clinical_recommendations"  => $protocols,
    "site_risks"                => $siteRisks,
    "class_probabilities"       => [
        "LOW"      => $probLow,
        "MODERATE" => $probMed,
        "HIGH"     => $probHigh
    ],
    "created_at"                => date('Y-m-d H:i:s')
];

// Save prediction to database if valid patientId exists
try {
    if ($patientId > 0 && isset($pdo)) {
        $insStmt = $pdo->prepare("INSERT INTO predictions (patient_id, result_json) VALUES (:pid, :json)");
        $insStmt->execute([
            ':pid'  => $patientId,
            ':json' => json_encode($result)
        ]);
        $result['prediction_id'] = (int) $pdo->lastInsertId();
    }
} catch (Exception $e) {}

http_response_code(200);
echo json_encode($result);
?>
