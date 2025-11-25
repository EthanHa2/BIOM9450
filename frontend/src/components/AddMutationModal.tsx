"use client";

import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Select,
  Tabs,
  Grid,
  Divider,
  Table,
  ScrollArea,
  Pagination,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { IconSearch, IconPlus, IconFilter } from "@tabler/icons-react";
import { formatString } from "@/utils/stringUtils";

export interface MutationFormData {
  mutation_id?: number;
  icgc_specimen_id: string;
  chromosome: string;
  chromosome_start: number | "";
  chromosome_end: number | "";
  mutation_type: string;
  mutated_from_allele: string;
  mutated_to_allele: string;
  consequence_type: string;
  gene_affected: string;
  cancer_type: string;
}

interface AddMutationModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (data: MutationFormData | number) => Promise<void>;
  initialData?: MutationFormData | null;
  searchEnabled?: boolean;
}

const defaultData: MutationFormData = {
  icgc_specimen_id: "",
  chromosome: "",
  chromosome_start: "",
  chromosome_end: "",
  mutation_type: "",
  mutated_from_allele: "",
  mutated_to_allele: "",
  consequence_type: "",
  gene_affected: "",
  cancer_type: "",
};

export function AddMutationModal({
  opened,
  onClose,
  onApply,
  initialData,
  searchEnabled = false,
}: AddMutationModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("create");
  const [formData, setFormData] = useState<MutationFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictionInfo, setPredictionInfo] = useState<string | null>(null);

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    geneAffected: "",
    icgcSpecimenId: "",
    mutationId: "",
    cancerType: "",
    chromosome: "",
  });
  const [searchResults, setSearchResults] = useState<MutationFormData[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMutationId, setSelectedMutationId] = useState<number | null>(
    null
  );
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (opened) {
      setFormData(initialData || defaultData);
      setPredictionInfo(null);
      setSearchFilters({
        geneAffected: "",
        icgcSpecimenId: "",
        mutationId: "",
        cancerType: "",
        chromosome: "",
      });
      setSearchResults([]);
      setSelectedMutationId(null);
      setActiveTab(searchEnabled ? "search" : "create");
      setShowAdvancedSearch(false);
      setPage(1);
    }
  }, [opened, initialData, searchEnabled]);

  const handleSearch = async () => {
    // Only search if at least one filter is present
    const { geneAffected, icgcSpecimenId, mutationId, cancerType, chromosome } =
      searchFilters;
    if (
      !geneAffected &&
      !icgcSpecimenId &&
      !mutationId &&
      !cancerType &&
      !chromosome
    )
      return;

    setSearching(true);
    setSelectedMutationId(null);
    setPage(1);

    try {
      // Construct query parameters
      const params = new URLSearchParams();
      if (geneAffected) params.append("gene_affected", geneAffected);
      if (icgcSpecimenId) params.append("icgc_specimen_id", icgcSpecimenId);
      if (mutationId) params.append("mutation_id", mutationId);
      if (cancerType) params.append("cancer_type", cancerType);
      if (chromosome) params.append("chromosome", chromosome);

      const res = await fetch(`/api/mutation?${params.toString()}`);
      const data = await res.json();

      if (data.mutations) {
        setSearchResults(data.mutations);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Calculate paginated results
  const paginatedResults = searchResults.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleLinkExisting = async () => {
    if (!selectedMutationId) return;
    try {
      setSubmitting(true);
      await onApply(selectedMutationId); // Pass ID instead of data object
      onClose();
    } catch (error) {
      console.error("Link failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePredict = async () => {
    const {
      chromosome_start,
      chromosome_end,
      mutated_from_allele,
      mutated_to_allele,
      gene_affected,
    } = formData;

    if (
      !chromosome_start ||
      !chromosome_end ||
      !mutated_from_allele ||
      !mutated_to_allele ||
      !gene_affected
    ) {
      return; // Should be disabled in UI
    }

    setPredicting(true);
    setPredictionInfo(null);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chromosome_start,
          chromosome_end,
          mutated_from_allele,
          mutated_to_allele,
          gene_affected,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Prediction failed");
      }

      const data = await res.json();
      if (data.predicted_cancer_type) {
        handleChange("cancer_type", data.predicted_cancer_type);
        setPredictionInfo(`${data.display_text}`);
      } else {
        setPredictionInfo("Could not predict cancer type.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "Error running prediction.";
      setPredictionInfo(errorMessage);
    } finally {
      setPredicting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await onApply(formData);
      setFormData(defaultData);
      onClose();
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof MutationFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if all required fields are filled
  const isValid =
    formData.icgc_specimen_id &&
    formData.gene_affected &&
    formData.chromosome &&
    formData.chromosome_start !== "" &&
    formData.chromosome_end !== "" &&
    formData.mutated_from_allele &&
    formData.mutated_to_allele &&
    formData.mutation_type &&
    formData.consequence_type;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl">
          {initialData ? "Edit Mutation" : "Add New Mutation"}
        </Text>
      }
      size={activeTab === "search" ? "80%" : "lg"}
      padding="xl"
      radius="md"
      centered
    >
      {searchEnabled ? (
        <Tabs value={activeTab} onChange={setActiveTab} mb="md">
          <Tabs.List grow>
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              Search Existing
            </Tabs.Tab>
            <Tabs.Tab value="create" leftSection={<IconPlus size={16} />}>
              Create New
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search" pt="md">
            <Stack>
              <Group align="flex-end">
                <TextInput
                  label="Gene Affected"
                  placeholder="e.g. TP53"
                  style={{ flex: 1 }}
                  value={searchFilters.geneAffected}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      geneAffected: e.target.value,
                    })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  variant={showAdvancedSearch ? "filled" : "light"}
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  leftSection={<IconFilter size={16} />}
                >
                  Advanced
                </Button>
                <Button onClick={handleSearch} loading={searching}>
                  Search
                </Button>
              </Group>

              {showAdvancedSearch && (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label="ICGC Specimen ID"
                        placeholder="Search ID"
                        value={searchFilters.icgcSpecimenId}
                        onChange={(e) =>
                          setSearchFilters({
                            ...searchFilters,
                            icgcSpecimenId: e.target.value,
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Mutation ID"
                        placeholder="Search ID"
                        value={searchFilters.mutationId}
                        onChange={(e) =>
                          setSearchFilters({
                            ...searchFilters,
                            mutationId: e.target.value,
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label="Cancer Type"
                        placeholder="Select"
                        data={[
                          "blood",
                          "brain",
                          "breast",
                          "prostate",
                          "pancreas",
                          "liver",
                        ].map((t) => ({ value: t, label: formatString(t) }))}
                        value={searchFilters.cancerType || null}
                        onChange={(val) =>
                          setSearchFilters({
                            ...searchFilters,
                            cancerType: val || "",
                          })
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label="Chromosome"
                        placeholder="Select"
                        data={[
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10",
                          "11",
                          "12",
                          "13",
                          "14",
                          "15",
                          "16",
                          "17",
                          "18",
                          "19",
                          "20",
                          "21",
                          "22",
                          "X",
                          "Y",
                        ]}
                        value={searchFilters.chromosome || null}
                        onChange={(val) =>
                          setSearchFilters({
                            ...searchFilters,
                            chromosome: val || "",
                          })
                        }
                        clearable
                      />
                    </Grid.Col>
                  </Grid>
                </div>
              )}

              <Divider />

              {searchResults.length > 0 ? (
                <>
                  <Text size="sm" c="dimmed" mb="xs">
                    Found {searchResults.length} results
                  </Text>
                  <ScrollArea h={400} className="border rounded-md bg-slate-50">
                    <Table stickyHeader highlightOnHover verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID</Table.Th>
                          <Table.Th>Gene</Table.Th>
                          <Table.Th>Specimen ID</Table.Th>
                          <Table.Th>Location</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Cancer Type</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedResults.map((m) => (
                          <Table.Tr
                            key={m.mutation_id}
                            onClick={() =>
                              setSelectedMutationId(m.mutation_id || null)
                            }
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                selectedMutationId === m.mutation_id
                                  ? "var(--mantine-color-blue-0)"
                                  : undefined,
                            }}
                          >
                            <Table.Td>{m.mutation_id}</Table.Td>
                            <Table.Td style={{ fontWeight: 500 }}>
                              {m.gene_affected}
                            </Table.Td>
                            <Table.Td>{m.icgc_specimen_id}</Table.Td>
                            <Table.Td>
                              {m.chromosome}:{m.chromosome_start}-
                              {m.chromosome_end}
                            </Table.Td>
                            <Table.Td>{m.mutation_type}</Table.Td>
                            <Table.Td>{formatString(m.cancer_type)}</Table.Td>
                            <Table.Td>
                              {selectedMutationId === m.mutation_id && (
                                <Text size="sm" c="blue" fw={700}>
                                  Selected
                                </Text>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                  {searchResults.length > PAGE_SIZE && (
                    <Group justify="center" mt="md">
                      <Pagination
                        total={Math.ceil(searchResults.length / PAGE_SIZE)}
                        value={page}
                        onChange={setPage}
                      />
                    </Group>
                  )}
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {searching
                    ? "Searching..."
                    : "No mutations found. Adjust your search terms."}
                </Text>
              )}

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkExisting}
                  disabled={!selectedMutationId || submitting}
                  loading={submitting}
                >
                  Link Selected Mutation
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="create" pt="md">
            {renderForm()}
          </Tabs.Panel>
        </Tabs>
      ) : (
        renderForm()
      )}
    </Modal>
  );

  function renderForm() {
    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Fields marked with <span className="text-red-500">*</span> are
          required.
        </Text>
        {/* Row 1: Identifiers */}
        <Group grow>
          <TextInput
            label="ICGC Specimen ID"
            placeholder="e.g., SP12345"
            value={formData.icgc_specimen_id}
            onChange={(e) => handleChange("icgc_specimen_id", e.target.value)}
            required
            radius="md"
          />
          <TextInput
            label="Gene Affected"
            placeholder="e.g., TP53"
            value={formData.gene_affected}
            onChange={(e) => handleChange("gene_affected", e.target.value)}
            required
            radius="md"
          />
        </Group>

        {/* Row 2: Chromosome Location */}
        <Group grow align="flex-start">
          <Select
            label="Chromosome"
            placeholder="Select"
            data={[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "12",
              "13",
              "14",
              "15",
              "16",
              "17",
              "18",
              "19",
              "20",
              "21",
              "22",
              "X",
              "Y",
            ]}
            value={formData.chromosome}
            onChange={(val) => handleChange("chromosome", val || "")}
            searchable
            required
            radius="md"
          />
          <NumberInput
            label="Start Position"
            placeholder="123456"
            value={formData.chromosome_start}
            onChange={(val) => handleChange("chromosome_start", val)}
            allowNegative={false}
            required
            radius="md"
          />
          <NumberInput
            label="End Position"
            placeholder="123456"
            value={formData.chromosome_end}
            onChange={(val) => handleChange("chromosome_end", val)}
            allowNegative={false}
            required
            radius="md"
          />
        </Group>

        {/* Row 3: Alleles */}
        <Group grow>
          <TextInput
            label="From Allele"
            placeholder="e.g., A"
            value={formData.mutated_from_allele}
            onChange={(e) =>
              handleChange("mutated_from_allele", e.target.value)
            }
            required
            radius="md"
          />
          <TextInput
            label="To Allele"
            placeholder="e.g., T"
            value={formData.mutated_to_allele}
            onChange={(e) => handleChange("mutated_to_allele", e.target.value)}
            required
            radius="md"
          />
          <TextInput
            label="Mutation Type"
            placeholder="e.g., SNP"
            value={formData.mutation_type}
            onChange={(e) => handleChange("mutation_type", e.target.value)}
            required
            radius="md"
          />
        </Group>

        {/* Row 4: Impact */}
        <Group grow align="flex-start">
          <TextInput
            label="Consequence Type"
            placeholder="e.g., Missense Variant"
            value={formData.consequence_type}
            onChange={(e) => handleChange("consequence_type", e.target.value)}
            required
            radius="md"
          />
          <div>
            <TextInput
              label="Cancer Type"
              placeholder="e.g., BRCA-US"
              value={formData.cancer_type}
              onChange={(e) => handleChange("cancer_type", e.target.value)}
              radius="md"
            />
            <Group justify="space-between" mt={5} align="center">
              <Button
                size="xs"
                variant="light"
                color="grape"
                onClick={handlePredict}
                loading={predicting}
                disabled={
                  !formData.chromosome_start ||
                  !formData.chromosome_end ||
                  !formData.mutated_from_allele ||
                  !formData.mutated_to_allele ||
                  !formData.gene_affected
                }
              >
                ✨ Predict with AI
              </Button>
              {predictionInfo && (
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
                  {predictionInfo}
                </Text>
              )}
            </Group>
          </div>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onClose}
            radius="md"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="primary"
            onClick={handleSubmit}
            radius="md"
            loading={submitting}
            disabled={!isValid}
          >
            {initialData ? "Save Changes" : "Add Mutation"}
          </Button>
        </Group>
      </Stack>
    );
  }
}
