<?php
// patient-system/login.php

// The API always responds with JSON formatted in UTF-8
header('Content-Type: application/json; charset=UTF-8');

// Allow browser requests from the Next.js frontend running on localhost:3000.
// Credentials must be enabled so PHP sessions (cookies) can be shared securely.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// If the browser sends a CORS preflight request (OPTIONS), do not process login logic.
// Simply return and end the request.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Start a PHP session so the logged-in clinician can be tracked across requests.
session_start();

require __DIR__ . '/db.php';  // Establish database connection

// Read raw request body and decode JSON into an associative array.
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// If the data could not be decoded into an array, return an error immediately.
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON body',
    ]);
    exit;
}

// Extract and sanitise user input fields.
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Require both email and password before continuing.
if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.',
    ]);
    exit;
}

// Hash the supplied password with SHA-256 so it can be safely compared with stored credentials.
// This must match the hashing strategy used when the user registered.
$password_hash = hash('sha256', $password);

// Check whether a clinician exists with matching email and hashed password.
$sql = "SELECT clinician_id, first_name, last_name, email, role
        FROM clinician
        WHERE email = ? AND password_hash = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $email, $password_hash);
$stmt->execute();
$res = $stmt->get_result();

// If a matching clinician was found, complete login steps.
if ($user = $res->fetch_assoc()) {

    // Store key details in a secure session for authenticated API requests.
    $_SESSION['clinician_id'] = (int)$user['clinician_id'];
    $_SESSION['role']         = $user['role'];
    $_SESSION['email']        = $user['email'];

    // Record login activity, including IP address for audit history.
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $logSql = "INSERT INTO user_activity (clinician_id, activity_type, ip_address)
               VALUES (?, 'login', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param('is', $user['clinician_id'], $ip);
    $logStmt->execute();

    // Prepare minimal clinician data to return to the frontend application.
    $responseUser = [
        'clinician_id' => (int)$user['clinician_id'],
        'email'        => $user['email'],
        'name'         => $user['first_name'] . ' ' . $user['last_name'],
        'role'         => $user['role'],
    ];

    // Successful response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user'    => $responseUser,
    ]);

} else {
    // If no matching credentials were found, respond with an authentication error.
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password.',
    ]);
}
