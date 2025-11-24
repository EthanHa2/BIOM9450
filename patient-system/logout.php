<?php
header('Content-Type: application/json; charset=UTF-8');

// CORS for Next dev
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/db.php';

// Log logout before destroying session
if (isset($_SESSION['clinician_id'])) {
    $clinician_id = (int)$_SESSION['clinician_id'];
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    $logSql = "INSERT INTO user_activity (clinician_id, activity_type, ip_address)
               VALUES (?, 'logout', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param('is', $clinician_id, $ip);
    $logStmt->execute();
}

// Clear all session data
$_SESSION = [];

// Delete session cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'domain'   => $params['domain'],
            'secure'   => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]
    );
}

// Destroy the session on the server
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'You have been logged out securely.',
]);
