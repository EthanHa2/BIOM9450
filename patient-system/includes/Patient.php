<?php

class Patient
{
    public function __construct(private PDO $pdo) {}

    // create patient
    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare("
          INSERT INTO patient
            (first_name, last_name, dob, sex, phone, address, diagnostic)
          VALUES
            (:first_name, :last_name, :dob, :sex, :phone, :address, :diagnostic)
        ");
        error_log($data['diagnostic']);
        $stmt->execute([
            ':first_name' => $data['first_name'],
            ':last_name' => $data['last_name'],
            ':dob' => $data['dob'],
            ':sex' => $data['sex'],
            ':phone' => $data['phone'] ?? null,
            ':address' => $data['address'] ?? null,
            ':diagnostic' => $data['diagnostic'] ?? null,
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    // update patient
    public function update(int $id, array $data): void
    {
        $stmt = $this->pdo->prepare("SELECT * FROM patient WHERE patient_id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        $stmt = $this->pdo->prepare("
          UPDATE patient
          SET first_name=:first_name,
              last_name=:last_name,
              dob=:dob,
              sex=:sex,
              phone=:phone,
              address=:address,
              diagnostic=:diagnostic
          WHERE patient_id=:id
        ");
        $stmt->execute([
            ':first_name' => $data['first_name'] ?? $existing['first_name'],
            ':last_name' => $data['last_name'] ?? $existing['last_name'],
            ':dob' => $data['dob'] ?? $existing['dob'],
            ':sex' => $data['sex'] ?? $existing['sex'],
            ':phone' => $data['phone'] ?? $existing['phone'],
            ':address' => $data['address'] ?? $existing['address'],
            ':diagnostic' => $data['diagnostic'] ?? $existing['diagnostic'],
            ':id' => $id,
        ]);
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM patient WHERE patient_id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    // delete patient
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM patient WHERE patient_id=?");
        $stmt->execute([$id]);
    }

    // search patient
    public function search(array $filters = []): array
    {
        $sql = "SELECT * FROM patient WHERE 1=1";
        $params = [];

        // name filter:
        if (!empty($filters['first_name'])) {
            $sql .= " AND (first_name LIKE :first_name)";
            $params[':first_name'] = '%' . $filters['first_name'] . '%';
        }
        if (!empty($filters['last_name'])) {
            $sql .= " AND (last_name LIKE :last_name)";
            $params[':last_name'] = '%' . $filters['last_name'] . '%';
        }
        // sex filter: exact match
        if (!empty($filters['sex'])) {
            $sql .= " AND sex = :sex";
            $params[':sex'] = $filters['sex'];
        }
        // dob_from filter
        if (!empty($filters['dob_from'])) {
            $sql .= " AND dob >= :dob_from";
            $params[':dob_from'] = $filters['dob_from'];
        }
        // dob_to filter
        if (!empty($filters['dob_to'])) {
            $sql .= " AND dob <= :dob_to";
            $params[':dob_to'] = $filters['dob_to'];
        }
        // phone filter
        if (!empty($filters['phone'])) {
            $sql .= " AND phone = :phone";
            $params[':phone'] = $filters['phone'];
        }
        $sql .= " ORDER BY last_name, first_name";

        error_log($sql);
        error_log(print_r($params, true));

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
