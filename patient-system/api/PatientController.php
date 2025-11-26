<?php

declare(strict_types=1);

final class PatientController
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
        // /api/patient
        if ($id === null) {
            switch ($method) {
                case 'GET':
                    $this->search();  // search: GET /api/patient
                    break;
                case 'POST':
                    $this->create();  // create: POST /api/patient
                    break;
                default:
                    json_response(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/patient/{id}
        else {
            // validation: check patient ID
            $patient = new Patient($this->pdo);
            $row = $patient->search(['patient_id' => $id])[0] ?? null;
            if (!$row) {
                $this->json(404, ['error' => "Patient with ID {$id} not found."]);
            }

            // /api/patient/{id}
            if ($method === 'GET' && ($sub === 'mutations' || $sub === 'mutation')) {
                $this->getMutations($id); // GET /api/patient/{id}/mutations
            } elseif ($method === 'PUT') {
                $this->update($id);  // update: PUT /api/patient/{id}
            } elseif ($method === 'DELETE') {
                $this->delete($id);  // delete: DELETE /api/patient/{id}
            } else {
                json_response(405, ['error' => 'Method not allowed.']);
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
        $this->json(200, ['patients' => $results]);
    }

    // GET /api/patient/{id}/mutations
    public function getMutations(int $id): void
    {
        $patient = new Patient($this->pdo);
        $mutations = $patient->getMutations($id);
        $this->json(200, ['mutations' => $mutations]);
    }

    // POST /api/patient
    public function create(): void
    {
        $data = $this->getJsonBody();
        $patient = new Patient($this->pdo);
        $newId = $patient->create($data);

        $this->json(201, [
            'patient_id' => $newId,
            'message' => 'Patient created successfully.',
        ]);
    }

    // PUT /api/patient/{id}
    public function update(int $id): void
    {
        $data = $this->getJsonBody();
        $patient = new Patient($this->pdo);

        $patient->update($id, $data);

        $this->json(200, [
            'message' => "Patient {$id} updated successfully.",
        ]);
    }

    // DELETE /api/patient/{id}
    public function delete(int $id): void
    {
        $patient = new Patient($this->pdo);
        $patient->delete($id);
        $this->json(200, ['message' => "Patient {$id} deleted successfully."]);
    }
}
