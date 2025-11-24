<?php
// mutation_table.php
header('Content-Type: application/json; charset=UTF-8');

// CORS for your Next.js dev app
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php';

// Fetch all mutation rows from the table populated by your CSV
$sql = "
    SELECT 
        mutation_id,
        icgc_specimen_id,
        chromosome,
        chromosome_start,
        chromosome_end,
        mutation_type,
        mutated_from_allele,
        mutated_to_allele,
        consequence_type,
        gene_affected,
        cancer_type
    FROM mutation
    ORDER BY mutation_id ASC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch mutation data.',
    ]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'mutation_id'          => (int)$row['mutation_id'],
        'icgc_specimen_id'     => $row['icgc_specimen_id'],
        'chromosome'           => $row['chromosome'],
        'chromosome_start'     => (int)$row['chromosome_start'],
        'chromosome_end'       => (int)$row['chromosome_end'],
        'mutation_type'        => $row['mutation_type'],
        'mutated_from_allele'  => $row['mutated_from_allele'],
        'mutated_to_allele'    => $row['mutated_to_allele'],
        'consequence_type'     => $row['consequence_type'],
        'gene_affected'        => $row['gene_affected'],
        'cancer_type'          => $row['cancer_type'],
    ];
}

echo json_encode([
    'success' => true,
    'data'    => $data,
]);
