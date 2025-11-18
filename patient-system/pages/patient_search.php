<?php

require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Patient.php';

$patient = new Patient($pdo);

$err = '';
$ok  = '';

// Deletion (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
  $id = (int) $_POST['delete_id'];
  try {
    $patient->delete($id);
    $ok = "Patient with ID {$id} has been deleted.";
  } catch (PDOException $e) {
    $err = 'Error deleting patient: ' . $e->getMessage();
  }
}

// Search 
$filters = [
  'first_name'     => trim($_GET['first_name']     ?? null),
  'last_name'     => trim($_GET['last_name']     ?? null),
  'sex'      => $_GET['sex']      ?? null,
  'dob_from' => $_GET['dob_from'] ?? null,
  'dob_to'   => $_GET['dob_to']   ?? null,
  'phone'     => trim($_GET['phone']     ?? null),
];

// This will return all patients if all filters are empty
$patients = $patient->search($filters);
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Search Patients</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Optional: hook into your existing CSS -->
  <link rel="stylesheet" href="../style.css">
</head>

<body>
  <header class="hero">
    <div class="wrap">
      <div>
        <h1>Patient Management</h1>
      </div>
    </div>
  </header>

  <div class="container">
    <!-- Status messages -->
    <?php if ($err): ?>
      <p style="color:red;"><?= htmlspecialchars($err) ?></p>
    <?php endif; ?>

    <?php if ($ok): ?>
      <p style="color:green;"><?= htmlspecialchars($ok) ?></p>
    <?php endif; ?>

    <!-- Search form -->
    <section class="card">
      <h2>Search Patients</h2>
      <form method="get">
        <fieldset>
          <div class="field">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value="<?= htmlspecialchars($filters['first_name']) ?>"
              placeholder="e.g., John">
          </div>

          <div class="field">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value="<?= htmlspecialchars($filters['last_name']) ?>"
              placeholder="e.g., Smith">
          </div>

          <div class="field">
            <label>Sex</label>
            <select name="sex">
              <option value="">Any</option>
              <option value="Male" <?= $filters['sex'] === 'Male'   ? 'selected' : '' ?>>Male</option>
              <option value="Female" <?= $filters['sex'] === 'Female' ? 'selected' : '' ?>>Female</option>
              <option value="Other" <?= $filters['sex'] === 'Other'  ? 'selected' : '' ?>>Other</option>
            </select>
          </div>

          <div class="field">
            <label>Date of birth (from)</label>
            <input
              type="date"
              name="dob_from"
              value="<?= htmlspecialchars($filters['dob_from']) ?>">
          </div>

          <div class="field">
            <label>Date of birth (to)</label>
            <input
              type="date"
              name="dob_to"
              value="<?= htmlspecialchars($filters['dob_to']) ?>">
          </div>

          <div class="field">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value="<?= htmlspecialchars($filters['phone']) ?>">
          </div>
        </fieldset>

        <input type="submit" class="btn" value="Search">
        <!-- simple reset link back to this page without query parameters -->
        <a href="patient_search.php" class="btn">Reset</a>
      </form>
    </section>

    <!-- Results table -->
    <section class="card">
      <h2>Results</h2>
      <?php if (!empty($patients)): ?>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>First name</th>
              <th>Last name</th>
              <th>DOB</th>
              <th>Sex</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Diagnostic</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($patients as $p): ?>
              <tr>
                <td><?= (int)$p['patient_id'] ?></td>
                <td><?= htmlspecialchars($p['first_name'] ?? '') ?></td>
                <td><?= htmlspecialchars($p['last_name']  ?? '') ?></td>
                <td><?= htmlspecialchars($p['dob']        ?? '') ?></td>
                <td><?= htmlspecialchars($p['sex']        ?? '') ?></td>
                <td><?= htmlspecialchars($p['phone']      ?? '') ?></td>
                <td><?= htmlspecialchars($p['address']    ?? '') ?></td>
                <td><?= htmlspecialchars($p['diagnostic'] ?? '') ?></td>
                <td>
                  <a href="patient_update.php?id=<?= (int)$p['patient_id'] ?>" class="btn">Update</a>

                  <form
                    method="post"
                    style="display:inline"
                    onsubmit="return confirm('Are you sure you want to delete patient ID <?= (int)$p['patient_id'] ?>?');">
                    <input type="hidden" name="delete_id" value="<?= (int)$p['patient_id'] ?>">
                    <button type="submit" class="btn btn-danger">Delete</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php else: ?>
        <p>No patients found.</p>
      <?php endif; ?>
    </section>
  </div>
</body>

</html>