<?php

declare(strict_types=1);

final class PhenotypeController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/phenotype or /api/phenotype/{sub}
        if ($id === null) {

            // NEW: stats endpoint -> GET /api/phenotype/stats
            if ($method === 'GET' && $sub === 'stats') {
                $this->stats();
                return;
            }

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

    // GET /api/phenotype?...
    public function search(): void
    {
        $phenotype = new Phenotype($this->pdo);
        $filters = [
            'phenotype_id'  => $_GET['phenotype_id'] ?? null,
            'patient_id'    => $_GET['patient_id'] ?? null,
            'clinician_id'  => $_GET['clinician_id'] ?? null,
            'recorded_date' => $_GET['recorded_date'] ?? null,
            'description'   => $_GET['description'] ?? null,
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
            'message'      => 'Phenotype created successfully.',
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

    /**
     * NEW: statistics endpoint for visualisations
     * GET /api/phenotype/stats?sex=Male&minAge=0&maxAge=80
     */
    private function stats(): void
    {
        // Optional filters
        $sex    = $_GET['sex']    ?? null;             // 'Male', 'Female', 'Other'
        $minAge = $_GET['minAge'] ?? null;
        $maxAge = $_GET['maxAge'] ?? null;

        $minAge = ($minAge !== null && $minAge !== '') ? (int)$minAge : null;
        $maxAge = ($maxAge !== null && $maxAge !== '') ? (int)$maxAge : null;

        $sql = "
            SELECT 
                ph.description AS phenotype,
                COUNT(DISTINCT ph.patient_id) AS patient_count
            FROM phenotype ph
            JOIN patient p ON p.patient_id = ph.patient_id
            WHERE 1 = 1
        ";

        $params = [];

        if ($sex !== null && $sex !== '') {
            $sql .= " AND p.sex = :sex";
            $params[':sex'] = $sex;
        }

        if ($minAge !== null) {
            $sql .= " AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) >= :minAge";
            $params[':minAge'] = $minAge;
        }

        if ($maxAge !== null) {
            $sql .= " AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) <= :maxAge";
            $params[':maxAge'] = $maxAge;
        }

        $sql .= "
            GROUP BY ph.description
            ORDER BY patient_count DESC
            LIMIT 10
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        json(200, $rows);
    }
}
