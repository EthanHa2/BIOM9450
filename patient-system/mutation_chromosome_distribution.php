<?php
// mutation_chr_distribution.php
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

// Count mutations per chromosome
$sql = "
    SELECT 
        chromosome,
        COUNT(*) AS mutation_count
    FROM mutation
    WHERE chromosome IS NOT NULL AND chromosome <> ''
    GROUP BY chromosome
    ORDER BY chromosome
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch chromosome distribution.',
    ]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'chromosome'     => $row['chromosome'],
        'mutation_count' => (int)$row['mutation_count'],
    ];
}

echo json_encode([
    'success' => true,
    'data'    => $data,
]);
