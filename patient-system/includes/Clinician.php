<?php

require_once __DIR__ . '/Validator.php';

class Clinician
{
    public function __construct(private PDO $pdo) {}

    // Only include columns that actually exist in your clinician table
    // clinician_id, email, first_name, last_name, password_hash, specialty, phone, role
    private const FIELDS = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'specialty',
    ];

    /**
     * Normalise & validate clinician data
     */
    private function processData(array $data): array
    {
        // Required fields
        $required = ['first_name', 'last_name', 'email'];
        Validator::required($data, $required);

        // Validate numeric-ish phone (but keep as string)
        $ints = ['phone'];
        Validator::int($data, $ints);

        // Trim string fields
        $strings = ['first_name', 'last_name', 'email', 'specialty'];
        foreach ($strings as $field) {
            $data[$field] = (isset($data[$field]) && $data[$field] !== '')
                ? trim((string) $data[$field])
                : null;
        }

        // Normalise phone to string (may have been validated as int)
        if (isset($data['phone']) && $data['phone'] !== null && $data['phone'] !== '') {
            $data['phone'] = trim((string) $data['phone']);
        } else {
            $data['phone'] = null;
        }

        // Email format check
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format.');
        }

        return $data;
    }

    /**
     * Find a clinician by ID
     */
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM clinician WHERE clinician_id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Create a clinician (optional – not used for your profile page,
     * but useful if you later move registration into this class).
     * NOTE: This does not handle password_hash or role – those can be set separately.
     */
    public function create(array $data): int
    {
        $clean = $this->processData($data);

        $stmt = $this->pdo->prepare("
            INSERT INTO clinician (first_name, last_name, email, phone, specialty)
            VALUES (:first_name, :last_name, :email, :phone, :specialty)
        ");

        $stmt->execute([
            ':first_name' => $clean['first_name'],
            ':last_name'  => $clean['last_name'],
            ':email'      => $clean['email'],
            ':phone'      => $clean['phone'],
            ':specialty'  => $clean['specialty'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Update clinician profile fields (first_name, last_name, email, phone, specialty)
     */
    public function update(int $id, array $data): void
    {
        // Load existing row so we can merge partial updates
        $existing = $this->find($id);
        if (!$existing) {
            throw new RuntimeException('Clinician not found.');
        }

        // Only keep fields defined in FIELDS
        $merged = array_intersect_key($existing, array_flip(self::FIELDS));

        // Override with any provided fields
        foreach (self::FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $merged[$field] = $data[$field];
            }
        }

        // Validate + normalise
        $clean = $this->processData($merged);

        // Perform UPDATE
        $stmt = $this->pdo->prepare("
            UPDATE clinician
            SET first_name = :first_name,
                last_name  = :last_name,
                email      = :email,
                phone      = :phone,
                specialty  = :specialty
            WHERE clinician_id = :id
        ");

        $stmt->execute([
            ':first_name' => $clean['first_name'],
            ':last_name'  => $clean['last_name'],
            ':email'      => $clean['email'],
            ':phone'      => $clean['phone'],
            ':specialty'  => $clean['specialty'],
            ':id'         => $id,
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

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
