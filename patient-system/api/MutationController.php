<?php

declare(strict_types=1);

final class MutationController
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
        // /api/mutation
        if ($id === null) {
            switch ($method) {
                case 'GET':
                    $this->search();  // search: GET /api/mutation
                    break;
                case 'POST':
                    if ($sub === 'link') $this->link();         // link mutation: POST /api/mutation/link
                    elseif ($sub === 'unlink') $this->unlink(); // unlink mutation: POST /api/mutation/link
                    else $this->create();                       // create: POST /api/mutation
                    break;
                default:
                    json_response(405, ['error' => 'Method not allowed.']);
            }
        }
        // /api/mutation/{id}
        else {
            switch ($method) {
                case 'PUT':
                    $this->update($id);  // update: PUT /api/mutation/{id}
                    break;
                case 'DELETE':
                    $this->delete($id);  // delete: DELETE /api/mutation/{id}
                    break;
                default:
                    json_response(405, ['error' => 'Method not allowed.']);
            }
        }
    }

    // GET /api/mutation?first_name=...
    public function search(): void
    {
        $mutation = new Mutation($this->pdo);
        $filters = [
            'mutation_id' => $_GET['mutation_id'] ?? null,
            'chromosome' => $_GET['chromosome'] ?? null,
            'chromosome_start' => $_GET['chromosome_start'] ?? null,
            'chromosome_end' => $_GET['chromosome_end'] ?? null,
            'mutation_type' => $_GET['mutation_type'] ?? null,
            'mutated_from_allele' => $_GET['mutated_from_allele'] ?? null,
            'mutated_to_allele' => $_GET['mutated_to_allele'] ?? null,
            'consequence_type' => $_GET['consequence_type'] ?? null,
            'gene_affected' => $_GET['gene_affected'] ?? null,
            'cancer_type' => $_GET['cancer_type'] ?? null,
        ];
        $results = $mutation->search($filters);
        $this->json(200, ['mutations' => $results]);
    }

    // POST /api/mutation
    public function create(): void
    {
        $data = $this->getJsonBody();
        $mutation = new Mutation($this->pdo);
        $newId = $mutation->create($data);

        $this->json(201, [
            'mutation_id' => $newId,
            'message' => 'Mutation created successfully.',
        ]);
    }

    // PUT /api/mutation/{id}
    public function update(int $id): void
    {
        $data = $this->getJsonBody();
        $mutation = new Mutation($this->pdo);

        $mutation->update($id, $data);

        $this->json(200, [
            'message' => "Mutation {$id} updated successfully.",
        ]);
    }

    // DELETE /api/mutation/{id}
    public function delete(int $id): void
    {
        $mutation = new Mutation($this->pdo);
        $mutation->delete($id);
        $this->json(200, ['message' => "Mutation {$id} deleted successfully."]);
    }

    // POST /api/mutation/link
    private function link(): void
    {
        $data = $this->getJsonBody();
        $mutation = new Mutation($this->pdo);
        $mutation->linkPatient($data);
        $this->json(200, ['message' => 'Mutation linked to patient successfully.']);
    }

    // POST /api/mutation/unlink
    private function unlink(): void
    {
        $data = $this->getJsonBody();
        $mutation = new Mutation($this->pdo);
        $mutation->unlinkPatient($data);
        $this->json(200, ['message' => 'Mutation unlinked from patient successfully.']);
    }
}
