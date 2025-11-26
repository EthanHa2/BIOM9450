"use client";

import { Button, Badge, Loader } from "@mantine/core";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import { DashboardNavBar } from "@/components/DashboardNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  SearchFilterModal,
  FilterValues,
} from "@/components/SearchFilterModal";
import { IconSearch, IconUpload, IconDownload } from "@tabler/icons-react";
import { AddPatientModal, PatientFormData } from "@/components/AddPatientModal";

// PDF library
import jsPDF from "jspdf";

const PAGE_SIZE = 6;
const MAX_VISIBLE_PAGES = 5;

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  sex: string;
  dob: string;
  diagnosis?: string | null;
  treatment?: string | null;
  phenotypes?: string[];
  mutations?: Mutation[];
}

interface Diagnostic {
  diagnosis_type: string;
  treatment: string;
  description: string;
}

interface Phenotype {
  description: string;
}

interface Mutation {
  gene_affected: string;
  mutation_type: string;
  consequence_type: string;
}

function PatientCard({ patient }: { patient: Patient }) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  // Format DOB to Australian format (DD/MM/YYYY)
  const formattedDob = patient.dob
    ? new Date(patient.dob).toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-transparent shadow-md hover:border-gray-200 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{fullName}</h3>
          <span className="text-md text-gray-500">
            ID: {patient.patient_id}
          </span>
        </div>
        <Button
          component={Link}
          href={`/dashboard/patient/${patient.patient_id}`}
          variant="filled"
          radius="xl"
          size="sm"
        >
          View Details
        </Button>
      </div>

      <div className="space-y-1 text-md text-gray-700">
        <div className="flex gap-1">
          <span className="font-semibold min-w-[100px]">Sex:</span>
          <span>{patient.sex}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold text-gray-500 min-w-[100px]">
            DOB:
          </span>
          <span>{formattedDob}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold text-gray-500 min-w-[100px]">
            Diagnosis:
          </span>
          <span>{patient.diagnosis || "N/A"}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold text-gray-500 min-w-[100px]">
            Treatment:
          </span>
          <span>{patient.treatment || "N/A"}</span>
        </div>
        <div className="flex gap-1">
          <span className="font-semibold text-gray-500 min-w-[100px]">
            Phenotypes:
          </span>
          <div className="flex flex-wrap gap-2">
            {patient.phenotypes && patient.phenotypes.length > 0 ? (
              patient.phenotypes.map((phenotype, index) => (
                <Badge
                  key={index}
                  size="lg"
                  radius="md"
                  variant="light"
                  color="secondary"
                >
                  {phenotype}
                </Badge>
              ))
            ) : (
              <span className="text-gray-500">None recorded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const API_BASE_URL = "/api";

export default function DashboardPage() {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // load seed data plus related tables before rendering cards
    async function fetchData() {
      try {
        // fetch all patients
        const res = await fetch(`${API_BASE_URL}/patient`);
        const data = await res.json();
        const patientList = data.patients || [];

        // fetch details for each patient
        const fullPatients = await Promise.all(
          patientList.map(async (p: Patient) => {
            // Fetch Diagnostics
            const diagRes = await fetch(
              `${API_BASE_URL}/diagnostic?patient_id=${p.patient_id}`
            );
            const diagData = await diagRes.json();
            const diagnostics: Diagnostic[] = diagData.diagnostics || [];

            // Fetch Phenotypes
            const phenoRes = await fetch(
              `${API_BASE_URL}/phenotype?patient_id=${p.patient_id}`
            );
            const phenoData = await phenoRes.json();
            const phenotypes: Phenotype[] = phenoData.phenotypes || [];

            // Fetch Mutations
            const mutRes = await fetch(
              `${API_BASE_URL}/patient/${p.patient_id}/mutation`
            );
            const mutData = await mutRes.json();
            const mutations: Mutation[] = mutData.mutations || [];

            // get diagnosis (taking the first one for now)
            const primaryDiag = diagnostics[0];

            // map phenotype descriptions to a string array
            // flatten any semicolon-delimited phenotype notes into chips
            const phenotypeList = phenotypes.flatMap((ph) =>
              ph.description.split(";").map((s) => s.trim())
            );

            return {
              ...p,
              diagnosis: primaryDiag ? primaryDiag.diagnosis_type : null,
              treatment: primaryDiag ? primaryDiag.treatment : null,
              phenotypes: phenotypeList,
              mutations: mutations,
            };
          })
        );

        setAllPatients(fullPatients);
        setFilteredPatients(fullPatients);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleApplyFilters = (filters: FilterValues) => {
    // everything filters client-side so we can pivot instantly
    const filtered = allPatients.filter((patient) => {
      // ID Filter (exact match because ids need to be deterministic)
      if (
        filters.patientId &&
        patient.patient_id.toString() !== filters.patientId
      ) {
        return false;
      }

      // First Name Filter (case-insensitive substring search)
      if (
        filters.firstName &&
        !patient.first_name
          .toLowerCase()
          .includes(filters.firstName.toLowerCase())
      ) {
        return false;
      }

      // Last Name Filter
      if (
        filters.lastName &&
        !patient.last_name
          .toLowerCase()
          .includes(filters.lastName.toLowerCase())
      ) {
        return false;
      }

      // DOB Filter (min/max bounds coming from date pickers)
      if (filters.dobFrom) {
        const dobDate = new Date(patient.dob);
        if (dobDate < filters.dobFrom) {
          return false;
        }
      }
      if (filters.dobTo) {
        const dobDate = new Date(patient.dob);
        if (dobDate > filters.dobTo) {
          return false;
        }
      }

      // Sex Filter
      if (
        filters.sex &&
        patient.sex.toLowerCase() !== filters.sex.toLowerCase()
      ) {
        return false;
      }

      // Diagnostics Filter
      if (filters.diagnostics && filters.diagnostics.length > 0) {
        if (!patient.diagnosis) return false;
        if (
          !filters.diagnostics.some(
            (d) => patient.diagnosis!.toLowerCase() === d.toLowerCase()
          )
        ) {
          return false;
        }
      }

      // Treatment Filter
      if (filters.treatment) {
        if (!patient.treatment) return false;
        if (
          patient.treatment.toLowerCase() !== filters.treatment.toLowerCase()
        ) {
          return false;
        }
      }

      // Phenotypes Filter (every requested phenotype must exist somewhere)
      if (filters.phenotypes.length > 0) {
        if (!patient.phenotypes) return false;
        const hasAll = filters.phenotypes.every((ph) =>
          patient.phenotypes!.some((p) =>
            p.toLowerCase().includes(ph.toLowerCase())
          )
        );
        if (!hasAll) return false;
      }

      return true;
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  const handleCreatePatient = async (data: PatientFormData) => {
    // normalise payload before posting through the php rewrite
    const dobDate =
      data.dob instanceof Date
        ? data.dob
        : typeof data.dob === "string" && data.dob
        ? new Date(data.dob)
        : null;
    const dob = dobDate ? dobDate.toLocaleDateString("en-CA") : null;

    if (!dob) {
      notifications.show({
        title: "Date of birth required",
        message: "Please select a valid date of birth.",
        color: "red",
      });
      throw new Error("Date of birth required");
    }

    const sanitizedPhone = data.phone.replace(/\D/g, "");

    if (!sanitizedPhone) {
      notifications.show({
        title: "Phone required",
        message: "Please enter digits only for the phone number.",
        color: "red",
      });
      throw new Error("Phone required");
    }

    const payload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      dob,
      sex: data.sex,
      phone: sanitizedPhone,
      address: data.address.trim() || null,
      icgc_specimen_id: data.icgc_specimen_id.trim() || null,
      photo: null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to create patient.");
      }

      const result = await response.json(); // some controllers surface patient_id, others id
      const newPatientId = result.patient_id || result.id;

      if (!newPatientId) {
        throw new Error("Patient ID missing from response.");
      }

      notifications.show({
        title: "Patient created",
        message: `Patient ${payload.first_name} ${payload.last_name} created successfully.`,
        color: "green",
      });

      router.push(`/dashboard/patient/${newPatientId}`);
    } catch (error) {
      notifications.show({
        title: "Failed to create patient",
        message:
          error instanceof Error ? error.message : "Please try again later.",
        color: "red",
      });
      throw error;
    }
  };

  const totalRows = filteredPatients.length; // drive both copy and pagination logic
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = totalRows === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE;
  const endIndex =
    totalRows === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalRows);
  const pageRows =
    totalRows === 0 ? [] : filteredPatients.slice(startIndex, endIndex);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  let startPage = Math.max(1, clampedPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  let endPage = startPage + MAX_VISIBLE_PAGES - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }

  const pageNumbers: number[] = [];
  for (let p = startPage; p <= endPage; p += 1) {
    pageNumbers.push(p);
  }

  const handleDownloadReport = () => {
    // export the currently filtered list to pdf via jsPDF
    if (filteredPatients.length === 0) {
      notifications.show({
        title: "No data to export",
        message: "There are no patients matching the current filters.",
        color: "yellow",
      });
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginLeft = 14;
      const marginTop = 20;
      const lineHeight = 7;
      let y = marginTop;

      const title = "Patients Clinical Report";
      const dateStr = new Date().toLocaleString("en-AU");

      doc.setFontSize(18);
      doc.text(title, marginLeft, y);
      y += lineHeight;

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated: ${dateStr}`, marginLeft, y);
      y += lineHeight * 2;

      doc.setTextColor(0);
      doc.setFontSize(12);

      filteredPatients.forEach((p, index) => {
        // Page break if needed
        if (y > pageHeight - 30) {
          doc.addPage();
          y = marginTop;
        }

        const dobStr = p.dob
          ? new Date(p.dob).toLocaleDateString("en-AU", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A";

        const phenotypesStr =
          p.phenotypes && p.phenotypes.length > 0
            ? p.phenotypes.join("; ")
            : "None recorded";

        // Section heading
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Patient #${index + 1} — ${p.first_name} ${p.last_name} (ID: ${
            p.patient_id
          })`,
          marginLeft,
          y
        );
        y += lineHeight;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        // little helper keeps labels aligned while wrapping long text blocks
        const addWrappedText = (label: string, value: string) => {
          const labelText = `${label}: `;
          const labelWidth = doc.getTextWidth(labelText) + 1; // small spacing after label
          const maxWidth = pageWidth - marginLeft * 2;

          const lines = doc.splitTextToSize(value || "", maxWidth - labelWidth);

          // First line with label
          doc.text(labelText, marginLeft, y);
          doc.text(String(lines[0] || ""), marginLeft + labelWidth, y);
          y += lineHeight;

          // Remaining lines (indented)
          for (let i = 1; i < lines.length; i++) {
            if (y > pageHeight - 20) {
              doc.addPage();
              y = marginTop;
            }
            doc.text(String(lines[i]), marginLeft + labelWidth, y);
            y += lineHeight;
          }
        };

        addWrappedText("Sex", p.sex || "N/A");
        addWrappedText("Date of Birth", dobStr);
        addWrappedText("Diagnosis", p.diagnosis || "N/A");
        addWrappedText("Treatment", p.treatment || "N/A");
        addWrappedText("Phenotypes", phenotypesStr);
        // Mutations removed from summary report

        y += lineHeight; // extra spacing between patients
      });

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`patients_report_${fileDate}.pdf`);

      notifications.show({
        title: "Report downloaded",
        message: "Patients report exported as PDF.",
        color: "green",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifications.show({
        title: "Download failed",
        message: "Could not generate the report. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden">
        <DashboardNavBar />
        <main className="flex-1 flex flex-col px-30 py-20 overflow-y-auto">
          {/* Header Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold ">Patients Overview</h1>
          </div>

          {/* Controls Row */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="filled"
              size="md"
              radius="md"
              onClick={() => setIsFilterOpen(true)}
              leftSection={<IconSearch />}
            >
              Search & Filter
            </Button>

            <div className="flex gap-4">
              <Button
                variant="light"
                size="md"
                radius="md"
                leftSection={<IconUpload />}
                onClick={() => setIsAddPatientOpen(true)}
              >
                Add New Patient
              </Button>
              <Button
                variant="light"
                size="md"
                radius="md"
                leftSection={<IconDownload />}
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
            </div>
          </div>

          {/* Grid Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="xl" />
            </div>
          ) : totalRows === 0 ? (
            <div className="col-span-2 text-3xl text-center text-gray-500 py-10">
              No patients found matching criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pageRows.map((patient) => (
                  <PatientCard key={patient.patient_id} patient={patient} />
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-6">
                <span className="text-sm text-slate-500">
                  Showing {startIndex + 1}-{endIndex} of {totalRows} patients
                </span>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={clampedPage === 1}
                    onClick={handlePrev}
                  >
                    Previous
                  </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={clampedPage === totalPages}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>

        <SearchFilterModal
          opened={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApplyFilters}
        />

        <AddPatientModal
          opened={isAddPatientOpen}
          onClose={() => setIsAddPatientOpen(false)}
          onApply={handleCreatePatient}
        />
      </div>
    </ProtectedRoute>
  );
}
