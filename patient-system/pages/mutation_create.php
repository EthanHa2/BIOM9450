<?php
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/Mutation.php';

$mutation = new Mutation($pdo);

$err = '';
$ok = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = [
    'chromosome' => $_POST['chromosome'],
    'chromosome_start' => $_POST['chromosome_start'],
    'chromosome_end' => $_POST['chromosome_end'],
    'mutation_type' => $_POST['mutation_type'],
    'mutated_from_allele' => $_POST['mutated_from_allele'],
    'mutated_to_allele' => $_POST['mutated_to_allele'],
    'consequence_type' => $_POST['consequence_type'],
    'gene_affected' => $_POST['gene_affected'],
    'cancer_type' => $_POST['cancer_type'],
  ];
  $id = $mutation->create($data);
  $ok = "Mutation created with ID {$id}.";
}
?>

<!doctype html>
<html>

<head>
  <meta charset="utf-8">
  <title>Create patient</title>
</head>

<body>
  <h1>Create mutation</h1>

  <?php if ($err): ?><p style="color:red;"><?= htmlspecialchars($err) ?></p><?php endif; ?>
  <?php if ($ok): ?><p style="color:green;"><?= htmlspecialchars($ok) ?></p><?php endif; ?>

  <form method="post">
    <label>Chromosome: <input name="chromosome" required></label><br>
    <label>Chromosome Start: <input name="chromosome_start" required></label><br>
    <label>Chromosome End: <input name="chromosome_end" required></label><br>
    <label>Mutation Type: <input name="mutation_type" required></label><br>
    <label>Mutaed from Allele: <input name="mutated_from_allele" required></label><br>
    <label>Mutaed To Allele: <input name="mutated_to_allele" required></label><br>
    <label>Consequence Type: <input name="consequence_type" required></label><br>
    <label>Gene Affected: <input name="gene_affected" required></label><br>
    <label>Cancer Type: <input name="cancer_type"></label><br>
    <button type="submit">Create</button>
  </form>

  <p><a href="mutation_search.php">Search mutations</a></p>
</body>

</html>