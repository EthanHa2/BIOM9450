<?php

declare(strict_types=1);

class ClinicianController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/clinician
        if ($id === null) {
            switch ($method) {
                case 'GET' && $sub === null:
                    $this->search();  // search: GET /api/clinician
                    break;
                case 'POST' && $sub === null:
                    $this->create();  // create: POST /api/clinician
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/clinician/{id}
        else {
            switch ($method) {
                case 'GET' && $sub === null:
                    $this->find($id); // GET /api/clinician/{id}
                    break;
                case 'PUT' && $sub === null:
                    $this->update($id);  // update: PUT /api/clinician/{id}
                    break;
                case 'DELETE' && $sub === null:
                    $this->delete($id);  // delete: DELETE /api/clinician/{id}
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/clinician/{id}
    private function find(int $id): void
    {
        $clinician = new Clinician($this->pdo);
        $result = $clinician->find($id);
        json(200, [
            'success' => true,
            'data' => $result,
        ]);
    }

    // POST /api/clinician
    public function create(): void
    {
        $data = getJsonBody();
        $patient = new Clinician($this->pdo);
        $newId = $patient->create($data);

        json(201, [
            'clinician_id' => $newId,
            'message' => 'Clinician created successfully.',
        ]);
    }

    // PUT /api/clinician/{id}
    public function update(int $id): void
    {
        $data = getJsonBody();
        $mutation = new Clinician($this->pdo);

        $mutation->update($id, $data);

        json(200, [
            'message' => "Clinician {$id} updated successfully.",
        ]);
    }

    // DELETE /api/clinician/{id}
    public function delete(int $id): void
    {
        $patient = new Clinician($this->pdo);
        $patient->delete($id);
        json(200, ['message' => "Clinician {$id} deleted successfully."]);
    }

    // GET /api/clinician?first_name=...
    public function search(): void
    {
        $clinician = new Clinician($this->pdo);
        $filters = [
            'clinician_id' => $_GET['clinician_id'] ?? null,
            'first_name' => $_GET['first_name'] ?? null,
            'last_name' => $_GET['last_name'] ?? null,
            'email' => $_GET['email'] ?? null,
            'phone' => $_GET['phone'] ?? null,
            'specialty' => $_GET['specialty'] ?? null,
        ];
        $results = $clinician->search($filters);
        json(200, ['clinicians' => $results]);
    }
}
