<?php

require_once __DIR__ . '/Validator.php';

class Mutation
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
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
            ':chromosome' => $clean['chromosome'] ?? null,
            ':chromosome_start' => $clean['chromosome_start'] ?? null,
            ':chromosome_end' => $clean['chromosome_end'] ?? null,
            ':mutation_type' => $clean['mutation_type'] ?? null,
            ':mutated_from_allele' => $clean['mutated_from_allele'] ?? null,
            ':mutated_to_allele' => $clean['mutated_to_allele'] ?? null,
            ':consequence_type' => $clean['consequence_type'] ?? null,
            ':gene_affected' => $clean['gene_affected'] ?? null,
            ':cancer_type' => $clean['cancer_type'] ?? null,
        ]);

        return (int)$this->pdo->lastInsertId();
    }

    // update mutation
    public function update(int $id, array $data): void
    {
        // merge incoming data with existing data
        $existing = $this->find($id);
        $merged = array_intersect_key($existing, array_flip(self::FIELDS));
        foreach (self::FIELDS as $field) {
            if (isset($field, $data)) {
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
            ':chromosome' => $clean['chromosome'] ?? null,
            ':chromosome_start' => $clean['chromosome_start'] ?? null,
            ':chromosome_end' => $clean['chromosome_end'] ?? null,
            ':mutation_type' => $clean['mutation_type'] ?? null,
            ':mutated_from_allele' => $clean['mutated_from_allele'] ?? null,
            ':mutated_to_allele' => $clean['mutated_to_allele'] ?? null,
            ':consequence_type' => $clean['consequence_type'] ?? null,
            ':gene_affected' => $clean['gene_affected'] ?? null,
            ':cancer_type' => $clean['cancer_type'] ?? null,
            ':id' => $id,
        ]);
    }

    // delete mutation
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM mutation WHERE mutation_id = ?");
        $stmt->execute([$id]);
    }

    // link mutation to patient
    public function linkPatient(array $data): void
    {
        // validation: required
        $required = [
            'mutation_id',
            'patient_id',
        ];
        Validator::required($data, $required);
        // validation: id
        $this->find($data['mutation_id']);

        $patient = new Patient($this->pdo);
        $patient->find($data['patient_id']);

        // check if link already exists to avoid duplicates
        $check = $this->pdo->prepare("SELECT 1 FROM patient_mutation WHERE patient_id = ? AND mutation_id = ?");
        $check->execute([$data['patient_id'], $data['mutation_id']]);
        if ($check->fetch()) {
            return;
        }

        $stmt = $this->pdo->prepare("INSERT INTO patient_mutation (patient_id, mutation_id) VALUES (:patient_id, :mutation_id)");
        $stmt->execute([
            ':patient_id' => $data['patient_id'],
            ':mutation_id' => $data['mutation_id']
        ]);
    }

    // unlink mutation from patient
    public function unlinkPatient(array $data): void
    {
        // validation: required
        $required = [
            'mutation_id',
            'patient_id',
        ];
        Validator::required($data, $required);

        $stmt = $this->pdo->prepare("DELETE FROM patient_mutation WHERE patient_id = :patient_id AND mutation_id = :mutation_id");
        $stmt->execute([
            ':patient_id' => $data['patient_id'],
            ':mutation_id' => $data['mutation_id']
        ]);
    }

    // search mutation
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM mutation WHERE 1=1";
        $params = [];

        $equals = [
            'mutation_id',
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

    // find mutation with ID
    public function find($id): array
    {
        $rows = $this->search(["mutation_id" => $id]);
        if (empty($rows)) {
            throw new NotFoundException("Mutation with ID {$id} not found.");
        }
        return reset($rows);
    }
}
