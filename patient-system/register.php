<?php
session_start();
require 'db.php';

$err = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $name      = trim($_POST['name'] ?? "");
  $username  = trim($_POST['username'] ?? "");
  $password  = $_POST['password'] ?? "";
  $specialty = trim($_POST['specialty'] ?? "");
  $email     = trim($_POST['email'] ?? "");
  $phone     = trim($_POST['phone'] ?? "");

  if ($name === "" || $username === "" || $password === "") {
    $err = "Name, username and password are required.";
  } else {
    // Check if username exists
    $check = $conn->prepare("SELECT 1 FROM clinician WHERE username=? LIMIT 1");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
      $err = "Username already taken.";
    } else {
      $hash = password_hash($password, PASSWORD_DEFAULT);
      $stmt = $conn->prepare("INSERT INTO clinician (name, username, password_hash, specialty, email, phone) VALUES (?, ?, ?, ?, ?, ?)");
      $stmt->bind_param("ssssss", $name, $username, $hash, $specialty, $email, $phone);

      if ($stmt->execute()) {
        echo "<script>alert('Registration successful! Please log in.');window.location='login.php';</script>";
        exit();
      } else {
        $err = "Registration failed: " . htmlspecialchars($conn->error);
      }
    }
    $check->close();
  }
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Register</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
  <h2>Clinician Registration</h2>
  <?php if ($err) echo "<p class='error'>$err</p>"; ?>
  <form method="POST" autocomplete="off">
    <input type="text" name="name" placeholder="Full Name" required>
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password (min 8 chars)" minlength="8" required>
    <input type="text" name="specialty" placeholder="Specialty">
    <input type="email" name="email" placeholder="Email">
    <input type="text" name="phone" placeholder="Phone">
    <button type="submit">Register</button>
  </form>
  <p>Already registered? <a href="login.php">Log in</a></p>
</div>
</body>
</html>
