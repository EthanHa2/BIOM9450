<?php
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Patient.php';

$patientRepo = new Patient($pdo);

$err = '';
$ok  = '';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($id <= 0) {
  $err = 'Invalid patient ID.';
} else {
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Collect updated data from form
    $data = [
      'first_name' => trim($_POST['first_name'] ?? ''),
      'last_name'  => trim($_POST['last_name'] ?? ''),
      'dob'        => $_POST['dob'] ?? null,
      'sex'        => $_POST['sex'] ?? null,
      'phone'      => $_POST['phone'] ?? null,
      'address'    => $_POST['address'] ?? null,
      'diagnostic' => $_POST['diagnostic'] ?? null,
    ];

    try {
      $patientRepo->update($id, $data);
      $ok = "Patient with ID {$id} has been updated.";
    } catch (Throwable $e) {
      $err = 'Error updating patient: ' . $e->getMessage();
    }
  }

  // Always load current data to show in the form
  $patient = $patientRepo->find($id);
  if (!$patient) {
    $err = "Patient with ID {$id} not found.";
  }
}
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Edit patient</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../style.css">
</head>

<body>
  <header class="hero">
    <div class="wrap">
      <div>
        <h1>Patient Management</h1>
        <nav class="links">
          <a href="patient_search.php">Search Patients</a>
          <a href="patient_create.php">Create Patient</a>
        </nav>
      </div>
    </div>
  </header>

  <div class="container">
    <?php if ($err): ?>
      <p style="color:red;"><?= htmlspecialchars($err) ?></p>
    <?php endif; ?>

    <?php if ($ok): ?>
      <p style="color:green;"><?= htmlspecialchars($ok) ?></p>
    <?php endif; ?>

    <?php if (!empty($patient)): ?>
      <section class="card">
        <h2>Edit Patient #<?= (int)$patient['patient_id'] ?></h2>
        <form method="post">
          <div class="field">
            <label>First name</label>
            <input
              name="first_name"
              required
              value="<?= htmlspecialchars($patient['first_name'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Last name</label>
            <input
              name="last_name"
              required
              value="<?= htmlspecialchars($patient['last_name'] ?? '') ?>">
          </div>

          <div class="field">
            <label>DOB</label>
            <input
              type="date"
              name="dob"
              value="<?= htmlspecialchars($patient['dob'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Sex</label>
            <select name="sex">
              <option value="">–</option>
              <option value="Male" <?= ($patient['sex'] ?? '') === 'Male'   ? 'selected' : '' ?>>Male</option>
              <option value="Female" <?= ($patient['sex'] ?? '') === 'Female' ? 'selected' : '' ?>>Female</option>
              <option value="Other" <?= ($patient['sex'] ?? '') === 'Other'  ? 'selected' : '' ?>>Other</option>
            </select>
          </div>

          <div class="field">
            <label>Phone</label>
            <input
              name="phone"
              value="<?= htmlspecialchars($patient['phone'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Address</label>
            <input
              name="address"
              value="<?= htmlspecialchars($patient['address'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Diagnostic summary</label>
            <textarea
              name="diagnostic"
              rows="3"
              cols="40"><?= htmlspecialchars($patient['diagnostic'] ?? '') ?></textarea>
          </div>

          <button type="submit" class="btn">Save changes</button>
          <a href="patient_search.php" class="btn">Back</a>
        </form>
      </section>
    <?php endif; ?>
  </div>
</body>

</html>