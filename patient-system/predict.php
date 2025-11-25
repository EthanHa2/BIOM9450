<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$inputData = json_decode(file_get_contents('php://input'), true);

if (!$inputData) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Resolve base directory relative to this file
$baseDir = realpath(__DIR__ . '/../machine_learning');

if (!$baseDir || !is_dir($baseDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Machine learning directory not found.']);
    exit;
}

$pythonPath = $baseDir . DIRECTORY_SEPARATOR . 'venv' . DIRECTORY_SEPARATOR . 'Scripts' . DIRECTORY_SEPARATOR . 'python.exe';
$scriptPath = $baseDir . DIRECTORY_SEPARATOR . 'predict.py';

if (!file_exists($pythonPath)) {
    // Try Mac/Linux path
    $pythonPath = $baseDir . '/venv/bin/python3';
    if (!file_exists($pythonPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Python environment not found.']);
        exit;
    }
}

if (!file_exists($scriptPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Prediction script not found.']);
    exit;
}

// Prepare command
$command = '"' . $pythonPath . '" "' . $scriptPath . '"';

$descriptorspec = [
    0 => ["pipe", "r"],  // stdin
    1 => ["pipe", "w"],  // stdout
    2 => ["pipe", "w"]   // stderr
];

// Set cwd to the machine_learning directory
$process = proc_open($command, $descriptorspec, $pipes, $baseDir);

if (is_resource($process)) {
    fwrite($pipes[0], json_encode($inputData));
    fclose($pipes[0]);

    $output = stream_get_contents($pipes[1]);
    $errors = stream_get_contents($pipes[2]);

    fclose($pipes[1]);
    fclose($pipes[2]);

    $return_value = proc_close($process);

    if ($output) {
        $decoded = json_decode($output, true);
        if ($decoded) {
            echo $output;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Invalid output from model']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Prediction failed']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to start prediction process']);
}
