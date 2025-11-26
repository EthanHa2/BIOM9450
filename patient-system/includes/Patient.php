<?php

require_once __DIR__ . '/Validator.php';

class Patient
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
        'first_name',
        'last_name',
        'dob',
        'sex',
        'phone',
        'address',
        'photo',
    ];

    // process & validate data
    private function processData(array $data): array
    {
        // validation: required
        $required = [
            'first_name',
            'last_name',
            'dob',
            'sex',
            'phone',
        ];
        Validator::required($data, $required);

        // validation: integers
        $ints = ['phone'];
        Validator::int($data, $ints);

        // validation: dates
        $dates = ['dob'];
        Validator::date($data, $dates);

        // validation: path
        $paths = ['photo'];
        Validator::path($data, $paths, __DIR__);

        // processing: trim strings
        $strings = [
            'first_name',
            'last_name',
            'sex',
            'address',
        ];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        return $data;
    }

    // create patient
    public function create(array $data): int
    {
        // validate & process data
        $clean = $this->processData($data);

        // prepare query
        $stmt = $this->pdo->prepare("
          INSERT INTO patient
            (first_name, last_name, dob, sex, phone, address, photo)
          VALUES
            (:first_name, :last_name, :dob, :sex, :phone, :address, :photo)
        ");
        // execute query
        $stmt->execute([
            ':first_name' => $clean['first_name'] ?? null,
            ':last_name' => $clean['last_name'] ?? null,
            ':dob' => $clean['dob'] ?? null,
            ':sex' => $clean['sex'] ?? null,
            ':phone' => $clean['phone'] ?? null,
            ':address' => $clean['address'] ?? null,
            ':photo' => $clean['photo'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update patient
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

        // validate & process data
        $clean = $this->processData($merged);

        // prepare query
        $stmt = $this->pdo->prepare("
          UPDATE patient
          SET first_name = :first_name,
              last_name = :last_name,
              dob = :dob,
              sex = :sex,
              phone = :phone,
              address = :address,
              photo = :photo
          WHERE patient_id = :id
        ");
        // execute query
        $stmt->execute([
            ':first_name' => $clean['first_name'] ?? null,
            ':last_name' => $clean['last_name'] ?? null,
            ':dob' => $clean['dob'] ?? null,
            ':sex' => $clean['sex'] ?? null,
            ':phone' => $clean['phone'] ?? null,
            ':address' => $clean['address'] ?? null,
            ':photo' => $clean['photo'] ?? null,
            ':id' => $id,
        ]);
    }

    // delete patient
    public function delete(int $id): void
    {
        // validation: id
        $this->find($id);
        // prepare query
        $stmt = $this->pdo->prepare("DELETE FROM patient WHERE patient_id = ?");
        // execute query
        $stmt->execute([$id]);
    }

    // search patient
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM patient WHERE 1=1";
        $params = [];

        // equal
        $equals = [
            'patient_id',
            'first_name',
            'last_name',
            'sex',
            'phone',
            'address',
        ];
        foreach ($equals as $field) {
            if (!empty($filters[$field])) {
                $param = ":{$field}";
                $sql .= " AND {$field} = {$param}";
                $params[$param] = $filters[$field];
            }
        }

        // date range
        if (!empty($filters['dob_from'])) {
            // validation: date
            $dates = ['dob_from'];
            Validator::date($filters, $dates, requirePast: false);
            $sql .= " AND dob >= :dob_from";
            $params[':dob_from'] = $filters['dob_from'];
        }
        if (!empty($filters['dob_to'])) {
            // validation: date
            $dates = ['dob_to'];
            Validator::date($filters, $dates, requirePast: false);
            $sql .= " AND dob <= :dob_to";
            $params[':dob_to'] = $filters['dob_to'];
        }

        // order
        $sql .= " ORDER BY last_name, first_name";

        // prepare query
        $stmt = $this->pdo->prepare($sql);
        // execute query
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // find patient with ID
    public function find($id): array
    {
        $rows = $this->search(["patient_id" => $id]);
        if (empty($rows)) {
            throw new NotFoundException("Patient with ID {$id} not found.");
        }
        return reset($rows);
    }

    // get all mutations of given patient
    public function getMutations(int $id): ?array
    {

        // prepare query
        $stmt = $this->pdo->prepare("
            SELECT m.*
            FROM mutation AS m
            JOIN patient_mutation AS pm
                ON pm.mutation_id = m.mutation_id
            WHERE pm.patient_id = :patient_id;
        ");
        // execute query
        $stmt->execute([':patient_id' => $id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
