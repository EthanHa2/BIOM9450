<?php

declare(strict_types=1);

final class PhenotypeController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/phenotype
        if ($id === null) {
            switch ($method) {
                case 'GET':
                    $this->search();  // search: GET /api/phenotype
                    break;
                case 'POST':
                    $this->create();  // create: POST /api/phenotype
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/phenotype/{id}
        else {
            // validation: check phenotype ID
            $phenotype = new Phenotype($this->pdo);
            $row = $phenotype->search(['phenotype_id' => $id])[0] ?? null;
            if (!$row) {
                json(404, ['error' => "Phenotype with ID {$id} not found."]);
            }

            // /api/phenotype/{id}
            switch ($method) {
                case 'PUT':
                    $this->update($id);  // update: PUT /api/phenotype/{id}
                    break;
                case 'DELETE':
                    $this->delete($id);  // delete: DELETE /api/phenotype/{id}
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/phenotype?first_name=...
    public function search(): void
    {
        $phenotype = new Phenotype($this->pdo);
        $filters = [
            'phenotype_id' => $_GET['phenotype_id'] ?? null,
            'patient_id' => $_GET['patient_id'] ?? null,
            'clinician_id' => $_GET['clinician_id'] ?? null,
            'recorded_date' => $_GET['recorded_date'] ?? null,
            'description' => $_GET['description'] ?? null,
        ];
        $results = $phenotype->search($filters);
        json(200, ['phenotypes' => $results]);
    }

    // POST /api/phenotype
    public function create(): void
    {
        $data = getJsonBody();
        $phenotype = new Phenotype($this->pdo);
        $newId = $phenotype->create($data);

        json(201, [
            'phenotype_id' => $newId,
            'message' => 'Phenotype created successfully.',
        ]);
    }

    // PUT /api/phenotype/{id}
    public function update(int $id): void
    {
        $data = getJsonBody();
        $phenotype = new Phenotype($this->pdo);

        $phenotype->update($id, $data);

        json(200, [
            'message' => "Phenotype {$id} updated successfully.",
        ]);
    }

    // DELETE /api/phenotype/{id}
    public function delete(int $id): void
    {
        $phenotype = new Phenotype($this->pdo);
        $phenotype->delete($id);
        json(200, ['message' => "Phenotype {$id} deleted successfully."]);
    }
}
