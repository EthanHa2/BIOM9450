"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Loader,
  Table,
  Menu,
  ActionIcon,
  Tabs, // ⬅️ NEW
} from "@mantine/core";
import { DashboardNavBar } from "@/components/DashboardNavBar";
import { IconChevronDown } from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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

const PAGE_SIZE = 10;

type CancerFilter =
  | "all"
  | "blood"
  | "brain"
  | "breast"
  | "prostate"
  | "pancreas"
  | "liver";

type AlleleFilter = "all" | "A" | "T" | "C" | "G";

type MutationTypeFilter =
  | "all"
  | "single base substitution"
  | "insertion of <=200bp"
  | "deletion of <= 200bp";

type ChromosomeFilter =
  | "all"
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20"
  | "21" | "22"
  | "X"
  | "Y";

export default function MutationsPage() {
  const [loading, setLoading] = useState(false);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [cancerFilter, setCancerFilter] = useState<CancerFilter>("all");
  const [chrFilter, setChrFilter] = useState<ChromosomeFilter>("all");
  const [fromFilter, setFromFilter] = useState<AlleleFilter>("all");
  const [toFilter, setToFilter] = useState<AlleleFilter>("all");
  const [mutationTypeFilter, setMutationTypeFilter] =
    useState<MutationTypeFilter>("all");

  const [geneHotspots, setGeneHotspots] = useState<GeneHotspot[]>([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [hotspotError, setHotspotError] = useState<string | null>(null);

  const [chromosomeDist, setChromosomeDist] = useState<ChromosomeDistribution[]>([]);
  const [loadingChromDist, setLoadingChromDist] = useState(false);
  const [chromDistError, setChromDistError] = useState<string | null>(null);

  const fetchMutations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "http://localhost/BIOM9450_MajorProject/BIOM9450/patient-system/mutation_dataset_visual.php",
        {
          method: "GET",
          credentials: "include",
        }
      );

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

  const fetchGeneHotspots = async () => {
    setLoadingHotspots(true);
    setHotspotError(null);
    try {
      const res = await fetch(
        "http://localhost/BIOM9450_MajorProject/BIOM9450/patient-system/mutation_gene_frequency.php",
        {
          method: "GET",
          credentials: "include",
        }
      );
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

  const fetchChromosomeDistribution = async () => {
    setLoadingChromDist(true);
    setChromDistError(null);
    try {
      const res = await fetch(
        "http://localhost/BIOM9450_MajorProject/BIOM9450/patient-system/mutation_chromosome_distribution.php",
        {
          method: "GET",
          credentials: "include",
        }
      );

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to load chromosome distribution.");
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

  // Desired chromosome order: 1–22, X, Y
  const chromosomeOrder = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "X", "Y",
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
  const filteredMutations = mutations.filter((m) => {
    if (cancerFilter !== "all" && m.cancer_type.toLowerCase() !== cancerFilter) {
      return false;
    }

    if (chrFilter !== "all" && m.chromosome !== chrFilter) {
      return false;
    }

    if (
      fromFilter !== "all" &&
      m.mutated_from_allele.toUpperCase() !== fromFilter
    ) {
      return false;
    }

    if (
      toFilter !== "all" &&
      m.mutated_to_allele.toUpperCase() !== toFilter
    ) {
      return false;
    }

    if (
      mutationTypeFilter !== "all" &&
      m.mutation_type !== mutationTypeFilter
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
            <Table.Td className="text-slate-800">
              {m.icgc_specimen_id}
            </Table.Td>
            <Table.Td className="text-slate-800">
              {m.mutation_id}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.chromosome}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.chromosome_start}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.chromosome_end}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.mutation_type}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.mutated_from_allele}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.mutated_to_allele}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.consequence_type}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.gene_affected}
            </Table.Td>
            <Table.Td className="text-slate-700">
              {m.cancer_type}
            </Table.Td>
          </Table.Tr>
        ))
      : [
          <Table.Tr key="no-data">
            <Table.Td
              colSpan={11}
              className="text-center text-sm text-slate-500 py-6"
            >
              No mutations match the current filters. Adjust the filters
              above to see results.
            </Table.Td>
          </Table.Tr>,
        ];

  return (
    <div className="min-h-screen flex">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-40 py-25 overflow-y-auto bg-slate-50">
        {/* Header Title */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Mutations Overview
            </h1>
            <p className="text-slate-600 mt-1">
              View and filter imported mutation records from the CSV dataset.
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            radius="md"
            onClick={fetchMutations}
          >
            Refresh
          </Button>
        </div>

        {/* Controls Row */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="filled" size="md" radius="md">
            Search &amp; Filter
          </Button>

          <div className="flex gap-4">
            <Button variant="filled" size="md" radius="md">
              Upload Mutations
            </Button>
            <Button variant="filled" size="md" radius="md">
              Download Report
            </Button>
          </div>
        </div>

        {/* Tabs for Table vs Graphs */}
        <Tabs defaultValue="table" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="table">Mutation Table</Tabs.Tab>
            <Tabs.Tab value="graphs">Data Visualisation Graphs</Tabs.Tab>
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
                      ? `Showing ${startIndex + 1}–${endIndex} of ${totalRows} records`
                      : "0 records match current filters"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table
                    striped
                    highlightOnHover
                    withColumnBorders
                    className="min-w-full"
                  >
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
                            <Menu
                              withinPortal
                              position="bottom-end"
                              shadow="md"
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Filter by chromosome"
                                  size="sm"
                                >
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown
                                style={{ maxHeight: 250, overflowY: "auto" }}
                              >
                                <Menu.Label>Filter by chromosome</Menu.Label>
                                <Menu.Item
                                  onClick={() => {
                                    setChrFilter("all");
                                    setCurrentPage(1);
                                  }}
                                >
                                  All
                                </Menu.Item>
                                {[...Array(22)].map((_, i) => {
                                  const chr = String(i + 1) as ChromosomeFilter;
                                  return (
                                    <Menu.Item
                                      key={chr}
                                      onClick={() => {
                                        setChrFilter(chr);
                                        setCurrentPage(1);
                                      }}
                                    >
                                      {chr}
                                    </Menu.Item>
                                  );
                                })}
                                <Menu.Item
                                  onClick={() => {
                                    setChrFilter("X");
                                    setCurrentPage(1);
                                  }}
                                >
                                  X
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() => {
                                    setChrFilter("Y");
                                    setCurrentPage(1);
                                  }}
                                >
                                  Y
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
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
                            <Menu
                              withinPortal
                              position="bottom-end"
                              shadow="md"
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Filter by mutation type"
                                  size="sm"
                                >
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Filter by mutation type</Menu.Label>
                                <Menu.Item
                                  onClick={() => {
                                    setMutationTypeFilter("all");
                                    setCurrentPage(1);
                                  }}
                                >
                                  All
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() => {
                                    setMutationTypeFilter(
                                      "single base substitution"
                                    );
                                    setCurrentPage(1);
                                  }}
                                >
                                  single base substitution
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() => {
                                    setMutationTypeFilter(
                                      "insertion of <=200bp"
                                    );
                                    setCurrentPage(1);
                                  }}
                                >
                                  insertion of &lt;=200bp
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() => {
                                    setMutationTypeFilter(
                                      "deletion of <= 200bp"
                                    );
                                    setCurrentPage(1);
                                  }}
                                >
                                  deletion of &lt;= 200bp
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </div>
                        </Table.Th>

                        {/* Mutated from allele dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>From</span>
                            <Menu
                              withinPortal
                              position="bottom-end"
                              shadow="md"
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Filter by from allele"
                                  size="sm"
                                >
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mutated from allele</Menu.Label>
                                <Menu.Item
                                  onClick={() => {
                                    setFromFilter("all");
                                    setCurrentPage(1);
                                  }}
                                >
                                  All
                                </Menu.Item>
                                {["A", "T", "C", "G"].map((allele) => (
                                  <Menu.Item
                                    key={allele}
                                    onClick={() => {
                                      setFromFilter(allele as AlleleFilter);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    {allele}
                                  </Menu.Item>
                                ))}
                              </Menu.Dropdown>
                            </Menu>
                          </div>
                        </Table.Th>

                        {/* Mutated to allele dropdown */}
                        <Table.Th className="text-slate-700 text-sm font-semibold">
                          <div className="flex items-center gap-1">
                            <span>To</span>
                            <Menu
                              withinPortal
                              position="bottom-end"
                              shadow="md"
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Filter by to allele"
                                  size="sm"
                                >
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Mutated to allele</Menu.Label>
                                <Menu.Item
                                  onClick={() => {
                                    setToFilter("all");
                                    setCurrentPage(1);
                                  }}
                                >
                                  All
                                </Menu.Item>
                                {["A", "T", "C", "G"].map((allele) => (
                                  <Menu.Item
                                    key={allele}
                                    onClick={() => {
                                      setToFilter(allele as AlleleFilter);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    {allele}
                                  </Menu.Item>
                                ))}
                              </Menu.Dropdown>
                            </Menu>
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
                            <Menu
                              withinPortal
                              position="bottom-end"
                              shadow="md"
                            >
                              <Menu.Target>
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Filter by cancer type"
                                  size="sm"
                                >
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Filter by cancer type</Menu.Label>
                                <Menu.Item
                                  onClick={() => {
                                    setCancerFilter("all");
                                    setCurrentPage(1);
                                  }}
                                >
                                  All
                                </Menu.Item>
                                {[
                                  "blood",
                                  "brain",
                                  "breast",
                                  "prostate",
                                  "pancreas",
                                  "liver",
                                ].map((ct) => (
                                  <Menu.Item
                                    key={ct}
                                    onClick={() => {
                                      setCancerFilter(ct as CancerFilter);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
                                  </Menu.Item>
                                ))}
                              </Menu.Dropdown>
                            </Menu>
                          </div>
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
                      disabled={
                        clampedPage === totalPages || totalRows === 0
                      }
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
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={fetchGeneHotspots}
                >
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
        </Tabs>
      </main>
    </div>
  );
}
