<?php
header("Content-Type: application/json");

// Read JSON input from React
$input = json_decode(file_get_contents("php://input"), true);

// Ensure all required fields exist
$required = ["chromosome_start", "chromosome_end", "mutated_from_allele", "mutated_to_allele", "gene_affected"];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing field: $field"]);
        exit;
    }
}

// Call Python script
$command = 'predict.py';
$process = proc_open(
    $command,
    [
        ["pipe", "r"], // stdin
        ["pipe", "w"], // stdout
        ["pipe", "w"]  // stderr
    ],
    $pipes
);

if (is_resource($process)) {
    fwrite($pipes[0], json_encode($input));
    fclose($pipes[0]);

    $result = stream_get_contents($pipes[1]);
    fclose($pipes[1]);

    $error = stream_get_contents($pipes[2]);
    fclose($pipes[2]);

    $return_value = proc_close($process);

    if ($return_value !== 0 || !empty($error)) {
        http_response_code(500);
        echo json_encode(["error" => "Prediction failed", "details" => $error]);
    } else {
        echo $result;
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to start Python process"]);
}
?>