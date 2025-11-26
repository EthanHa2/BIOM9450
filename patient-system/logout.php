<?php
// All responses are returned in JSON format for consistency with frontend expectations.
header('Content-Type: application/json; charset=UTF-8');

// Allow logout requests from the Next.js frontend and include credentials so the server
// can identify the user's active session when the request is made.
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Handle preflight CORS requests made by the browser.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require __DIR__ . '/session_bootstrap.php';  // Ensure session is available for logout
require __DIR__ . '/db.php';                 // Database connection used for activity logging

// If a clinician is logged in, record their logout event before ending the session.
// Logging user actions provides traceability and supports audit requirements.
if (isset($_SESSION['clinician_id'])) {
    $clinician_id = (int)$_SESSION['clinician_id'];
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    $logSql = "INSERT INTO user_activity (clinician_id, activity_type, ip_address)
               VALUES (?, 'logout', ?)";
    $logStmt = $conn->prepare($logSql);
    $logStmt->bind_param('is', $clinician_id, $ip);
    $logStmt->execute();
}

// Remove all session variables stored on the server.
$_SESSION = [];

// If PHP is using cookies to track sessions, explicitly clear the session cookie.
// This prevents clients from reusing expired session identifiers.
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',                     // Empty value invalidates the cookie
        [
            'expires'  => time() - 42000,               // Expire the cookie in the past
            'path'     => $params['path'],              // Match original cookie path
            'domain'   => $params['domain'],            // Match domain settings
            'secure'   => $params['secure'],            // Enforce HTTPS if enabled
            'httponly' => $params['httponly'],          // Mitigate JavaScript access
            'samesite' => $params['samesite'] ?? 'Lax', // Prevent cross-site misuse
        ]
    );
}

// Fully terminate the session on the server to complete the logout process.
session_destroy();

// Respond to the client confirming that logout has been completed.
echo json_encode([
    'success' => true,
    'message' => 'You have been logged out securely.',
]);
