<?php
header('Content-Type: application/json; charset=UTF-8');

// CORS for Next.js
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") exit;

require __DIR__ . '/db.php';

// Fetch patients with diagnosis + phenotypes + mutations using GROUP_CONCAT
$sql = "
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.sex,
    p.dob,
    d.diagnosis_type,
    GROUP_CONCAT(DISTINCT ph.description SEPARATOR '; ') AS phenotypes,
    GROUP_CONCAT(DISTINCT m.gene_affected SEPARATOR ', ') AS genes
FROM patient p
LEFT JOIN diagnostic d ON p.patient_id = d.patient_id
LEFT JOIN phenotype ph ON p.patient_id = ph.patient_id
LEFT JOIN patient_mutation pm ON p.patient_id = pm.patient_id
LEFT JOIN mutation m ON pm.mutation_id = m.mutation_id
GROUP BY p.patient_id, p.first_name, p.last_name, p.sex, p.dob, d.diagnosis_type
ORDER BY p.patient_id ASC;
";

$result = $conn->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query error"]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        "patient_id" => (int)$row["patient_id"],
        "name" => $row["first_name"] . " " . $row["last_name"],
        "sex" => $row["sex"],
        "dob" => $row["dob"],
        "diagnosis" => $row["diagnosis_type"] ?: "N/A",
        "phenotypes" => $row["phenotypes"] ?: "None recorded",
        "genes" => $row["genes"] ?: "None recorded"
    ];
}

echo json_encode(["success" => true, "data" => $data]);
