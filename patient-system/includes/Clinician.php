<?php

require_once __DIR__ . '/Validator.php';

class Clinician
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'specialty',
    ];

    // process & validate data
    private function processData(array $data): array
    {
        // validation: required
        $required = [
            'first_name',
            'last_name',
            'email'
        ];
        Validator::required($data, $required);

        // validation: integers
        $ints = ['phone'];
        Validator::int($data, $ints);

        // validation: email
        $emails = ['email'];
        Validator::email($data, $emails);

        // processing: trim strings
        $strings = [
            'first_name',
            'last_name',
            'email',
            'specialty'
        ];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        return $data;
    }

    // create clinician
    public function create(array $data): int
    {
        // validate & process data
        $clean = $this->processData($data);

        // prepare query
        $stmt = $this->pdo->prepare("
            INSERT INTO clinician
              (first_name, last_name, email, phone, specialty)
            VALUES
              (:first_name, :last_name, :email, :phone, :specialty)
        ");
        // execute query
        $stmt->execute([
            ':first_name' => $clean['first_name'],
            ':last_name'  => $clean['last_name'],
            ':email'      => $clean['email'],
            ':phone'      => $clean['phone'],
            ':specialty'  => $clean['specialty'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    // update clinician
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
            UPDATE clinician
            SET first_name = :first_name,
                last_name = :last_name,
                email = :email,
                phone = :phone,
                specialty = :specialty
            WHERE clinician_id = :id
        ");
        // execute query
        $stmt->execute([
            ':first_name' => $clean['first_name'],
            ':last_name' => $clean['last_name'],
            ':email' => $clean['email'],
            ':phone' => $clean['phone'],
            ':specialty' => $clean['specialty'],
            ':id' => $id,
        ]);
    }

    // delete clinician
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM clinician WHERE clinician_id = ?");
        $stmt->execute([$id]);
    }


    // search clinician
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM clinician WHERE 1=1";
        $params = [];

        // equal
        $equals = [
            'clinician_id',
            'email',
            'first_name',
            'last_name',
            'specialty',
            'phone',
        ];
        foreach ($equals as $field) {
            if (!empty($filters[$field])) {
                $param = ":{$field}";
                $sql .= " AND {$field} = {$param}";
                $params[$param] = $filters[$field];
            }
        }

        // order
        $sql .= " ORDER BY last_name, first_name";

        // prepare query
        $stmt = $this->pdo->prepare($sql);
        // execute query
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // find clinician with ID
    public function find($id): array
    {
        $rows = $this->search(["clinician_id" => $id]);
        if (empty($rows)) {
            throw new RuntimeException("Clinician with ID {$id} not found.");
        }
        return reset($rows);
    }
}
