<?php
// All responses are returned as JSON for frontend consumption.
header('Content-Type: application/json; charset=UTF-8');

// Allow API access from the Next.js development server.
// Credentials (cookies) are enabled to support future authenticated operations.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Browsers may send an OPTIONS request to verify CORS permissions.
// If so, the request should end here without running registration logic.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/db.php';  // Load database connection

// Retrieve JSON request body and decode it into an array.
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

// If JSON cannot be parsed, return a bad request response.
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body']);
    exit;
}

// Extract and sanitise input fields. Trim removes surrounding whitespace.
$first_name = trim($data['first_name'] ?? '');
$last_name  = trim($data['last_name'] ?? '');
$email      = trim($data['email'] ?? '');
$password   = $data['password'] ?? '';
$specialty  = trim($data['specialty'] ?? '');
$phone      = trim($data['phone'] ?? '');

$errors = [];

// Server-side validation to protect data integrity.
if ($first_name === '') $errors[] = 'First name is required.';
if ($last_name === '')  $errors[] = 'Last name is required.';

// Email must be provided and formatted correctly.
if ($email === '') {
    $errors[] = 'Email is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

// Password must be present and sufficiently strong.
if ($password === '') {
    $errors[] = 'Password is required.';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must contain at least 8 characters.';
}

// Optional phone validation for Australian-style numbers (10 digits starting with 0).
if ($phone !== '' && !preg_match('/^0[0-9]{9}$/', $phone)) {
    $errors[] = 'Phone should be 10 digits starting with 0.';
}

// If any validation errors occurred, return a 422 response indicating unprocessable data.
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors),
    ]);
    exit;
}

// Before creating a new clinician record, confirm that the email is not already registered.
$checkSql = "SELECT clinician_id FROM clinician WHERE email = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$checkRes = $checkStmt->get_result();

// If a record already exists, return a 409 conflict error.
if ($checkRes->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'Email is already registered.',
    ]);
    exit;
}

// Passwords are stored securely using SHA-256 hashing.
// This must match the hashing used when logging in.
$password_hash = hash('sha256', $password);

// All newly created users are assigned the default role of clinician.
$role = 'clinician';

// Proceed with inserting the clinician record into the database.
$sql = "INSERT INTO clinician (email, first_name, last_name, password_hash, specialty, phone, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sssssss', $email, $first_name, $last_name, $password_hash, $specialty, $phone, $role);

// If record creation succeeds, inform the user that they can proceed to log in.
// Otherwise, return a server error message.
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
