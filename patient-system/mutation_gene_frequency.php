<?php
// mutation_gene_hotspots.php
// Retrieves the top 10 most frequently mutated genes.
// This data supports the "Gene Hotspots" bar chart in the mutation visualisation page.

header('Content-Type: application/json; charset=UTF-8');

// Allow requests from the Next.js development environment
// and enable sending cookies if authentication is added later.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Allow CORS preflight requests to complete without running the script.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php'; // Establish a database connection

/**
 * Query: Identify the most commonly mutated genes.
 * - gene_affected must not be empty/null to avoid meaningless statistics.
 * - GROUP BY groups mutations by gene symbol.
 * - ORDER BY mutation_count DESC ranks genes by mutation frequency.
 * - LIMIT 10 restricts the result to the top 10 most frequently mutated genes
 *   to avoid overcrowding the frontend bar chart.
 */
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

// If the SQL query fails, return a 500 error with a descriptive message.
if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch gene hotspots.',
    ]);
    exit;
}

// Format the results into a structured array for JSON output.
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'gene_affected'  => $row['gene_affected'],
        'mutation_count' => (int)$row['mutation_count'],
    ];
}

// Successful JSON response returned to the frontend.
echo json_encode([
    'success' => true,
    'data'    => $data,
]);
