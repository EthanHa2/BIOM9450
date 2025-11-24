<?php

require_once __DIR__ . '/Validator.php';

class Diagnostic
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
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
            (patient_id, clinician_id, diagnosis_date, diagnosis_type, description, treatment)
          VALUES
            (:patient_id, :clinician_id, :diagnosis_date, :diagnosis_type, :description, :treatment)
        ");

        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':diagnosis_date' => $clean['diagnosis_date'],
            ':diagnosis_type' => $clean['diagnosis_type'],
            ':description' => $clean['description'],
            ':treatment' => $clean['treatment'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update diagnostic
    public function update(int $id, array $data): void
    {
        // merge incoming data with existing data
        $existing = $this->search(["diagnosis_id" => $id]);
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
          SET patient_id = :patient_id,
              clinician_id = :clinician_id,
              diagnosis_date = :diagnosis_date,
              diagnosis_type = :diagnosis_type,
              description = :description,
              treatment = :treatment
          WHERE diagnosis_id = :id
        ");

        // execute query
        $stmt->execute([
            ':patient_id' => $clean['patient_id'],
            ':clinician_id' => $clean['clinician_id'],
            ':diagnosis_date' => $clean['diagnosis_date'],
            ':diagnosis_type' => $clean['diagnosis_type'],
            ':description' => $clean['description'],
            ':treatment' => $clean['treatment'],
            ':id' => $id,
        ]);
    }

    // delete diagnostic
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM diagnostic WHERE diagnosis_id = ?");
        $stmt->execute([$id]);
    }

    // search diagnostic
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM diagnostic WHERE 1=1";
        $params = [];

        // equal
        $equals = [
            'diagnosis_id',
            'patient_id',
            'clinician_id',
            'diagnosis_date',
            'diagnosis_type',
            'description',
            'treatment',
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
