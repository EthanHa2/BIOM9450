<?php

require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Mutation.php';

$mutation = new Mutation($pdo);

$err = '';
$ok  = '';

// Deletion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
  $id = (int) $_POST['delete_id'];
  try {
    $mutation->delete($id);
    $ok = "Mutation with ID {$id} has been deleted.";
  } catch (PDOException $e) {
    $err = 'Error deleting patient: ' . $e->getMessage();
  }
}

// Search 
$filters = [
  'chromosome' => trim($_GET['chromosome'] ?? null),
  'chromosome_start' => $_GET['chromosome_start'] ?? null,
  'chromosome_end' => $_GET['chromosome_end'] ?? null,
  'mutation_type' => trim($_GET['mutation_type'] ?? null),
  'mutated_from_allele' => trim($_GET['mutated_from_allele'] ?? null),
  'mutated_to_allele' => trim($_GET['mutated_to_allele'] ?? null),
  'consequence_type' => trim($_GET['consequence_type'] ?? null),
  'gene_affected' => trim($_GET['gene_affected'] ?? null),
  'cancer_type' => trim($_GET['cancer_type'] ?? null),
];

// This will return all patients if all filters are empty
$mutations = $mutation->search($filters);
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Search Mutations</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Optional: hook into your existing CSS -->
  <link rel="stylesheet" href="../style.css">
</head>

<body>
  <header class="hero">
    <div class="wrap">
      <div>
        <h1>Mutation Management</h1>
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
      <h2>Search Mutations</h2>
      <form method="get">
        <fieldset>
          <div class="chromosome">
            <label>Chromosome</label>
            <input
              type="text"
              name="chromosome"
              value="<?= htmlspecialchars($filters['chromosome']) ?>">
          </div>

          <div class="chromosome_start">
            <label>Chromosome Start</label>
            <input
              type="number"
              name="chromosome_start"
              value="<?= htmlspecialchars($filters['last_name']) ?>">
          </div>

          <div class="chromosome_end">
            <label>Chromosome End</label>
            <input
              type="number"
              name="chromosome_end"
              value="<?= htmlspecialchars($filters['chromosome_end']) ?>">
          </div>

          <div class="mutation_type">
            <label>Mutation Type</label>
            <input
              type="text"
              name="mutation_type"
              value="<?= htmlspecialchars($filters['mutation_type']) ?>">
          </div>

          <div class="mutated_from_allele">
            <label>Mutated from Allele</label>
            <input
              type="text"
              name="mutated_from_allele"
              value="<?= htmlspecialchars($filters['mutated_from_allele']) ?>">
          </div>

          <div class="mutated_to_allele">
            <label>Mutated to Allele</label>
            <input
              type="text"
              name="mutated_to_allele"
              value="<?= htmlspecialchars($filters['mutated_to_allele']) ?>">
          </div>

          <div class="consequence_type">
            <label>Consequence Type</label>
            <input
              type="text"
              name="consequence_type"
              value="<?= htmlspecialchars($filters['consequence_type']) ?>">
          </div>

          <div class="gene_affected">
            <label>Gene Affected</label>
            <input
              type="text"
              name="gene_affected"
              value="<?= htmlspecialchars($filters['gene_affected']) ?>">
          </div>

          <div class="cancer_type">
            <label>Cancer Type</label>
            <input
              type="text"
              name="cancer_type"
              value="<?= htmlspecialchars($filters['cancer_type']) ?>">
          </div>
        </fieldset>

        <input type="submit" class="btn" value="Search">
        <!-- simple reset link back to this page without query parameters -->
        <a href="mutation_search.php" class="btn">Reset</a>
      </form>
    </section>

    <!-- Results table -->
    <section class="card">
      <h2>Results</h2>
      <?php if (!empty($mutations)): ?>
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
      <?php else: ?>
        <p>No mutations found.</p>
      <?php endif; ?>
    </section>
  </div>
</body>

</html>