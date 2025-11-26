<?php

// serialise json
function json(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

// get json body & deserialise json
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json(400, ['error' => 'Invalid JSON body.']);
    }
    return $data;
}

// not found error
class NotFoundException extends RuntimeException {}