<?php
// mutation_gene_hotspots.php
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

// Top 10 most frequently mutated genes
$sql = "
    SELECT 
        gene_affected,
        COUNT(*) AS mutation_count
    FROM mutation
    WHERE gene_affected IS NOT NULL AND gene_affected <> ''
    GROUP BY gene_affected
    ORDER BY mutation_count DESC
    LIMIT 10
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch gene hotspots.',
    ]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'gene_affected'  => $row['gene_affected'],
        'mutation_count' => (int)$row['mutation_count'],
    ];
}

echo json_encode([
    'success' => true,
    'data'    => $data,
]);
