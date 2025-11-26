<?php

declare(strict_types=1);

final class MutationController
{
    public function __construct(private PDO $pdo) {}

    // entry point from API
    public function handle(?int $id, ?string $sub, ?string $method): void
    {
        // /api/mutation or /api/mutation/{sub}
        if ($id === null) {
            switch ($method) {
                case 'GET' && $sub === null:
                    $this->search();  // search: GET /api/mutation
                    break;
                    case 'GET' && $sub === 'stats':
                        $this->stats();  // stats: GET /api/mutation/stats
                        break;
                case 'POST':
                    if ($sub === 'link') {
                        $this->link();         // link mutation: POST /api/mutation/link
                    } elseif ($sub === 'unlink') {
                        $this->unlink();       // unlink mutation: POST /api/mutation/unlink
                    } else {
                        $this->create();       // create: POST /api/mutation
                    }
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/mutation/{id}
        else {
            switch ($method) {
                case 'PUT' && $sub === null:
                    $this->update($id);  // update: PUT /api/mutation/{id}
                    break;
                case 'DELETE' && $sub === null:
                    $this->delete($id);  // delete: DELETE /api/mutation/{id}
                    break;
                default:
                    json(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/mutation?...
    public function search(): void
    {
        $mutation = new Mutation($this->pdo);
        $filters = [
            'mutation_id'          => $_GET['mutation_id'] ?? null,
            'chromosome'           => $_GET['chromosome'] ?? null,
            'chromosome_start'     => $_GET['chromosome_start'] ?? null,
            'chromosome_end'       => $_GET['chromosome_end'] ?? null,
            'mutation_type'        => $_GET['mutation_type'] ?? null,
            'mutated_from_allele'  => $_GET['mutated_from_allele'] ?? null,
            'mutated_to_allele'    => $_GET['mutated_to_allele'] ?? null,
            'consequence_type'     => $_GET['consequence_type'] ?? null,
            'gene_affected'        => $_GET['gene_affected'] ?? null,
            'cancer_type'          => $_GET['cancer_type'] ?? null,
        ];
        $results = $mutation->search($filters);
        json(200, ['mutations' => $results]);
    }

    // POST /api/mutation
    public function create(): void
    {
        $data = getJsonBody();
        $mutation = new Mutation($this->pdo);
        $newId = $mutation->create($data);

        json(201, [
            'mutation_id' => $newId,
            'message'     => 'Mutation created successfully.',
        ]);
    }

    // PUT /api/mutation/{id}
    public function update(int $id): void
    {
        $data = getJsonBody();
        $mutation = new Mutation($this->pdo);

        $mutation->update($id, $data);

        json(200, [
            'message' => "Mutation {$id} updated successfully.",
        ]);
    }

    // DELETE /api/mutation/{id}
    public function delete(int $id): void
    {
        $mutation = new Mutation($this->pdo);
        $mutation->delete($id);
        json(200, ['message' => "Mutation {$id} deleted successfully."]);
    }

    // POST /api/mutation/link
    private function link(): void
    {
        $data = getJsonBody();
        $mutation = new Mutation($this->pdo);
        $mutation->linkPatient($data);
        json(200, ['message' => 'Mutation linked to patient successfully.']);
    }

    // POST /api/mutation/unlink
    private function unlink(): void
    {
        $data = getJsonBody();
        $mutation = new Mutation($this->pdo);
        $mutation->unlinkPatient($data);
        json(200, ['message' => 'Mutation unlinked from patient successfully.']);
    }

    /**
     * NEW: statistics endpoint for visualisations
     * GET /api/mutation/stats?sex=Male&minAge=0&maxAge=80&mutation_type=Missense&cancer_type=Breast
     */
    private function stats(): void
    {
        // Optional filters
        $sex          = $_GET['sex']          ?? null;       // 'Male', 'Female', 'Other'
        $minAge       = $_GET['minAge']       ?? null;
        $maxAge       = $_GET['maxAge']       ?? null;
        $mutationType = $_GET['mutation_type']?? null;
        $cancerType   = $_GET['cancer_type']  ?? null;

        $minAge = ($minAge !== null && $minAge !== '') ? (int)$minAge : null;
        $maxAge = ($maxAge !== null && $maxAge !== '') ? (int)$maxAge : null;

        $sql = "
            SELECT 
                COALESCE(m.gene_affected, 'Unknown') AS gene,
                COUNT(DISTINCT pm.patient_id) AS patient_count
            FROM mutation m
            JOIN patient_mutation pm ON pm.mutation_id = m.mutation_id
            JOIN patient p           ON p.patient_id   = pm.patient_id
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

        if ($mutationType !== null && $mutationType !== '') {
            $sql .= " AND m.mutation_type = :mutationType";
            $params[':mutationType'] = $mutationType;
        }

        if ($cancerType !== null && $cancerType !== '') {
            $sql .= " AND m.cancer_type = :cancerType";
            $params[':cancerType'] = $cancerType;
        }

        $sql .= "
            GROUP BY gene
            ORDER BY patient_count DESC
            LIMIT 10
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        json(200, $rows);
    }
}
