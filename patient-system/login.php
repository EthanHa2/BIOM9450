<?php
// patient-system/login.php

header('Content-Type: application/json; charset=UTF-8');

// CORS for Next dev on localhost:3000
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request
    exit;
}

session_start();
require __DIR__ . '/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON body',
    ]);
    exit;
}

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.',
    ]);
    exit;
}

// Hash password same way as registration / seed data
$password_hash = hash('sha256', $password);

// Look up clinician
$sql = "SELECT clinician_id, first_name, last_name, email, role
        FROM clinician
        WHERE email = ? AND password_hash = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $email, $password_hash);
$stmt->execute();
$res = $stmt->get_result();

if ($user = $res->fetch_assoc()) {
    // Set session for later authenticated requests (if you use them)
    $_SESSION['clinician_id'] = (int)$user['clinician_id'];
    $_SESSION['role']         = $user['role'];
    $_SESSION['email']        = $user['email'];

    // Log login activity
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $logSql = "INSERT INTO user_activity (clinician_id, activity_type, ip_address)
               VALUES (?, 'login', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param('is', $user['clinician_id'], $ip);
    $logStmt->execute();

    // Build user object for frontend
    $responseUser = [
        'clinician_id' => (int)$user['clinician_id'],
        'email'        => $user['email'],
        'name'         => $user['first_name'] . ' ' . $user['last_name'],
        'role'         => $user['role'], // optional, in case you want it
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user'    => $responseUser,
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password.',
    ]);
}
