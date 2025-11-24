<?php
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Patient.php';

$patient = new Patient($pdo);

$err = '';
$ok = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = [
    'first_name' => trim($_POST['first_name']),
    'last_name' => trim($_POST['last_name']),
    'dob' => $_POST['dob'],
    'sex' => $_POST['sex'],
    'phone' => $_POST['phone'] ?? null,
    'address' => $_POST['address'] ?? null,
    'diagnostic' => $_POST['diagnostic'] ?? null,
  ];
  $id = $patient->create($data);
  $ok = "Patient created with ID {$id}.";
}
?>

<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Create patient</title>
</head>

<body>
  <h1>Create patient</h1>

  <?php if ($err): ?><p style="color:red;"><?= htmlspecialchars($err) ?></p><?php endif; ?>
  <?php if ($ok): ?><p style="color:green;"><?= htmlspecialchars($ok) ?></p><?php endif; ?>

  <form method="post">
    <label>First name: <input name="first_name" required></label><br>
    <label>Last name: <input name="last_name" required></label><br>
    <label>DOB: <input type="date" name="dob"></label><br>
    <label>Sex:
      <select name="sex">
        <option value="">–</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
    </label><br>
    <label>Phone: <input name="phone"></label><br>
    <label>Address: <input name="address"></label><br>
    <label>Diagnostic summary:<br>
      <textarea name="diagnostic" rows="3" cols="40"></textarea>
    </label><br>
    <button type="submit">Create</button>
  </form>

  <p><a href="patient_search.php">Search patients</a></p>
</body>

</html>