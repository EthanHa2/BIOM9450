"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Loader,
  Table,
  Tabs,
  ActionIcon,
  Group,
  Card,
  Text,
  Stack,
  SimpleGrid,
  Image as MantineImage,
} from "@mantine/core";
import { DashboardNavBar } from "@/components/DashboardNavBar";
import { IconSearch, IconTrash, IconEdit } from "@tabler/icons-react";
import {
  MutationFilterModal,
  MutationFilterValues,
} from "@/components/MutationFilterModal";
import {
  AddMutationModal,
  MutationFormData,
} from "@/components/AddMutationModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { formatString } from "@/utils/stringUtils";

interface GeneHotspot {
  gene_affected: string;
  mutation_count: number;
}

interface MutationRow {
  mutation_id: number;
  icgc_specimen_id: string;
  chromosome: string;
  chromosome_start: number;
  chromosome_end: number;
  mutation_type: string;
  mutated_from_allele: string;
  mutated_to_allele: string;
  consequence_type: string;
  gene_affected: string;
  cancer_type: string;
}

interface ChromosomeDistribution {
  chromosome: string;
  mutation_count: number;
}

interface MachineLearningVisualisation {
  title: string;
  description: string;
  highlight: string;
  src: string;
  alt: string;
}

const PAGE_SIZE = 10;
const ML_IMAGE_MAX_HEIGHT = 400;

const machineLearningVisualisations: MachineLearningVisualisation[] = [
  {
    title: "Random Forest ROC Curve",
    description:
      "Receiver Operating Characteristic for the random forest classifier trained on the mutation dataset.",
    highlight:
      "Area under the curve showcases discriminative performance for detecting cancer types.",
    src: "/machine_learning/roc_curve.png",
    alt: "ROC curve for the random forest cancer classifier",
  },
  {
    title: "Feature Importance",
    description:
      "Permutation-based importance scores extracted from the trained random forest model.",
    highlight:
      "Higher bars indicate genomic features that contribute most to classification confidence.",
    src: "/machine_learning/feature_importance.png",
    alt: "Feature importance chart for the random forest cancer classifier",
  },
];

export default function MutationsPage() {
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"table" | "graphs" | "ml">(
    "table"
  );

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MutationFilterValues>({
    icgcSpecimenId: "",
    mutationId: "",
    geneAffected: "",
    cancerType: null,
    chromosome: null,
    chromosomeStart: "",
    chromosomeEnd: "",
    mutationType: null,
    mutatedFrom: null,
    mutatedTo: null,
    consequenceType: "",
  });

  const [isAddMutationOpen, setIsAddMutationOpen] = useState(false);
  const [editingMutation, setEditingMutation] = useState<MutationRow | null>(
    null
  );
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [geneHotspots, setGeneHotspots] = useState<GeneHotspot[]>([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [hotspotError, setHotspotError] = useState<string | null>(null);

  const [chromosomeDist, setChromosomeDist] = useState<
    ChromosomeDistribution[]
  >([]);
  const [loadingChromDist, setLoadingChromDist] = useState(false);
  const [chromDistError, setChromDistError] = useState<string | null>(null);

  // fetch the full mutation dataset for the table view
  const fetchMutations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mutation_dataset_visual", {
        method: "GET",
        credentials: "include",
      });

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to load mutation data.");
      }

      setMutations(json.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching mutations:", err);
      setError("Could not fetch mutation data.");
      setMutations([]);
    } finally {
      setLoading(false);
    }
  };

  // load the gene frequency summary for the hotspots chart
  const fetchGeneHotspots = async () => {
    setLoadingHotspots(true);
    setHotspotError(null);
    try {
      const res = await fetch("/api/mutation_gene_frequency", {
        method: "GET",
        credentials: "include",
      });
      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to load gene hotspots.");
      }

      setGeneHotspots(json.data);
    } catch (err) {
      console.error("Error fetching gene hotspots:", err);
      setHotspotError("Could not fetch gene hotspot data.");
      setGeneHotspots([]);
    } finally {
      setLoadingHotspots(false);
    }
  };

  // load chromosome distribution stats for the second chart
  const fetchChromosomeDistribution = async () => {
    setLoadingChromDist(true);
    setChromDistError(null);
    try {
      const res = await fetch("/api/mutation_chromosome_distribution", {
        method: "GET",
        credentials: "include",
      });

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(
          json.message || "Failed to load chromosome distribution."
        );
      }

      setChromosomeDist(json.data);
    } catch (err) {
      console.error("Error fetching chromosome distribution:", err);
      setChromDistError("Could not fetch chromosome distribution data.");
      setChromosomeDist([]);
    } finally {
      setLoadingChromDist(false);
    }
  };

  // guard mutation delete with an extra confirmation step
  const openDeleteModal = (mutationId: number) => {
    setConfirmMessage(
      "Are you sure you want to delete this mutation? This action cannot be undone."
    );
    setConfirmAction(() => async () => {
      try {
        const res = await fetch(`/api/mutation/${mutationId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete mutation");
        }

        setMutations((prev) =>
          prev.filter((m) => m.mutation_id !== mutationId)
        );
      } catch (error) {
        console.error("Error deleting mutation:", error);
        alert("Failed to delete mutation.");
      }
    });
    setConfirmModalOpen(true);
  };

  // handle modal submissions, ignoring the patient-link pathway
  const handleSaveMutation = async (data: MutationFormData | number) => {
    if (typeof data === "number") {
      return;
    }
    try {
      const payload = {
        ...data,
        chromosome_start: Number(data.chromosome_start) || 0,
        chromosome_end: Number(data.chromosome_end) || 0,
      };

      let res;
      if (editingMutation) {
        // UPDATE
        res = await fetch(`/api/mutation/${editingMutation.mutation_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            mutation_id: editingMutation.mutation_id,
          }),
        });
      } else {
        // CREATE
        res = await fetch("/api/mutation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save mutation");

      // Refresh the list to show the new/updated item
      await fetchMutations();
    } catch (error) {
      console.error("Error saving mutation:", error);
      alert("Failed to save mutation.");
      throw error;
    }
  };

  const handleEdit = (mutation: MutationRow) => {
    setEditingMutation(mutation);
    setIsAddMutationOpen(true);
  };

  const handleAdd = () => {
    setEditingMutation(null);
    setIsAddMutationOpen(true);
  };

  // Desired chromosome order: 1–22, X, Y
  const chromosomeOrder = [
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
  ];

  const sortedChromosomeDist = [...chromosomeDist].sort((a, b) => {
    const ia = chromosomeOrder.indexOf(a.chromosome);
    const ib = chromosomeOrder.indexOf(b.chromosome);

    // If any unexpected labels show up, push them to the end
    const safeIa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const safeIb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;

    return safeIa - safeIb;
  });

  useEffect(() => {
    fetchMutations();
    fetchGeneHotspots();
    fetchChromosomeDistribution();
  }, []);

  // Apply filters
  // run all filters client-side so pagination remains instant
  const filteredMutations = mutations.filter((m) => {
    if (
      filters.cancerType &&
      m.cancer_type?.toLowerCase() !== filters.cancerType
    ) {
      return false;
    }

    if (filters.chromosome && m.chromosome !== filters.chromosome) {
      return false;
    }

    if (
      filters.chromosomeStart &&
      m.chromosome_start < Number(filters.chromosomeStart.replace(/,/g, ""))
    ) {
      return false;
    }

    if (
      filters.chromosomeEnd &&
      m.chromosome_end > Number(filters.chromosomeEnd.replace(/,/g, ""))
    ) {
      return false;
    }

    if (
      filters.mutatedFrom &&
      m.mutated_from_allele?.toUpperCase() !== filters.mutatedFrom
    ) {
      return false;
    }

    if (
      filters.mutatedTo &&
      m.mutated_to_allele?.toUpperCase() !== filters.mutatedTo
    ) {
      return false;
    }

    if (filters.mutationType && m.mutation_type !== filters.mutationType) {
      return false;
    }

    if (
      filters.icgcSpecimenId &&
      !m.icgc_specimen_id
        ?.toLowerCase()
        .includes(filters.icgcSpecimenId.toLowerCase())
    ) {
      return false;
    }

    if (filters.mutationId && m.mutation_id.toString() !== filters.mutationId) {
      return false;
    }

    if (
      filters.geneAffected &&
      !m.gene_affected
        ?.toLowerCase()
        .includes(filters.geneAffected.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.consequenceType &&
      !m.consequence_type
        ?.toLowerCase()
        .includes(filters.consequenceType.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const totalRows = filteredMutations.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages);

  const startIndex = totalRows === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE;
  const endIndex =
    totalRows === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalRows);

  const pageRows =
    totalRows === 0 ? [] : filteredMutations.slice(startIndex, endIndex);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const MAX_VISIBLE_PAGES = 5;

  let startPage = Math.max(1, clampedPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  let endPage = startPage + MAX_VISIBLE_PAGES - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }

  const pageNumbers: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  const rows =
    pageRows.length > 0
      ? pageRows.map((m) => (
          <Table.Tr key={m.mutation_id}>
            <Table.Td className="text-slate-800">{m.icgc_specimen_id}</Table.Td>
            <Table.Td className="text-slate-800">{m.mutation_id}</Table.Td>
            <Table.Td className="text-slate-700">{m.chromosome}</Table.Td>
            <Table.Td className="text-slate-700">{m.chromosome_start}</Table.Td>
            <Table.Td className="text-slate-700">{m.chromosome_end}</Table.Td>
            <Table.Td className="text-slate-700">
              {formatString(m.mutation_type)}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.mutated_from_allele}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.mutated_to_allele}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {formatString(m.consequence_type)}
            </Table.Td>
            <Table.Td className="text-slate-700">{m.gene_affected}</Table.Td>
            <Table.Td className="text-slate-700">
              {formatString(m.cancer_type)}
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => handleEdit(m)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => openDeleteModal(m.mutation_id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))
      : [
          <Table.Tr key="no-data">
            <Table.Td
              colSpan={11}
              className="text-center text-sm text-slate-500 py-6"
            >
              No mutations match the current filters. Adjust the filters above
              to see results.
            </Table.Td>
          </Table.Tr>,
        ];

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-20 py-20 overflow-y-auto bg-slate-50">
        {/* Header Title */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Mutations Overview
            </h1>
            {activeTab === "table" && (
              <p className="text-slate-600 mt-1">
                View and filter imported mutation records from the CSV dataset.
              </p>
            )}
          </div>
        </div>

        {/* Controls Row */}
        {activeTab === "table" && (
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="filled"
              size="md"
              radius="md"
              onClick={() => setIsFilterOpen(true)}
              leftSection={<IconSearch size={16} />}
            >
              Search &amp; Filter
            </Button>

            <div className="flex gap-4">
              <Button
                variant="filled"
                size="md"
                radius="md"
                onClick={handleAdd}
              >
                Add Mutation
              </Button>
            </div>
          </div>
        )}

        {/* Tabs for Table vs Graphs */}
        <Tabs
          value={activeTab}
          onChange={(val) =>
            setActiveTab((val as "table" | "graphs" | "ml") || "table")
          }
          keepMounted={false}
        >
          <Tabs.List>
            <Tabs.Tab value="table">Mutation Table</Tabs.Tab>
            <Tabs.Tab value="graphs">Data Visualisation Graphs</Tabs.Tab>
            <Tabs.Tab value="ml">Machine Learning Visualisations</Tabs.Tab>
          </Tabs.List>

          {/* TABLE TAB */}
          <Tabs.Panel value="table" pt="md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader size="xl" />
              </div>
            ) : error ? (
              <div className="text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Mutation Records
                  </h2>
                  <span className="text-sm text-slate-500">
                    {totalRows > 0
                      ? `Showing ${
                          startIndex + 1
                        }–${endIndex} of ${totalRows} records`
                      : "0 records match current filters"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table striped highlightOnHover className="min-w-full">
                    <Table.Thead>
                      <Table.Tr className="bg-slate-100">
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          ICGC Specimen ID
                        </Table.Th>
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Mutation ID
                        </Table.Th>

                        {/* Chromosome with dropdown filter */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>Chromosome</span>
                          </div>
                        </Table.Th>

                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Chr Start
                        </Table.Th>
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Chr End
                        </Table.Th>

                        {/* Mutation type dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>Mutation Type</span>
                          </div>
                        </Table.Th>

                        {/* Mutated from allele dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>From</span>
                          </div>
                        </Table.Th>

                        {/* Mutated to allele dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>To</span>
                          </div>
                        </Table.Th>

                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Consequence
                        </Table.Th>
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Gene
                        </Table.Th>

                        {/* Cancer type dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>Cancer Type</span>
                          </div>
                        </Table.Th>
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          Actions
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                  </Table>
                </div>

                {/* Pagination footer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
                  <span className="text-sm text-slate-500">
                    Page {clampedPage} of {totalPages}
                  </span>

                  <div className="flex gap-2 justify-end">
                    {/* Previous */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clampedPage === 1 || totalRows === 0}
                      onClick={handlePrev}
                    >
                      Previous
                    </Button>

                    {/* Page numbers */}
                    {pageNumbers.map((page) => (
                      <Button
                        key={page}
                        variant={page === clampedPage ? "filled" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    {/* Next */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clampedPage === totalPages || totalRows === 0}
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Tabs.Panel>

          {/* GRAPHS TAB */}
          <Tabs.Panel value="graphs" pt="md">
            {/* Gene Hotspots */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Gene Hotspots
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Top 10 most frequently mutated genes in the imported
                    dataset.
                  </p>
                </div>
                <Button variant="subtle" size="sm" onClick={fetchGeneHotspots}>
                  Refresh hotspots
                </Button>
              </div>

              {loadingHotspots ? (
                <div className="flex justify-center items-center h-48">
                  <Loader size="lg" />
                </div>
              ) : hotspotError ? (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {hotspotError}
                </div>
              ) : geneHotspots.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No hotspot data available. Check that the{" "}
                  <code className="px-1 bg-slate-100 rounded">
                    gene_affected
                  </code>{" "}
                  column is populated in the mutation table.
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={geneHotspots}
                      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="gene_affected"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value} mutations`, "Count"]}
                        labelFormatter={(label) => `Gene: ${label}`}
                      />
                      <Bar dataKey="mutation_count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chromosome Mutation Distribution */}
            <div className="mt-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Chromosome Mutation Distribution
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Number of mutations per chromosome in the imported dataset.
                  </p>
                </div>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={fetchChromosomeDistribution}
                >
                  Refresh chromosomes
                </Button>
              </div>

              {loadingChromDist ? (
                <div className="flex justify-center items-center h-48">
                  <Loader size="lg" />
                </div>
              ) : chromDistError ? (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {chromDistError}
                </div>
              ) : chromosomeDist.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No chromosome distribution data available. Ensure the{" "}
                  <code className="px-1 bg-slate-100 rounded">chromosome</code>{" "}
                  column is populated in the mutation table.
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedChromosomeDist}
                      margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="chromosome"
                        label={{
                          value: "Chromosome",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Mutation count",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} mutations`, "Count"]}
                        labelFormatter={(label) => `Chromosome: ${label}`}
                      />
                      <Bar dataKey="mutation_count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="ml" pt="md">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Machine Learning Outputs
                </h2>
                <p className="text-slate-600 text-sm">
                  Visualisations generated by the machine learning workflow to
                  interpret the random forest cancer predictor.
                </p>
              </div>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {machineLearningVisualisations.map((viz) => (
                  <Card key={viz.title} shadow="md" padding="lg" radius="md">
                    <Card.Section withBorder inheritPadding py="sm">
                      <Text component="h3" fw={600} fz="lg">
                        {viz.title}
                      </Text>
                      <Text fz="sm" c="dimmed">
                        {viz.description}
                      </Text>
                    </Card.Section>
                    <Card.Section py="md">
                      <MantineImage
                        src={viz.src}
                        alt={viz.alt}
                        radius="md"
                        fit="contain"
                        loading="lazy"
                        mah={ML_IMAGE_MAX_HEIGHT}
                        w="100%"
                      />
                    </Card.Section>
                    <Stack gap="xs">
                      <Text fz="sm" c="dimmed">
                        Insight
                      </Text>
                      <Text fz="sm">{viz.highlight}</Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </div>
          </Tabs.Panel>
        </Tabs>
      </main>

      <MutationFilterModal
        opened={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />

      <AddMutationModal
        opened={isAddMutationOpen}
        onClose={() => setIsAddMutationOpen(false)}
        onApply={handleSaveMutation}
        initialData={
          editingMutation
            ? {
                icgc_specimen_id: editingMutation.icgc_specimen_id,
                chromosome: editingMutation.chromosome,
                chromosome_start: editingMutation.chromosome_start,
                chromosome_end: editingMutation.chromosome_end,
                mutation_type: editingMutation.mutation_type,
                mutated_from_allele: editingMutation.mutated_from_allele,
                mutated_to_allele: editingMutation.mutated_to_allele,
                consequence_type: editingMutation.consequence_type,
                gene_affected: editingMutation.gene_affected,
                cancer_type: editingMutation.cancer_type,
              }
            : null
        }
      />

      <ConfirmationModal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmAction || (async () => {})}
        message={confirmMessage}
        title="Confirm Deletion"
        confirmLabel="Delete"
        confirmColor="red"
      />
    </div>
  );
}
