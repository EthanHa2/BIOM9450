"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Loader,
  Select,
  RangeSlider,
  Card,
  TextInput,
} from "@mantine/core";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { DashboardNavBar } from "@/components/DashboardNavBar";

type DiagnosisStat = {
  diagnosis_type: string;
  patient_count: number;
};

type PhenotypeStat = {
  phenotype: string;
  patient_count: number;
};

type MutationStat = {
  gene: string;
  patient_count: number;
};

// Adjust this if your PHP route is different
const API_BASE = "/api";

export default function VisualisationsPage() {
  const [loading, setLoading] = useState(false);

  const [diagnosisData, setDiagnosisData] = useState<DiagnosisStat[]>([]);
  const [phenotypeData, setPhenotypeData] = useState<PhenotypeStat[]>([]);
  const [mutationData, setMutationData] = useState<MutationStat[]>([]);

  // Shared filters
  const [sex, setSex] = useState<string | null>(null); // 'Male' | 'Female' | 'Other'
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 80]);

  // Mutation-specific filters
  const [mutationType, setMutationType] = useState<string>("");
  const [cancerType, setCancerType] = useState<string>("");

  // Limit how many bars we render for mutation chart (avoid massive overflow)
  const mutationChartData = mutationData.slice(0, 15); // top 15 genes

  const buildCommonParams = () => {
    const params = new URLSearchParams();
    if (sex) params.append("sex", sex);
    params.append("minAge", String(ageRange[0]));
    params.append("maxAge", String(ageRange[1]));
    return params;
  };

  const fetchAllStats = async () => {
    setLoading(true);

    try {
      const commonParams = buildCommonParams();

      // --- Diagnostic stats ---
      const diagUrl = `${API_BASE}/diagnostic/stats?${commonParams.toString()}`;
      const diagRes = await fetch(diagUrl);
      const diagJson = await diagRes.json();
      setDiagnosisData(
        Array.isArray(diagJson)
          ? diagJson.map((row: any) => ({
              diagnosis_type: row.diagnosis_type,
              patient_count: Number(row.patient_count),
            }))
          : []
      );

      // --- Phenotype stats ---
      const phenoUrl = `${API_BASE}/phenotype/stats?${commonParams.toString()}`;
      const phenoRes = await fetch(phenoUrl);
      const phenoJson = await phenoRes.json();
      setPhenotypeData(
        Array.isArray(phenoJson)
          ? phenoJson.map((row: any) => ({
              phenotype: row.phenotype,
              patient_count: Number(row.patient_count),
            }))
          : []
      );

      // --- Mutation stats ---
      const mutParams = buildCommonParams();
      if (mutationType.trim() !== "") {
        mutParams.append("mutation_type", mutationType.trim());
      }
      if (cancerType.trim() !== "") {
        mutParams.append("cancer_type", cancerType.trim());
      }

      const mutUrl = `${API_BASE}/mutation/stats?${mutParams.toString()}`;
      const mutRes = await fetch(mutUrl);
      const mutJson = await mutRes.json();
      setMutationData(
        Array.isArray(mutJson)
          ? mutJson.map((row: any) => ({
              gene: row.gene,
              patient_count: Number(row.patient_count),
            }))
          : []
      );
    } catch (err) {
      console.error("Failed to load visualisation stats", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto">
        {/* Header Title */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Visualisations</h1>
          <Button onClick={fetchAllStats} disabled={loading}>
            Apply Filters
          </Button>
        </div>

        {/* Filters (sticky header) */}
        <div className="sticky top-0 z-20 bg-white pb-4">
          <Card shadow="sm" padding="lg" className="mb-2">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sex filter */}
              <div>
                <p className="mb-2 font-medium">Sex</p>
                <Select
                  placeholder="All"
                  data={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                  value={sex}
                  onChange={setSex}
                  clearable
                />
              </div>

              {/* Age range */}
              <div className="lg:col-span-2">
                <p className="mb-2 font-medium">
                  Age range ({ageRange[0]} – {ageRange[1]} years)
                </p>
                <RangeSlider
                  min={0}
                  max={100}
                  value={ageRange}
                  onChange={(value) => setAgeRange(value as [number, number])}
                  marks={[
                    { value: 0, label: "0" },
                    { value: 20, label: "20" },
                    { value: 40, label: "40" },
                    { value: 60, label: "60" },
                    { value: 80, label: "80" },
                  ]}
                />
              </div>

              {/* Mutation filters */}
              <div className="space-y-3">
                <p className="mb-1 font-medium">Mutation filters</p>
                <TextInput
                  label="Mutation type"
                  placeholder="e.g. Missense, Nonsense"
                  value={mutationType}
                  onChange={(e) => setMutationType(e.currentTarget.value)}
                />
                <TextInput
                  label="Cancer type"
                  placeholder="e.g. Breast, Colorectal"
                  value={cancerType}
                  onChange={(e) => setCancerType(e.currentTarget.value)}
                />
              </div>
            </div>
          </Card>
        </div>


        {/* Charts */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* 1. Patients per Diagnostic Category */}
            <Card shadow="sm" padding="lg">
              <h2 className="text-xl font-semibold mb-4">
                Patients per Diagnostic Category
              </h2>
              {diagnosisData.length === 0 ? (
                <p className="text-sm text-gray-500">No data to display.</p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer>
                    <BarChart data={diagnosisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="diagnosis_type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patient_count" fill="#3b82f6"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* 2. Top Phenotypes */}
            <Card shadow="sm" padding="lg">
              <h2 className="text-xl font-semibold mb-4">
                Top Phenotypes Across Patients
              </h2>
              {phenotypeData.length === 0 ? (
                <p className="text-sm text-gray-500">No data to display.</p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer>
                    <BarChart
                      data={phenotypeData}
                      layout="vertical"
                      margin={{ left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="phenotype"
                        type="category"
                        width={200}
                      />
                      <Tooltip />
                      <Bar dataKey="patient_count" fill="#3b82f6"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* 3. Patients per Mutated Gene */}
            <Card shadow="sm" padding="lg" className="xl:col-span-2">
              <h2 className="text-xl font-semibold mb-4">
                Patients per Mutated Gene
              </h2>
              {mutationData.length === 0 ? (
                <p className="text-sm text-gray-500">No data to display.</p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer>
                    <BarChart data={mutationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gene" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patient_count" fill="#3b82f6"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
