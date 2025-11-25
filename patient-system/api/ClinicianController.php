<?php

declare(strict_types=1);

class ClinicianController
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Handle /clinician routes
     *
     * URL patterns (based on your api.php router):
     *   GET  /api.php/clinician/{id}      → fetch clinician profile
     *   PUT  /api.php/clinician/{id}      → update clinician profile
     *   PATCH /api.php/clinician/{id}     → update clinician profile
     */
    public function handle(?int $id, ?string $sub, string $method): void
    {
        if ($id === null) {
            json_response(400, ['error' => 'Clinician ID is required.']);
        }

        switch ($method) {
            case 'GET':
                $this->getOne($id);
                break;

            case 'PUT':
            case 'PATCH':
                $this->update($id);
                break;

            default:
                json_response(405, ['error' => 'Method not allowed for clinician.']);
        }
    }

    private function getOne(int $id): void
    {
        $stmt = $this->pdo->prepare("
            SELECT clinician_id, first_name, last_name, email, phone, specialty
            FROM clinician
            WHERE clinician_id = :id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            json_response(404, ['success' => false, 'message' => 'Clinician not found.']);
        }

        json_response(200, [
            'success' => true,
            'data'    => $row,
        ]);
    }

    private function update(int $id): void
    {
        // Reuse helper from api.php
        $data = getJsonBody();

        $firstName = isset($data['first_name']) ? trim((string)$data['first_name']) : '';
        $lastName  = isset($data['last_name']) ? trim((string)$data['last_name']) : '';
        $email     = isset($data['email']) ? trim((string)$data['email']) : '';
        $phone     = isset($data['phone']) ? trim((string)$data['phone']) : '';
        $specialty = isset($data['specialty']) ? trim((string)$data['specialty']) : '';

        if ($firstName === '' || $lastName === '' || $email === '') {
            json_response(422, [
                'success' => false,
                'message' => 'First name, last name, and email are required.',
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(422, [
                'success' => false,
                'message' => 'Invalid email format.',
            ]);
        }

        $stmt = $this->pdo->prepare("
            UPDATE clinician
            SET first_name = :first_name,
                last_name  = :last_name,
                email      = :email,
                phone      = :phone,
                specialty  = :specialty
            WHERE clinician_id = :id
        ");

        $ok = $stmt->execute([
            ':first_name' => $firstName,
            ':last_name'  => $lastName,
            ':email'      => $email,
            ':phone'      => $phone,
            ':specialty'  => $specialty,
            ':id'         => $id,
        ]);

        if (!$ok) {
            json_response(500, [
                'success' => false,
                'message' => 'Failed to update clinician profile.',
            ]);
        }

        json_response(200, [
            'success' => true,
            'message' => 'Clinician profile updated successfully.',
        ]);
    }
}
