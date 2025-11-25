"use client";

import { useEffect, useState } from "react";
import {
  Loader,
  Table,
  Button,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { DashboardNavBar } from "@/components/DashboardNavBar";
import { IconChevronDown } from "@tabler/icons-react";

interface PatientRow {
  patient_id: number;
  name: string;
  sex: string;
  dob: string; // ISO date string
  diagnosis: string;
  phenotypes: string;
  genes: string;
}

const PAGE_SIZE = 10;

type SexFilter = "all" | "Male" | "Female";
type AgeFilter = "all" | "under18" | "over18";

function getAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function VisualisationsPage() {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [sexFilter, setSexFilter] = useState<SexFilter>("all");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");

  const fetchAllPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost/BIOM9450_MajorProject/BIOM9450/patient-system/patient_visualtable.php", {
        method: "GET",
        credentials: "include",
      });

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        throw new Error(json.message || "Failed to load data");
      }

      setPatients(json.data);
      setCurrentPage(1); // reset to first page when refetching
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Could not fetch patient data.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Apply filters (sex + age) before pagination
  const filteredPatients = patients.filter((p) => {
    // Sex filter
    if (sexFilter !== "all" && p.sex !== sexFilter) {
      return false;
    }

    // Age filter
    const age = getAge(p.dob);
    if (ageFilter === "under18" && age >= 18) return false;
    if (ageFilter === "over18" && age < 18) return false;

    return true;
  });

  const totalRows = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages);

  const startIndex = totalRows === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE;
  const endIndex =
    totalRows === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalRows);
  const pageRows =
    totalRows === 0
      ? []
      : filteredPatients.slice(startIndex, endIndex);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const rows =
    pageRows.length > 0
      ? pageRows.map((p) => {
          const age = getAge(p.dob);
          return (
            <Table.Tr key={p.patient_id}>
              <Table.Td className="font-medium text-slate-800">
                {p.patient_id}
              </Table.Td>
              <Table.Td className="text-slate-800">{p.name}</Table.Td>
              <Table.Td className="text-slate-700">{p.sex}</Table.Td>
              <Table.Td className="text-slate-700">{age}</Table.Td>
              <Table.Td className="text-slate-700">
                {new Date(p.dob).toLocaleDateString()}
              </Table.Td>
              <Table.Td className="text-slate-700">
                {p.diagnosis}
              </Table.Td>
              <Table.Td className="text-slate-700">
                {p.phenotypes || "None recorded"}
              </Table.Td>
              <Table.Td className="text-slate-700">
                {p.genes || "None recorded"}
              </Table.Td>
            </Table.Tr>
          );
        })
      : // If no rows match filters, show a single message row
        [
          <Table.Tr key="no-data">
            <Table.Td
              colSpan={8}
              className="text-center text-sm text-slate-500 py-6"
            >
              No patients match the current filters. Adjust filters to see results.
            </Table.Td>
          </Table.Tr>,
        ];

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-40 py-25 overflow-y-auto">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold ">Mutations Overview</h1>
        </div>

        {/* Content */}
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
                All Patients
              </h2>
              <span className="text-sm text-slate-500">
                {totalRows > 0 ? (
                  <>
                    Showing {startIndex + 1}–{endIndex} of {totalRows} patients
                  </>
                ) : (
                  <>0 patients match current filters</>
                )}
                {sexFilter !== "all" && ` | Sex: ${sexFilter}`}
                {ageFilter === "under18" && " | Age: <18"}
                {ageFilter === "over18" && " | Age: 18+"}
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
                      ID
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Name
                    </Table.Th>

                    {/* Sex column with dropdown filter */}
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        <span>Sex</span>
                        <Menu
                          withinPortal
                          position="bottom-end"
                          shadow="md"
                        >
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              aria-label="Filter by sex"
                              size="sm"
                            >
                              <IconChevronDown size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Filter by sex</Menu.Label>
                            <Menu.Item
                              onClick={() => {
                                setSexFilter("all");
                                setCurrentPage(1);
                              }}
                            >
                              All
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => {
                                setSexFilter("Male");
                                setCurrentPage(1);
                              }}
                            >
                              Male
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => {
                                setSexFilter("Female");
                                setCurrentPage(1);
                              }}
                            >
                              Female
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>
                    </Table.Th>

                    {/* Age column with dropdown filter */}
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      <div className="flex items-center gap-1">
                        <span>Age</span>
                        <Menu
                          withinPortal
                          position="bottom-end"
                          shadow="md"
                        >
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              aria-label="Filter by age"
                              size="sm"
                            >
                              <IconChevronDown size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Filter by age</Menu.Label>
                            <Menu.Item
                              onClick={() => {
                                setAgeFilter("all");
                                setCurrentPage(1);
                              }}
                            >
                              All
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => {
                                setAgeFilter("under18");
                                setCurrentPage(1);
                              }}
                            >
                              Under 18
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => {
                                setAgeFilter("over18");
                                setCurrentPage(1);
                              }}
                            >
                              18+
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>
                    </Table.Th>

                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      DOB
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Diagnosis
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Phenotypes
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Genes / Mutations
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={clampedPage === 1 || totalRows === 0}
                  onClick={handlePrev}
                >
                  Previous
                </Button>
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
      </main>
    </div>
  );
}
