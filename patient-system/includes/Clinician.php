<?php

require_once __DIR__ . '/Validator.php';

class Clinician
{
    public function __construct(private PDO $pdo) {}

    private const FIELDS = [
        'first_name',
        'last_name',
        'username',
        'email',
        'phone',
        'specialty',
    ];

    // find clinician
    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM clinician WHERE clinician_id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}
