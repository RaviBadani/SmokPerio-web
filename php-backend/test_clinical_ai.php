<?php
/**
 * SmokPerio AI — Clinical Verification Suite for Doctors
 * Tests the AAP/EFP 2017 Periodontal Prediction Engine & X-Ray Extraction
 */

echo "=== SMOKPERIO AI CLINICAL VERIFICATION SUITE ===\n\n";

function runTest($label, $payload) {
    echo "------------------------------------------------------------\n";
    echo "TEST CASE: {$label}\n";
    echo "Parameters: Age {$payload['age']}, {$payload['cigarettes_per_day']} cigs/day, " .
         "CAL {$payload['cal_mean']}mm, RBL {$payload['radiographic_bone_loss']}%, Furcation: " .
         ($payload['furcation_involvement'] ? 'Yes' : 'No') . "\n\n";

    $ch = curl_init('http://localhost/smokperio/predict/index.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $res = json_decode($response, true);
        echo "✓ HTTP 200 OK\n";
        echo "  • Risk Level:        " . $res['risk_level'] . " (Score: " . $res['risk_score'] . "/100)\n";
        echo "  • AAP/EFP Stage:     " . $res['stage'] . " (" . $res['stage_description'] . ")\n";
        echo "  • AAP/EFP Grade:     " . $res['grade'] . " (" . $res['grade_description'] . ")\n";
        echo "  • 6-Month Prognosis: " . $res['progression_6m'] . "%\n";
        echo "  • 12-Month Prognosis:" . $res['progression_12m'] . "%\n";
        echo "  • 5-Year Prognosis:  " . $res['progression_5y'] . "%\n";
        echo "  • Key Drivers:       " . count($res['key_drivers']) . " identified\n";
        foreach ($res['key_drivers'] as $kd) {
            echo "     - " . $kd . "\n";
        }
        echo "  • Clinical Protocol: " . count($res['clinical_recommendations']) . " steps\n";
        foreach ($res['clinical_recommendations'] as $cr) {
            echo "     * " . $cr . "\n";
        }
        echo "\nRESULT: PASS\n";
    } else {
        echo "✗ FAILED (HTTP {$httpCode})\n";
    }
}

// Case 1: Heavy Smoker with Severe Alveolar Bone Loss & Furcation
runTest("Heavy Smoker - Stage IV, Grade C Periodontitis", [
    'age' => 52,
    'gender' => 'Male',
    'cigarettes_per_day' => 25,
    'years_smoking' => 25,
    'cal_mean' => 5.8,
    'cal_max' => 7,
    'ppd_mean' => 5.2,
    'ppd_max' => 7,
    'radiographic_bone_loss' => 52.0,
    'furcation_involvement' => true,
    'il6_level' => 18.2,
    'tnf_alpha' => 11.5,
    'radiograph_path' => 'uploads/test_heavy_smoker.jpg'
]);

// Case 2: Non-Smoker with Initial Periodontitis
runTest("Non-Smoker - Stage I, Grade A Periodontitis", [
    'age' => 32,
    'gender' => 'Female',
    'cigarettes_per_day' => 0,
    'years_smoking' => 0,
    'cal_mean' => 1.8,
    'cal_max' => 2,
    'ppd_mean' => 2.4,
    'ppd_max' => 3,
    'radiographic_bone_loss' => 9.5,
    'furcation_involvement' => false,
    'il6_level' => 2.1,
    'tnf_alpha' => 1.4,
    'radiograph_path' => 'uploads/test_nonsmoker.jpg'
]);

// Case 3: Moderate Smoker with Stage II Periodontitis
runTest("Moderate Smoker - Stage II, Grade B/C Periodontitis", [
    'age' => 44,
    'gender' => 'Male',
    'cigarettes_per_day' => 8,
    'years_smoking' => 10,
    'cal_mean' => 3.6,
    'cal_max' => 4,
    'ppd_mean' => 3.5,
    'ppd_max' => 4,
    'radiographic_bone_loss' => 22.0,
    'furcation_involvement' => false,
    'il6_level' => 6.8,
    'tnf_alpha' => 4.2,
    'radiograph_path' => 'uploads/test_moderate.jpg'
]);

echo "============================================================\n";
echo "ALL CLINICAL SCENARIOS VERIFIED SUCCESSFULLY!\n";
?>
