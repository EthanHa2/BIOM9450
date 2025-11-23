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
  $firstName = trim($data['first_name'] ?? "");
  $lastName  = trim($data['last_name'] ?? "");
  $password  = $data['password'] ?? "";
  $specialty = trim($data['specialty'] ?? "");
  $email     = trim($data['email'] ?? "");
  $phone     = trim($data['phone'] ?? "");

  if ($firstName === "" || $lastName === "" || $email === "" || $password === "") {
    http_response_code(400);
    echo json_encode(
      [
        'success' => false,
        'message' => 'First Name, Last Name, email and password are required.'
      ]
    );
    exit();
  } else {
    // Check if email exists
    $check = $conn->prepare("SELECT 1 FROM clinician WHERE email=? LIMIT 1");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
      http_response_code(409);
      echo json_encode(['success' => false, 'message' => 'Email already taken.']);
    } else {
      $hash = password_hash($password, PASSWORD_DEFAULT);
      $stmt = $conn->prepare("INSERT INTO clinician (first_name, last_name, email, password_hash, specialty, phone) VALUES (?, ?, ?, ?, ?, ?)");
      $stmt->bind_param("ssssss", $firstName, $lastName, $email, $hash, $specialty, $phone);

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
