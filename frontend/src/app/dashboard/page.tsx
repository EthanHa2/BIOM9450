"use client";

import { Button, Badge, Loader } from "@mantine/core";
import { useEffect, useState } from "react";

import { DashboardNavBar } from "@/components/DashboardNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  sex: string;
  dob: string;
  diagnosis?: string;
  treatment?: string;
  phenotypes?: string[];
}

interface Diagnostic {
  diagnosis_type: string;
  treatment: string;
  description: string;
}

interface Phenotype {
  description: string;
}

function PatientCard({ patient }: { patient: Patient }) {
  const fullName = `${patient.first_name} ${patient.last_name}`;
  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-transparent shadow-md hover:border-gray-200 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{fullName}</h3>
          <span className="text-md text-gray-500">
            ID: {patient.patient_id}
          </span>
        </div>
        <Button variant="filled" radius="xl" size="sm">
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
            Age:
          </span>
          <span>{age}</span>
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

            // get diagnosis (taking the first one for now)
            const primaryDiag = diagnostics[0];

            // map phenotype descriptions to a string array
            // split by semicolon if multiple are stored in one description
            const phenotypeList = phenotypes.flatMap((ph) =>
              ph.description.split(";").map((s) => s.trim())
            );

            return {
              ...p,
              diagnosis: primaryDiag ? primaryDiag.diagnosis_type : null,
              treatment: primaryDiag ? primaryDiag.treatment : null,
              phenotypes: phenotypeList,
            };
          })
        );

        setPatients(fullPatients);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        <DashboardNavBar />
        <main className="flex-1 flex flex-col px-30 py-25 overflow-y-auto">
          {/* Header Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold ">Patients Overview</h1>
          </div>

          {/* Controls Row */}
          <div className="flex justify-between items-center mb-8">
            <Button variant="filled" size="md" radius="md">
              Search & Filter
            </Button>

            <div className="flex gap-4">
              <Button variant="filled" size="md" radius="md">
                Upload Patients
              </Button>
              <Button variant="filled" size="md" radius="md">
                Download Report
              </Button>
            </div>
          </div>

          {/* Grid Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patients.map((patient) => (
                <PatientCard key={patient.patient_id} patient={patient} />
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
