<?php

declare(strict_types=1);

final class DiagnosticController
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
        // /api/diagnostic or /api/diagnostic/{sub}
        if ($id === null) {
            switch ($method) {
                case 'GET' && $sub === 'stats':
                    $this->stats();  // stats: GET /api/diagnostic/stats
                    break;
                case 'GET' && $sub === null:
                    $this->search();  // search: GET /api/diagnostic
                    break;
                case 'POST' && $sub === null:
                    $this->create();  // create: POST /api/diagnostic
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/diagnostic/{id}
        else {
            switch ($method) {
                case 'PUT' && $sub === null:
                    $this->update($id);  // update: PUT /api/diagnostic/{id}
                    break;
                case 'DELETE' && $sub === null:
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
            'diagnosis_id'  => $_GET['diagnostic_id'] ?? null,
            'patient_id'    => $_GET['patient_id'] ?? null,
            'clinician_id'  => $_GET['clinician_id'] ?? null,
            'diagnosis_date'=> $_GET['diagnosis_date'] ?? null,
            'diagnosis_type'=> $_GET['diagnosis_type'] ?? null,
            'description'   => $_GET['description'] ?? null,
            'treatment'     => $_GET['treatment'] ?? null,
        ];
        $results = $diagnostic->search($filters);
        $this->json(200, ['diagnostics' => $results]);
    }

    // POST /api/diagnostic
    public function create(): void
    {
        $data = $this->getJsonBody();
        $diagnostic = new Diagnostic($this->pdo);
        $newId = $diagnostic->create($data);

        $this->json(201, [
            'diagnostic_id' => $newId,
            'message'       => 'Diagnostic created successfully.',
        ]);
    }

    // PUT /api/diagnostic/{id}
    public function update(int $id): void
    {
        $data = $this->getJsonBody();
        $diagnostic = new Diagnostic($this->pdo);

        $diagnostic->update($id, $data);

        $this->json(200, [
            'message' => "Diagnostic {$id} updated successfully.",
        ]);
    }

    // DELETE /api/diagnostic/{id}
    public function delete(int $id): void
    {
        $diagnostic = new Diagnostic($this->pdo);
        $diagnostic->delete($id);
        $this->json(200, ['message' => "Diagnostic {$id} deleted successfully."]);
    }

    /**
     * NEW: statistics endpoint for visualisations
     * GET /api/diagnostic/stats?sex=Male&minAge=20&maxAge=60
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
                d.diagnosis_type,
                COUNT(DISTINCT p.patient_id) AS patient_count
            FROM diagnostic d
            JOIN patient p ON p.patient_id = d.patient_id
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
            GROUP BY d.diagnosis_type
            ORDER BY patient_count DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        json(200, $rows);
    }
}
