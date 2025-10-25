<?php
session_start();
require 'db.php';

$error = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $username = trim($_POST['username'] ?? "");
  $password = $_POST['password'] ?? "";

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

    header("Location: dashboard.php");
    exit();
  } else {
    $error = "Invalid username or password.";
  }
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="container">
  <h2>Clinician Login</h2>
  <?php if ($error) echo "<p class='error'>$error</p>"; ?>
  <form method="POST" autocomplete="off">
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>
  <p>New here? <a href="register.php">Create an account</a></p>
</div>
</body>
</html>
