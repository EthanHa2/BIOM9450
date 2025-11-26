<?php

declare(strict_types=1);

class ClinicianController
{
    public function __construct(private PDO $pdo) {}

    private function json(int $status, array $body): void
    {
        http_response_code($status);
        echo json_encode($body);
        exit;
    }

    private function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $this->json(400, ['error' => 'Invalid JSON body.']);
        }
        return $data;
    }

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/clinician
        if ($id === null) {
            switch ($method) {
                case 'GET':
                    $this->search();  // search: GET /api/clinician
                    break;
                case 'POST':
                    $this->create();  // create: POST /api/clinician
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/clinician/{id}
        else {
            // validation: check mutation ID
            $mutation = new Mutation($this->pdo);
            $rows = $mutation->search(['clinician_id' => $id]);
            if (empty($rows)) {
                $this->json(404, ['error' => "Clinician with ID {$id} not found."]);
            }

            switch ($method) {
                case 'PUT':
                    $this->update($id);  // update: PUT /api/clinician/{id}
                    break;
                case 'DELETE':
                    $this->delete($id);  // delete: DELETE /api/clinician/{id}
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // POST /api/clinician
    public function create(): void
    {
        $data = $this->getJsonBody();
        $patient = new Clinician($this->pdo);
        $newId = $patient->create($data);

        $this->json(201, [
            'clinician_id' => $newId,
            'message' => 'Clinician created successfully.',
        ]);
    }

    // PUT /api/clinician/{id}
    public function update(int $id): void
    {
        $data = $this->getJsonBody();
        $mutation = new Clinician($this->pdo);

        $mutation->update($id, $data);

        $this->json(200, [
            'message' => "Clinician {$id} updated successfully.",
        ]);
    }

    // DELETE /api/clinician/{id}
    public function delete(int $id): void
    {
        $patient = new Clinician($this->pdo);
        $patient->delete($id);
        $this->json(200, ['message' => "Clinician {$id} deleted successfully."]);
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
        $this->json(200, ['clinicians' => $results]);
    }
}
