<?php

require_once __DIR__ . '/Validator.php';

class Mutation
{
    public function __construct(private PDO $pdo) {}

    private const array FIELDS = [
        'chromosome',
        'chromosome_start',
        'chromosome_end',
        'mutation_type',
        'mutated_from_allele',
        'mutated_to_allele',
        'consequence_type',
        'gene_affected',
        'cancer_type',
    ];

    // process & validate data
    private function processData(array $data): array
    {
        // validation: required
        $required = [
            'chromosome',
            'chromosome_start',
            'chromosome_end',
            'mutation_type',
            'mutated_from_allele',
            'mutated_to_allele',
            'consequence_type',
            'gene_affected',
        ];
        Validator::required($data, $required);

        // validation: integers
        $ints = ['chromosome_start', 'chromosome_end'];
        Validator::int($data, $ints);

        // validation: chromosome end >= chromosome start (only if both present)
        if ($data['chromosome_end'] < $data['chromosome_start']) {
            throw new InvalidArgumentException('Chromosome end must be greater than chromosome start.');
        }

        // trim strings
        $strings = [
            'chromosome',
            'mutation_type',
            'mutated_from_allele',
            'mutated_to_allele',
            'consequence_type',
            'gene_affected',
            'cancer_type'
        ];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        return $data;
    }

    // create mutation
    public function create(array $data): int
    {
        // validation
        $clean = $this->processData($data);

        $stmt = $this->pdo->prepare("
            INSERT INTO mutation
                (chromosome, chromosome_start, chromosome_end, mutation_type, mutated_from_allele, mutated_to_allele, consequence_type, gene_affected, cancer_type)
            VALUES
                (:chromosome, :chromosome_start, :chromosome_end, :mutation_type, :mutated_from_allele, :mutated_to_allele, :consequence_type, :gene_affected, :cancer_type)
        ");

        $stmt->execute([
            ':chromosome' => $clean['chromosome'],
            ':chromosome_start' => $clean['chromosome_start'],
            ':chromosome_end' => $clean['chromosome_end'],
            ':mutation_type' => $clean['mutation_type'],
            ':mutated_from_allele' => $clean['mutated_from_allele'],
            ':mutated_to_allele' => $clean['mutated_to_allele'],
            ':consequence_type' => $clean['consequence_type'],
            ':gene_affected' => $clean['gene_affected'],
            ':cancer_type' => $clean['cancer_type'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update mutation
    public function update(int $id, array $data): void
    {
        $existing = $this->find($id);
        // validation: valid & existing mutation ID
        if (!$existing) {
            throw new RuntimeException("Mutation with ID {$id} not found.");
        }

        // merge incoming data with existing data
        $merged = $existing ? array_intersect_key($existing, array_flip(self::FIELDS)) : [];
        foreach (self::FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $merged[$field] = $data[$field];
            }
        }

        // validation
        $clean = $this->processData($merged);

        // prepare query
        $stmt = $this->pdo->prepare("
          UPDATE mutation
          SET chromosome = :chromosome,
              chromosome_start = :chromosome_start,
              chromosome_end = :chromosome_end,
              mutation_type = :mutation_type,
              mutated_from_allele = :mutated_from_allele,
              mutated_to_allele = :mutated_to_allele,
              consequence_type = :consequence_type,
              gene_affected = :gene_affected,
              cancer_type = :cancer_type
          WHERE mutation_id = :id
        ");

        // execute query
        $stmt->execute([
            ':chromosome' => $clean['chromosome'],
            ':chromosome_start' => $clean['chromosome_start'],
            ':chromosome_end' => $clean['chromosome_end'],
            ':mutation_type' => $clean['mutation_type'],
            ':mutated_from_allele' => $clean['mutated_from_allele'],
            ':mutated_to_allele' => $clean['mutated_to_allele'],
            ':consequence_type' => $clean['consequence_type'],
            ':gene_affected' => $clean['gene_affected'],
            ':cancer_type' => $clean['cancer_type'],
            ':id' => $id,
        ]);
    }

    // find mutation
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM mutation WHERE mutation_id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // delete mutation
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM mutation WHERE mutation_id=?");
        $stmt->execute([$id]);
    }

    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM mutation WHERE 1=1";
        $params = [];

        // equal
        $equals = [
            'chromosome',
            'chromosome_start',
            'chromosome_end',
            'mutation_type',
            'mutated_from_allele',
            'mutated_to_allele',
            'consequence_type',
            'gene_affected',
            'cancer_type',
        ];
        foreach ($equals as $field) {
            if (!empty($filters[$field])) {
                $param = ":{$field}";
                $sql .= " AND {$field} = {$param}";
                $params[$param] = $filters[$field];
            }
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
