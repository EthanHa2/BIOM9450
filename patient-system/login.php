<?php
session_start();
require 'db.php';

// Security headers
header("Content-Type: application/json");
// Change * to url once in production
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit;
}

// Receive json data
$data = json_decode(file_get_contents("php://input"), true);
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $username = trim($data['username'] ?? "");
  $password = $data['password'] ?? "";

  $stmt = $conn->prepare("SELECT clinician_id, username, password_hash FROM clinician WHERE username=? LIMIT 1");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $result = $stmt->get_result();
  $user = $result->fetch_assoc();

  if ($user && password_verify($password, $user['password_hash'])) {
    session_regenerate_id(true); // prevent fixation
    $_SESSION['clinician_id'] = $user['clinician_id'];
    $_SESSION['username']     = $user['username'];

    // Optional: record login
    // $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    // $log = $conn->prepare("INSERT INTO user_activity (clinician_id, action, ip_address, login_time) VALUES (?, 'LOGIN', ?, NOW())");
    // $log->bind_param("is", $user['clinician_id'], $ip);
    // $log->execute();

    // send json response
    echo json_encode(
      ['success' => true,
      'message' => 'Login successful',
      'user' => [
        'clinician_id' => $user['clinician_id'],
         'username' => $user['username']]]
        );
    exit();
  } else {
    http_response_code(401);
    echo json_encode(['success' => false, 
    'message' => 'Invalid username or password.']);
    exit();
  }
}
?>
