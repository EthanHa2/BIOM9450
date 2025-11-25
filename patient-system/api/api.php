<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Patient.php';
require_once __DIR__ . '/../includes/Clinician.php';
require_once __DIR__ . '/../includes/Mutation.php';
require_once __DIR__ . '/../includes/Diagnostic.php';
require_once __DIR__ . '/../includes/Phenotype.php';
require_once __DIR__ . '/PatientController.php';
require_once __DIR__ . '/MutationController.php';
require_once __DIR__ . '/DiagnosticController.php';
require_once __DIR__ . '/PhenotypeController.php';


// helper functions
function json_response(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(400, ['error' => 'Invalid JSON body.']);
    }
    return $data;
}

// parse path
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Supported resources
$validResources = ['patient', 'mutation', 'diagnostic', 'phenotype'];

// Find the first part that matches a valid resource
$resourceIndex = -1;
foreach ($parts as $index => $part) {
    if (in_array($part, $validResources, true)) {
        $resourceIndex = $index;
        break;
    }
}

if ($resourceIndex === -1) {
    json_response(404, ['error' => 'Resource not found.', 'debug_parts' => $parts]);
}

$resource = $parts[$resourceIndex];
$id = isset($parts[$resourceIndex + 1]) ? (int)$parts[$resourceIndex + 1] : null;
$sub = $parts[$resourceIndex + 2] ?? null;
$method = $_SERVER['REQUEST_METHOD'];


try {
    switch ($resource) {
        // patient API
        case 'patient':
            $controller = new PatientController($pdo);
            $controller->handle($id, $sub, $method);
            break;
        // mutation API
        case 'mutation':
            $controller = new MutationController($pdo);
            $controller->handle($id, $sub, $method);
            break;
        // diagnostic API
        case 'diagnostic':
            $controller = new DiagnosticController($pdo);
            $controller->handle($id, $sub, $method);
            break;
        // phenotype API
        case 'phenotype':
            $controller = new PhenotypeController($pdo);
            $controller->handle($id, $sub, $method);
            break;
        default:
            json_response(404, ['error' => 'Resource not found.']);
    }
} catch (InvalidArgumentException $e) { // invalid argument
    json_response(422, ['error' => $e->getMessage()]);
} catch (RuntimeException $e) { // client error
    json_response(400, ['error' => $e->getMessage()]);
} catch (Throwable $e) { // server error
    error_log("Server error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    json_response(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}
