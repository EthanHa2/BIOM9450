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
require_once __DIR__ . '/ClinicianController.php';
require_once __DIR__ . '/helper.php';


// parse path
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $path);

// supported resources
$validResources = ['patient', 'mutation', 'diagnostic', 'phenotype', 'clinician'];

// find the first part that matches a valid resource
$resourceIndex = -1;
foreach ($parts as $index => $part) {
    if (in_array($part, $validResources, true)) {
        $resourceIndex = $index;
        break;
    }
}

if ($resourceIndex === -1) {
    json(404, ['error' => 'Resource not found.', 'debug_parts' => $parts]);
}

$resource = $parts[$resourceIndex];
$nextPart = $parts[$resourceIndex + 1] ?? null;

if ($nextPart !== null && ctype_digit($nextPart)) {
    $id = (int)$nextPart;
    $sub = $parts[$resourceIndex + 2] ?? null;
} else {
    $id = null;
    $sub = $nextPart;
}
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
        // clinician API
        case 'clinician':
            $controller = new ClinicianController($pdo);
            $controller->handle($id, $sub, $method);
            break;
        default:
            json(404, ['error' => 'Resource not found.']);
    }
} catch (InvalidArgumentException $e) { // invalid argument
    json(422, ['error' => $e->getMessage()]);
} catch (RuntimeException $e) { // client error
    json(400, ['error' => $e->getMessage()]);
} catch (Throwable $e) { // server error
    error_log("Server error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    json(500, ['error' => 'Server error', 'details' => $e->getMessage()]);
}
