<?php
// All responses are returned in JSON format to match frontend expectations.
header('Content-Type: application/json; charset=UTF-8');

// Allow requests from the Next.js frontend and include credentials so session-protected
// routes can be accessed if needed.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Handle CORS preflight requests triggered by the browser.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php'; // Database connection required for query execution

/**
 * Retrieve mutation counts grouped by chromosome.
 * This summary data supports visualisations that highlight the prevalence of
 * mutations across the human genome. Empty or null chromosome entries are ignored
 * to avoid distorting distribution patterns caused by incomplete records.
 */
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

// Check for query failure and return an internal server error if needed.
if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch chromosome distribution.',
    ]);
    exit;
}

// Format each row for compatibility with frontend chart components.
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'chromosome'     => $row['chromosome'],
        'mutation_count' => (int)$row['mutation_count'],
    ];
}

// Successful response returned to the frontend.
echo json_encode([
    'success' => true,
    'data'    => $data,
]);
