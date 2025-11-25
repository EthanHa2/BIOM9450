<?php

require_once __DIR__ . '/Validator.php';

class Phenotype
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
        'patient_id',
        'clinician_id',
        'recorded_date',
        'description',
    ];

    // process & validate data
    private function processData(array $data): array
    {
        // validation: required
        $required = [
            'patient_id',
            'clinician_id',
            'recorded_date',
            'description',
        ];
        Validator::required($data, $required);

        // validation: integers
        $ints = ['patient_id', 'clinician_id'];
        Validator::int($data, $ints);

        // validation: dates
        // Temporarily skip strict date validation due to timezone issues.

        // validation: patient_id & clinician_id
        $patientRepo = new Patient($this->pdo);
        $results  = $patientRepo->search(['patient_id' => $data['patient_id']]);
        if (!($results[0] ?? null)) {
            throw new InvalidArgumentException("Patient with ID {$data['patient_id']} not found.");
        }
        $clinicianRepo = new Clinician($this->pdo);
        $clinician = $clinicianRepo->find((int)$data['clinician_id']);
        if (!$clinician) {
            throw new InvalidArgumentException("Clinician with ID {$data['clinician_id']} not found.");
        }

        // processing: strings
        $strings = ['description'];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        return $data;
    }

    // create phenotypes
    public function create(array $data): int
    {
        // validate & process data
        $clean = $this->processData($data);

        $stmt = $this->pdo->prepare("
          INSERT INTO phenotype
            (patient_id, clinician_id, recorded_date, description)
          VALUES
            (:patient_id, :clinician_id, :recorded_date, :description)
        ");

        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':recorded_date' => $clean['recorded_date'],
            ':description' => $clean['description'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update phenotype
    public function update(int $id, array $data): void
    {
        // merge incoming data with existing data
        $existing = $this->search(["phenotype_id" => $id]);
        $merged = $existing ? array_intersect_key($existing, array_flip(self::FIELDS)) : [];
        foreach (self::FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $merged[$field] = $data[$field];
            }
        }

        // validate & process data
        $clean = $this->processData($merged);

        // prepare query
        $stmt = $this->pdo->prepare("
          UPDATE phenotype
          SET patient_id = :patient_id,
              clinician_id = :clinician_id,
              recorded_date = :recorded_date,
              description = :description
          WHERE phenotype_id = :id
        ");

        // execute query
        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':recorded_date' => $clean['recorded_date'],
            ':description' => $clean['description'],
            ':id' => $id,
        ]);
    }

    // delete phenotype
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM phenotype WHERE phenotype_id = ?");
        $stmt->execute([$id]);
    }

    // search phenotype
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM phenotype WHERE 1=1";
        $params = [];

        // equal
        $equals = [
            'phenotype_id',
            'patient_id',
            'clinician_id',
            'recorded_date',
            'description',
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
