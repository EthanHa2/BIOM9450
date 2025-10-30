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
  $name      = trim($data['name'] ?? "");
  $username  = trim($data['username'] ?? "");
  $password  = $data['password'] ?? "";
  $specialty = trim($data['specialty'] ?? "");
  $email     = trim($data['email'] ?? "");
  $phone     = trim($data['phone'] ?? "");

  if ($name === "" || $username === "" || $password === "") {
    http_response_code(400);
    echo json_encode(
      ['success' => false,
     'message' => 'Name, username and password are required.']
    );
    exit();
  } else {
    // Check if username exists
    $check = $conn->prepare("SELECT 1 FROM clinician WHERE username=? LIMIT 1");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
      http_response_code(409);
      echo json_encode(['success' => false, 'message' => 'Username already taken.']);
    } else {
      $hash = password_hash($password, PASSWORD_DEFAULT);
      $stmt = $conn->prepare("INSERT INTO clinician (name, username, password_hash, specialty, email, phone) VALUES (?, ?, ?, ?, ?, ?)");
      $stmt->bind_param("ssssss", $name, $username, $hash, $specialty, $email, $phone);

      if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Registration successful! Please log in.']);
        exit();
      } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . htmlspecialchars($conn->error)]);
      }
    }
    $check->close();
  }
  exit();
}
?>
