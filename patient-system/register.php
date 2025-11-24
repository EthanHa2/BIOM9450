<?php
header('Content-Type: application/json; charset=UTF-8');

// Allow your Next dev server
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request
    exit;
}

require __DIR__ . '/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body']);
    exit;
}

// Fetch + trim fields
$first_name = trim($data['first_name'] ?? '');
$last_name  = trim($data['last_name'] ?? '');
$email      = trim($data['email'] ?? '');
$password   = $data['password'] ?? '';
$specialty  = trim($data['specialty'] ?? '');
$phone      = trim($data['phone'] ?? '');

$errors = [];

// Basic validation (server-side)
if ($first_name === '') $errors[] = 'First name is required.';
if ($last_name === '')  $errors[] = 'Last name is required.';

if ($email === '') {
    $errors[] = 'Email is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if ($password === '') {
    $errors[] = 'Password is required.';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must contain at least 8 characters.';
}

// Optional: simple AU-style phone check
if ($phone !== '' && !preg_match('/^0[0-9]{9}$/', $phone)) {
    $errors[] = 'Phone should be 10 digits starting with 0.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors),
    ]);
    exit;
}

// Check if email already exists
$checkSql = "SELECT clinician_id FROM clinician WHERE email = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$checkRes = $checkStmt->get_result();

if ($checkRes->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'Email is already registered.',
    ]);
    exit;
}

// Hash password with SHA-256 to match your seed data (SHA2 in SQL)
$password_hash = hash('sha256', $password);

// Default role = clinician
$role = 'clinician';

$sql = "INSERT INTO clinician (email, first_name, last_name, password_hash, specialty, phone, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssssss', $email, $first_name, $last_name, $password_hash, $specialty, $phone, $role);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful! You can now log in.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to register clinician. Please try again.',
    ]);
}
