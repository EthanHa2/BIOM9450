<?php
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Patient.php';
require __DIR__ . '/../includes/Phenotype.php';

$patient = new Patient($pdo);
$phenotype = new Phenotype($pdo);

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
    ];

    try {
      $patient->update($id, $data);
      $ok = "Patient with ID {$id} has been updated.";
    } catch (Throwable $e) {
      $err = 'Error updating patient: ' . $e->getMessage();
    }
  }

  // Always load current data to show in the form
  $mutations = $patient->getMutations($id);

  $filters = ['patient_id' => $id];
  $phenotypes = $phenotype->search($filters);

  $pat = $patient->find($id);
  if (!$pat) {
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

    <?php if (!empty($pat)): ?>
      <section class="card">
        <h2>Edit Patient #<?= (int)$pat['patient_id'] ?></h2>
        <form method="post">
          <div class="field">
            <label>First name</label>
            <input
              name="first_name"
              required
              value="<?= htmlspecialchars($pat['first_name'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Last name</label>
            <input
              name="last_name"
              required
              value="<?= htmlspecialchars($pat['last_name'] ?? '') ?>">
          </div>

          <div class="field">
            <label>DOB</label>
            <input
              type="date"
              name="dob"
              value="<?= htmlspecialchars($pat['dob'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Sex</label>
            <select name="sex">
              <option value="">–</option>
              <option value="Male" <?= ($pat['sex'] ?? '') === 'Male'   ? 'selected' : '' ?>>Male</option>
              <option value="Female" <?= ($pat['sex'] ?? '') === 'Female' ? 'selected' : '' ?>>Female</option>
              <option value="Other" <?= ($pat['sex'] ?? '') === 'Other'  ? 'selected' : '' ?>>Other</option>
            </select>
          </div>

          <div class="field">
            <label>Phone</label>
            <input
              name="phone"
              value="<?= htmlspecialchars($pat['phone'] ?? '') ?>">
          </div>

          <div class="field">
            <label>Address</label>
            <input
              name="address"
              value="<?= htmlspecialchars($pat['address'] ?? '') ?>">
          </div>

          <label>Mutations</label>
          <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Chromosome</th>
              <th>Chromosome Start</th>
              <th>Chromosome End</th>
              <th>Mutation Type</th>
              <th>Mutaed from Allele</th>
              <th>Mutaed To Allele</th>
              <th>Consequence Type</th>
              <th>Gene Affected</th>
              <th>Cancer Type</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($mutations as $m): ?>
              <tr>
                <td><?= (int)$m['mutation_id'] ?></td>
                <td><?= htmlspecialchars($m['chromosome'] ?? '') ?></td>
                <td><?= htmlspecialchars($m['chromosome_start']  ?? '') ?></td>
                <td><?= htmlspecialchars($m['chromosome_end']        ?? '') ?></td>
                <td><?= htmlspecialchars($m['mutation_type']        ?? '') ?></td>
                <td><?= htmlspecialchars($m['mutated_from_allele']      ?? '') ?></td>
                <td><?= htmlspecialchars($m['mutated_to_allele']    ?? '') ?></td>
                <td><?= htmlspecialchars($m['consequence_type'] ?? '') ?></td>
                <td><?= htmlspecialchars($m['gene_affected'] ?? '') ?></td>
                <td><?= htmlspecialchars($m['cancer_type'] ?? '') ?></td>
                <td>
                  <a href="mutation_update.php?id=<?= (int)$m['mutation_id'] ?>" class="btn">Update</a>

                  <form
                    method="post"
                    style="display:inline"
                    onsubmit="return confirm('Are you sure you want to delete mutation ID <?= (int)$p['mutation_id'] ?>?');">
                    <input type="hidden" name="delete_id" value="<?= (int)$p['mutation_id'] ?>">
                    <button type="submit" class="btn btn-danger">Delete</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>

          <button type="submit" class="btn">Save changes</button>
          <a href="patient_search.php" class="btn">Back</a>
        </form>
      </section>
    <?php endif; ?>
  </div>
</body>

</html>