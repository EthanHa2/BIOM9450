<?php

declare(strict_types=1);

final class PatientController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/patient
        if ($id === null) {
            if ($method === 'GET' && $sub === null) {
                $this->search();  // search: GET /api/patient
                return;
            }

            if ($method === 'POST' && $sub === null) {
                $this->create();  // create: POST /api/patient
                return;
            }

            json(405, ['error' => 'Method not allowed.']);
        }
        // /api/patient/{id}
        else {
            // /api/patient/{id}
            if ($method === 'GET' && $sub === 'mutations') {
                $this->getMutations($id); // GET /api/patient/{id}/mutations
            } elseif ($method === 'PUT' && $sub === null) {
                $this->update($id);  // update: PUT /api/patient/{id}
            } elseif ($method === 'DELETE' && $sub === null) {
                $this->delete($id);  // delete: DELETE /api/patient/{id}
            } else {
                json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/patient?first_name=...
    public function search(): void
    {
        $patient = new Patient($this->pdo);
        $filters = [
            'patient_id' => $_GET['patient_id'] ?? null,
            'first_name' => $_GET['first_name'] ?? null,
            'last_name' => $_GET['last_name'] ?? null,
            'sex' => $_GET['sex'] ?? null,
            'phone' => $_GET['phone'] ?? null,
            'address' => $_GET['address'] ?? null,
            'dob_from' => $_GET['dob_from'] ?? null,
            'dob_to' => $_GET['dob_to'] ?? null,
        ];
        $results = $patient->search($filters);
        json(200, ['patients' => $results]);
    }

    // GET /api/patient/{id}/mutations
    public function getMutations(int $id): void
    {
        $patient = new Patient($this->pdo);
        $mutations = $patient->getMutations($id);
        json(200, ['mutations' => $mutations]);
    }

    // POST /api/patient
    public function create(): void
    {
        $data = getJsonBody();
        $patient = new Patient($this->pdo);
        $newId = $patient->create($data);

        json(201, [
            'patient_id' => $newId,
            'message' => 'Patient created successfully.',
        ]);
    }

    // PUT /api/patient/{id}
    public function update(int $id): void
    {
        $data = getJsonBody();
        $patient = new Patient($this->pdo);

        $patient->update($id, $data);

        json(200, [
            'message' => "Patient {$id} updated successfully.",
        ]);
    }

    // DELETE /api/patient/{id}
    public function delete(int $id): void
    {
        $patient = new Patient($this->pdo);
        $patient->delete($id);
        json(200, ['message' => "Patient {$id} deleted successfully."]);
    }
}
