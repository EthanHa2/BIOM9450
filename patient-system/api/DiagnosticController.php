<?php

declare(strict_types=1);

final class DiagnosticController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/diagnostic
        if ($id === null) {
            switch ($method) {
                case 'GET':
                    $this->search();  // search: GET /api/diagnostic
                    break;
                case 'POST':
                    $this->create();  // create: POST /api/diagnostic
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/diagnostic/{id}
        else {
            // validation: check diagnostic ID
            $diagnostic = new Diagnostic($this->pdo);
            $row = $diagnostic->search(['diagnostic_id' => $id])[0] ?? null;
            if (!$row) {
                json(404, ['error' => "Diagnostic with ID {$id} not found."]);
            }

            // /api/diagnostic/{id}
            switch ($method) {
                case 'PUT':
                    $this->update($id);  // update: PUT /api/diagnostic/{id}
                    break;
                case 'DELETE':
                    $this->delete($id);  // delete: DELETE /api/diagnostic/{id}
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/diagnostic?first_name=...
    public function search(): void
    {
        $diagnostic = new Diagnostic($this->pdo);
        $filters = [
            'diagnosis_id' => $_GET['diagnostic_id'] ?? null,
            'patient_id' => $_GET['patient_id'] ?? null,
            'clinician_id' => $_GET['clinician_id'] ?? null,
            'diagnosis_date' => $_GET['diagnosis_date'] ?? null,
            'diagnosis_type' => $_GET['diagnosis_type'] ?? null,
            'description' => $_GET['description'] ?? null,
            'treatment' => $_GET['treatment'] ?? null,
        ];
        $results = $diagnostic->search($filters);
        json(200, ['diagnostics' => $results]);
    }

    // POST /api/diagnostic
    public function create(): void
    {
        $data = getJsonBody();
        $diagnostic = new Diagnostic($this->pdo);
        $newId = $diagnostic->create($data);

        json(201, [
            'diagnostic_id' => $newId,
            'message' => 'Diagnostic created successfully.',
        ]);
    }

    // PUT /api/diagnostic/{id}
    public function update(int $id): void
    {
        $data = getJsonBody();
        $diagnostic = new Diagnostic($this->pdo);

        $diagnostic->update($id, $data);

        json(200, [
            'message' => "Diagnostic {$id} updated successfully.",
        ]);
    }

    // DELETE /api/diagnostic/{id}
    public function delete(int $id): void
    {
        $diagnostic = new Diagnostic($this->pdo);
        $diagnostic->delete($id);
        json(200, ['message' => "Diagnostic {$id} deleted successfully."]);
    }
}
