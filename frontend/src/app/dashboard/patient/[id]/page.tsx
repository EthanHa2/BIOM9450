"use client";

import {
  Button,
  Loader,
  TextInput,
  Divider,
  Table,
  ActionIcon,
  Title,
  Affix,
  Transition,
  Group,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconDownload,
  IconTrash,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import { DashboardNavBar } from "@/components/DashboardNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatString } from "@/utils/stringUtils";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useAuth } from "@/context/AuthContext";
import {
  AddDiagnosticModal,
  DiagnosticFormData,
} from "@/components/AddDiagnosticModal";
import {
  AddPhenotypeModal,
  PhenotypeFormData,
} from "@/components/AddPhenotypeModal";
import {
  AddMutationModal,
  MutationFormData,
} from "@/components/AddMutationModal";

// --- Types ---

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  sex: string;
  dob: string;
}

interface Diagnostic {
  diagnosis_id: number;
  patient_id: number;
  clinician_id: number;
  diagnosis_type: string;
  description: string;
  treatment: string;
  diagnosis_date: string;
}

interface Phenotype {
  phenotype_id: number;
  patient_id: number;
  clinician_id: number;
  description: string;
  recorded_date: string;
}

interface Mutation {
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

// --- Helper Components ---

interface InfoRowProps {
  label: string;
  value: string | Date | null;
  isEditing: boolean;
  onChange: (value: string | Date | null) => void;
  readOnly?: boolean;
  type?: "text" | "date";
}

function InfoRow({
  label,
  value,
  isEditing,
  onChange,
  readOnly = false,
  type = "text",
}: InfoRowProps) {
  return (
    <div className="flex items-center py-2">
      <div className="font-semibold w-40 text-gray-700">{label}:</div>
      <div className="flex-1">
        {type === "date" ? (
          <DateInput
            value={
              value instanceof Date
                ? value
                : value
                ? new Date(value as string)
                : null
            }
            onChange={onChange}
            readOnly={!isEditing || readOnly}
            className="max-w-xl"
            valueFormat="DD/MM/YYYY"
            maxDate={new Date()}
            styles={{
              input: {
                backgroundColor: isEditing && !readOnly ? "white" : "#f8f9fa",
                color: "#1f2937",
                cursor: isEditing && !readOnly ? "pointer" : "default",
              },
            }}
          />
        ) : (
          <TextInput
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            readOnly={!isEditing || readOnly}
            className="max-w-xl"
            styles={{
              input: {
                backgroundColor: isEditing && !readOnly ? "white" : "#f8f9fa",
                color: "#1f2937", // gray-800
                cursor: isEditing && !readOnly ? "text" : "default",
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

const API_BASE_URL = "/api";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Modal States
  const [isAddDiagnosticOpen, setIsAddDiagnosticOpen] = useState(false);
  const [isAddPhenotypeOpen, setIsAddPhenotypeOpen] = useState(false);
  const [isAddMutationOpen, setIsAddMutationOpen] = useState(false);

  // Editing Item States
  const [editingDiagnostic, setEditingDiagnostic] = useState<Diagnostic | null>(
    null
  );
  const [editingPhenotype, setEditingPhenotype] = useState<Phenotype | null>(
    null
  );
  const [editingMutation, setEditingMutation] = useState<Mutation | null>(null);

  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Data State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [phenotypes, setPhenotypes] = useState<Phenotype[]>([]);
  const [mutations, setMutations] = useState<Mutation[]>([]);

  // Backup state for cancel functionality
  const [backupPatient, setBackupPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch Patient Details
        const pRes = await fetch(`${API_BASE_URL}/patient?patient_id=${id}`);
        const pData = await pRes.json();
        const patientObj = pData.patients ? pData.patients[0] : pData;

        if (patientObj) {
          setPatient(patientObj);
          setBackupPatient(patientObj);
        } else {
          setPatient(null);
        }

        // Fetch Diagnostics
        const dRes = await fetch(`${API_BASE_URL}/diagnostic?patient_id=${id}`);
        const dData = await dRes.json();
        setDiagnostics(dData.diagnostics || []);

        // Fetch Phenotypes
        const phRes = await fetch(`${API_BASE_URL}/phenotype?patient_id=${id}`);
        const phData = await phRes.json();
        setPhenotypes(phData.phenotypes || []);

        // Fetch Mutations
        const mRes = await fetch(`${API_BASE_URL}/patient/${id}/mutations`);
        const mData = await mRes.json();
        setMutations(mData.mutations || []);
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // --- Handlers ---

  const updatePatientField =
    (field: keyof Patient) => (value: string | Date | null) => {
      if (patient) {
        let val = value;
        if (value instanceof Date) {
          // Convert Date back to string format YYYY-MM-DD for backend/state compatibility
          val = value.toLocaleDateString("en-CA"); // en-CA outputs YYYY-MM-DD
        }
        setPatient({ ...patient, [field]: val });
      }
    };

  const handleSaveInfo = async () => {
    setBackupPatient(patient);
    setIsEditingInfo(false);
    // Ideally, make a PUT request here to update patient info in backend
  };

  const handleCancelInfo = () => {
    setPatient(backupPatient);
    setIsEditingInfo(false);
  };

  const openDeleteModal = (
    type: "diagnostic" | "phenotype" | "mutation",
    itemId: number
  ) => {
    setConfirmMessage(
      `Are you sure you want to delete this ${type}? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${type}/${itemId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete ${type}`);
        }

        if (type === "diagnostic") {
          setDiagnostics((prev) =>
            prev.filter((item) => item.diagnosis_id !== itemId)
          );
        } else if (type === "phenotype") {
          setPhenotypes((prev) =>
            prev.filter((item) => item.phenotype_id !== itemId)
          );
        } else if (type === "mutation") {
          setMutations((prev) =>
            prev.filter((item) => item.mutation_id !== itemId)
          );
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Failed to delete ${type}.`);
      }
    });
    setConfirmModalOpen(true);
  };

  const handleEditRow = (
    type: "diagnostic" | "phenotype" | "mutation",
    item: Diagnostic | Phenotype | Mutation
  ) => {
    if (type === "diagnostic" && "diagnosis_id" in item) {
      setEditingDiagnostic(item as Diagnostic);
      setIsAddDiagnosticOpen(true);
    } else if (type === "phenotype" && "phenotype_id" in item) {
      setEditingPhenotype(item as Phenotype);
      setIsAddPhenotypeOpen(true);
    } else if (type === "mutation" && "mutation_id" in item) {
      setEditingMutation(item as Mutation);
      setIsAddMutationOpen(true);
    }
  };

  const handleSaveDiagnostic = async (data: DiagnosticFormData) => {
    if (!patient || !user) return;

    try {
      const dateObj =
        data.diagnosis_date instanceof Date
          ? data.diagnosis_date
          : typeof data.diagnosis_date === "string"
          ? new Date(data.diagnosis_date)
          : new Date();

      const dateStr = dateObj.toLocaleDateString("en-CA");

      const payload = {
        patient_id: patient.patient_id,
        clinician_id: user.clinician_id,
        diagnosis_type: data.diagnosis_type,
        description: data.description,
        treatment: data.treatment,
        diagnosis_date: dateStr,
      };

      let res;
      if (editingDiagnostic) {
        res = await fetch(
          `${API_BASE_URL}/diagnostic/${editingDiagnostic.diagnosis_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              diagnosis_id: editingDiagnostic.diagnosis_id,
            }),
          }
        );
      } else {
        res = await fetch(`${API_BASE_URL}/diagnostic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save diagnostic");

      const result = await res.json();

      if (editingDiagnostic) {
        const targetId = editingDiagnostic.diagnosis_id;
        setDiagnostics((prev) =>
          prev.map((d) =>
            d.diagnosis_id === targetId
              ? { ...d, ...payload, diagnosis_id: targetId }
              : d
          )
        );
      } else {
        const newDiagnostic: Diagnostic = {
          diagnosis_id: result.diagnostic_id || result.id,
          patient_id: patient.patient_id,
          clinician_id: user.clinician_id,
          diagnosis_type: data.diagnosis_type,
          description: data.description,
          treatment: data.treatment,
          diagnosis_date: dateStr,
        };
        setDiagnostics((prev) => [...prev, newDiagnostic]);
      }
    } catch (error) {
      console.error("Error saving diagnostic:", error);
      alert("Failed to save diagnostic.");
      throw error;
    }
  };

  const handleSavePhenotype = async (data: PhenotypeFormData) => {
    if (!patient || !user) return;

    try {
      const dateObj =
        data.recorded_date instanceof Date
          ? data.recorded_date
          : typeof data.recorded_date === "string"
          ? new Date(data.recorded_date)
          : new Date();

      const dateStr = dateObj.toLocaleDateString("en-CA");

      const payload = {
        patient_id: patient.patient_id,
        clinician_id: user.clinician_id,
        description: data.description,
        recorded_date: dateStr,
      };

      let res;
      if (editingPhenotype) {
        res = await fetch(
          `${API_BASE_URL}/phenotype/${editingPhenotype.phenotype_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              phenotype_id: editingPhenotype.phenotype_id,
            }),
          }
        );
      } else {
        res = await fetch(`${API_BASE_URL}/phenotype`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save phenotype");
      const result = await res.json();

      if (editingPhenotype) {
        const targetId = editingPhenotype.phenotype_id;
        setPhenotypes((prev) =>
          prev.map((p) =>
            p.phenotype_id === targetId
              ? { ...p, ...payload, phenotype_id: targetId }
              : p
          )
        );
      } else {
        const newPhenotype: Phenotype = {
          phenotype_id: result.phenotype_id || result.id,
          patient_id: patient.patient_id,
          clinician_id: user.clinician_id,
          description: data.description,
          recorded_date: dateStr,
        };
        setPhenotypes((prev) => [...prev, newPhenotype]);
      }
    } catch (error) {
      console.error("Error saving phenotype:", error);
      alert("Failed to save phenotype.");
      throw error;
    }
  };

  const handleSaveMutation = async (data: MutationFormData) => {
    if (!patient) return;

    try {
      // Prepare payload - convert empty strings to null or keep as is depending on backend
      const payload = {
        ...data,
        patient_id: patient.patient_id,
        // Ensure numbers are numbers, strings are strings
        chromosome_start: Number(data.chromosome_start) || 0,
        chromosome_end: Number(data.chromosome_end) || 0,
      };

      let res;
      if (editingMutation) {
        // UPDATE
        res = await fetch(
          `${API_BASE_URL}/mutation/${editingMutation.mutation_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              mutation_id: editingMutation.mutation_id,
            }),
          }
        );
      } else {
        // CREATE
        res = await fetch(`${API_BASE_URL}/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save mutation");
      const result = await res.json();

      if (editingMutation) {
        const targetId = editingMutation.mutation_id;
        setMutations((prev) =>
          prev.map((m) =>
            m.mutation_id === targetId
              ? ({ ...m, ...payload, mutation_id: targetId } as Mutation) // cast to Mutation because form data might be looser
              : m
          )
        );
      } else {
        const newMutation: Mutation = {
          ...payload,
          mutation_id: result.mutation_id || result.id,
          // Ensure types match Mutation interface
          icgc_specimen_id: payload.icgc_specimen_id,
          chromosome: payload.chromosome,
          mutation_type: payload.mutation_type,
        };
        setMutations((prev) => [...prev, newMutation]);
      }
    } catch (error) {
      console.error("Error saving mutation:", error);
      alert("Failed to save mutation.");
      throw error;
    }
  };

  const handleModalClose = () => {
    setIsAddDiagnosticOpen(false);
    setEditingDiagnostic(null);
    setIsAddPhenotypeOpen(false);
    setEditingPhenotype(null);
    setIsAddMutationOpen(false);
    setEditingMutation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text size="xl">Patient not found.</Text>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden">
        <DashboardNavBar />
        <main className="flex-1 flex flex-col px-30 py-25 overflow-y-auto pb-32">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Title order={1}>Patients Details</Title>
            <Button leftSection={<IconDownload size={16} />} variant="filled">
              Download Report
            </Button>
          </div>

          {/* Patient Information Section */}
          <section className="mb-10">
            <Title order={2} className="mb-4 text-2xl font-bold">
              Patient Information
            </Title>
            <Divider className="my-4" />
            <div className="bg-slate-50 p-6 rounded-xl border border-transparent shadow-md relative">
              <div className="space-y-2">
                <InfoRow
                  label="Patient ID"
                  value={String(patient.patient_id)}
                  isEditing={false}
                  onChange={() => {}}
                  readOnly
                />
                <InfoRow
                  label="First Name"
                  value={patient.first_name}
                  isEditing={isEditingInfo}
                  onChange={updatePatientField("first_name")}
                />
                <InfoRow
                  label="Last Name"
                  value={patient.last_name}
                  isEditing={isEditingInfo}
                  onChange={updatePatientField("last_name")}
                />
                <InfoRow
                  label="Date of Birth"
                  value={patient.dob}
                  isEditing={isEditingInfo}
                  onChange={updatePatientField("dob")}
                  type="date"
                />
                <InfoRow
                  label="Sex"
                  value={patient.sex}
                  isEditing={isEditingInfo}
                  onChange={updatePatientField("sex")}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {isEditingInfo ? (
                  <>
                    <Button onClick={handleCancelInfo} variant="default">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveInfo} color="green">
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditingInfo(true)}
                    color="primary"
                  >
                    Edit Information
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Diagnostics Table */}
          <section className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <Title order={2} className="text-2xl font-bold">
                Diagnostics
              </Title>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                size="xs"
                onClick={() => {
                  setEditingDiagnostic(null);
                  setIsAddDiagnosticOpen(true);
                }}
              >
                Add Diagnostic
              </Button>
            </div>
            <Divider className="mb-4" />
            <div className="bg-slate-50 p-4 rounded-xl border border-transparent shadow-sm">
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr className="bg-slate-100">
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      ID
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Date
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Type
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Treatment
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Details
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Actions
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {diagnostics.length > 0 ? (
                    diagnostics.map((item) => (
                      <Table.Tr key={item.diagnosis_id}>
                        <Table.Td className="text-slate-800">
                          {item.diagnosis_id}
                        </Table.Td>
                        <Table.Td className="text-slate-800">
                          {item.diagnosis_date
                            ? new Date(item.diagnosis_date).toLocaleDateString(
                                "en-AU"
                              )
                            : "N/A"}
                        </Table.Td>
                        <Table.Td className="text-slate-800 font-medium">
                          {formatString(item.diagnosis_type)}
                        </Table.Td>
                        <Table.Td className="text-slate-700">
                          {item.treatment || "-"}
                        </Table.Td>
                        <Table.Td className="text-slate-700">
                          {item.description}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEditRow("diagnostic", item)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                openDeleteModal("diagnostic", item.diagnosis_id)
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td
                        colSpan={6}
                        className="text-center text-gray-500"
                      >
                        No diagnostics recorded.
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </div>
          </section>

          {/* Phenotypes Table */}
          <section className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <Title order={2} className="text-2xl font-bold">
                Phenotypes
              </Title>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                size="xs"
                onClick={() => {
                  setEditingPhenotype(null);
                  setIsAddPhenotypeOpen(true);
                }}
              >
                Add Phenotype
              </Button>
            </div>
            <Divider className="mb-4" />
            <div className="bg-slate-50 p-4 rounded-xl border border-transparent shadow-sm">
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr className="bg-slate-100">
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      ID
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Date
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Description
                    </Table.Th>
                    <Table.Th className="text-slate-700 text-sm font-semibold">
                      Actions
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {phenotypes.length > 0 ? (
                    phenotypes.map((item) => (
                      <Table.Tr key={item.phenotype_id}>
                        <Table.Td className="text-slate-800">
                          {item.phenotype_id}
                        </Table.Td>
                        <Table.Td className="text-slate-800">
                          {item.recorded_date
                            ? new Date(item.recorded_date).toLocaleDateString(
                                "en-AU"
                              )
                            : "N/A"}
                        </Table.Td>
                        <Table.Td className="text-slate-700">
                          {item.description}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEditRow("phenotype", item)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                openDeleteModal("phenotype", item.phenotype_id)
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td
                        colSpan={4}
                        className="text-center text-gray-500"
                      >
                        No phenotypes recorded.
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </div>
          </section>

          {/* Mutations Table */}
          <section className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <Title order={2} className="text-2xl font-bold">
                Mutations
              </Title>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                size="xs"
                onClick={() => {
                  setEditingMutation(null);
                  setIsAddMutationOpen(true);
                }}
              >
                Add Mutation
              </Button>
            </div>
            <Divider className="mb-4" />
            <div className="bg-slate-50 p-4 rounded-xl border border-transparent shadow-sm">
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
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Chromosome
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Chr Start
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Chr End
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Mutation Type
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        From
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        To
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Consequence
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Gene
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Cancer Type
                      </Table.Th>
                      <Table.Th className="text-slate-700 text-sm font-semibold">
                        Actions
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mutations.length > 0 ? (
                      mutations.map((item) => (
                        <Table.Tr key={item.mutation_id}>
                          <Table.Td className="text-slate-800">
                            {item.icgc_specimen_id}
                          </Table.Td>
                          <Table.Td className="text-slate-800">
                            {item.mutation_id}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.chromosome}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.chromosome_start}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.chromosome_end}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {formatString(item.mutation_type)}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.mutated_from_allele}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.mutated_to_allele}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {formatString(item.consequence_type)}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {item.gene_affected}
                          </Table.Td>
                          <Table.Td className="text-slate-700">
                            {formatString(item.cancer_type)}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => handleEditRow("mutation", item)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() =>
                                  openDeleteModal("mutation", item.mutation_id)
                                }
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td
                          colSpan={12}
                          className="text-center text-gray-500"
                        >
                          No mutations recorded.
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </div>
            </div>
          </section>
        </main>

        <AddDiagnosticModal
          opened={isAddDiagnosticOpen}
          onClose={handleModalClose}
          onApply={handleSaveDiagnostic}
          initialData={
            editingDiagnostic
              ? {
                  diagnosis_type: editingDiagnostic.diagnosis_type,
                  description: editingDiagnostic.description,
                  treatment: editingDiagnostic.treatment,
                  diagnosis_date: editingDiagnostic.diagnosis_date
                    ? new Date(editingDiagnostic.diagnosis_date)
                    : null,
                }
              : null
          }
        />

        <AddPhenotypeModal
          opened={isAddPhenotypeOpen}
          onClose={handleModalClose}
          onApply={handleSavePhenotype}
          initialData={
            editingPhenotype
              ? {
                  description: editingPhenotype.description,
                  recorded_date: editingPhenotype.recorded_date
                    ? new Date(editingPhenotype.recorded_date)
                    : null,
                }
              : null
          }
        />

        <AddMutationModal
          opened={isAddMutationOpen}
          onClose={handleModalClose}
          onApply={handleSaveMutation}
          initialData={
            editingMutation
              ? {
                  icgc_specimen_id: editingMutation.icgc_specimen_id || "",
                  chromosome: editingMutation.chromosome || "",
                  chromosome_start: editingMutation.chromosome_start || "",
                  chromosome_end: editingMutation.chromosome_end || "",
                  mutation_type: editingMutation.mutation_type || "",
                  mutated_from_allele:
                    editingMutation.mutated_from_allele || "",
                  mutated_to_allele: editingMutation.mutated_to_allele || "",
                  consequence_type: editingMutation.consequence_type || "",
                  gene_affected: editingMutation.gene_affected || "",
                  cancer_type: editingMutation.cancer_type || "",
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

        {/* Floating Back Button */}
        <Affix position={{ bottom: 40, right: 40 }}>
          <Transition transition="slide-up" mounted={true}>
            {(transitionStyles) => (
              <Button
                leftSection={<IconArrowLeft size={20} />}
                size="md"
                radius="xl"
                className="shadow-md"
                style={transitionStyles}
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            )}
          </Transition>
        </Affix>
      </div>
    </ProtectedRoute>
  );
}
