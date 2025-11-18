<?php

require_once __DIR__ . '/Validator.php';

class Diagnostic
{
    public function __construct(private PDO $pdo) {}

    private const array FIELDS = [
        'patient_id',
        'clinician_id',
        'diagnosis_date',
        'diagnosis_type',
        'description',
        'treatment',
    ];

    // process & validate data
    private function processData(array $data): array
    {
        // validation: required
        $required = [
            'patient_id',
            'clinician_id',
            'diagnosis_date',
            'diagnosis_type',
            'description',
        ];
        Validator::required($data, $required);

        // validation: integers
        $ints = ['patient_id', 'clinician_id'];
        Validator::int($data, $ints);

        // validation: dates
        $dates = ['diagnosis_date'];
        Validator::date($data, $dates);

        // validation: patient_id & clinician_id
        $patientRepo = new Patient($this->pdo);
        $existing = $patientRepo->find($data['patient_id']);
        if (!$existing) {
            throw new InvalidArgumentException("Patient with ID {$data['patient_id']} not found.");
        }
        $clinicianRepo = new Clinician($this->pdo);
        $existing = $clinicianRepo->find($data['clinician_id']);
        if (!$existing) {
            throw new InvalidArgumentException("Clinician with ID {$data['clinician_id']} not found.");
        }

        // processing: strings
        $strings = [
            'diagnosis_type',
            'description',
            'treatment',
        ];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        return $data;
    }

    // create diagnostics
    public function create(array $data): int
    {
        // validate & process data
        $clean = $this->processData($data);

        $stmt = $this->pdo->prepare("
          INSERT INTO diagnostic
            (patient_id, clinician_id, diagnosis_date, description, treatment)
          VALUES
            (:patient_id, :clinician_id, :diagnosis_date, :description, :treatment)
        ");

        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':diagnosis_date' => $clean['diagnosis_date'],
            ':description' => $clean['description'],
            ':treatment' => $clean['treatment'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update diagnostic
    public function update(int $id, array $data): void
    {
        $existing = $this->find($id);
        // validation: valid & existing diagnostic ID
        if (!$existing) {
            throw new RuntimeException("Diagnostic with ID {$id} not found.");
        }

        // merge incoming data with existing data
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
          UPDATE diagnostic
          SET chromosome = :patient_id,
              clinician_id = :clinician_id,
              diagnosis_date = :diagnosis_date,
              description = :description,
              treatment = :treatment,
          WHERE diagnosis_id = :id
        ");

        // execute query
        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':diagnosis_date' => $clean['diagnosis_date'],
            ':description' => $clean['description'],
            ':treatment' => $clean['treatment'],
            ':id' => $id,
        ]);
    }

    // find diagnostic
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM diagnostic WHERE diagnosis_id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // delete diagnostic
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM diagnostic WHERE diagnosis_id = ?");
        $stmt->execute([$id]);
    }

}
