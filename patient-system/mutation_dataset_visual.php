<?php
// mutation_table.php
// Returns a complete list of mutation records to support frontend tables and filtering tools.

header('Content-Type: application/json; charset=UTF-8');

// Allow CORS from the Next.js development environment and ensure credentials (cookies/sessions)
// can be passed if needed for authentication.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Handle preflight requests triggered by CORS for GET API calls.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php'; // Database connection required for running SQL queries

/**
 * Retrieve the complete dataset of mutation entries.
 * The table is populated during CSV import, and this endpoint allows the frontend
 * to display a full browsable and filterable table, including mutation position,
 * classification, and associated gene and cancer type.
 *
 * Ordering by mutation_id ensures a consistent, chronological display of imported data.
 */
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

// Return an internal server error response if the query fails.
if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch mutation data.',
    ]);
    exit;
}

// Structure response data to match the format expected by the React mutation table.
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

// Successful API response returned to the frontend.
echo json_encode([
    'success' => true,
    'data'    => $data,
]);
