"use client";

import {
  Modal,
  TextInput,
  Select,
  MultiSelect,
  Button,
  Group,
  Stack,
  Text,
  Divider,
  Grid,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import "@mantine/dates/styles.css";
import { formatString } from "@/utils/stringUtils";

export interface FilterValues {
  patientId: string;
  firstName: string;
  lastName: string;
  dobFrom: Date | null;
  dobTo: Date | null;
  sex: string | null;
  diagnostics: string[];
  treatment: string | null;
  phenotypes: string[];
}

interface SearchFilterModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
}

const initialFilters: FilterValues = {
  patientId: "",
  firstName: "",
  lastName: "",
  dobFrom: null,
  dobTo: null,
  sex: null,
  diagnostics: [],
  treatment: null,
  phenotypes: [],
};

interface DiagnosticRecord {
  diagnosis_type: string;
  treatment: string;
}

interface PhenotypeRecord {
  description: string;
}

export function SearchFilterModal({
  opened,
  onClose,
  onApply,
}: SearchFilterModalProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [diagnosticOptions, setDiagnosticOptions] = useState<string[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<string[]>([]);
  const [phenotypeOptions, setPhenotypeOptions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        // Fetch Diagnostics & Treatments
        const diagRes = await fetch("/api/diagnostic");
        const diagData = await diagRes.json();
        const diags = diagData.diagnostics || [];

        const uniqueDiags = Array.from(
          new Set(
            diags.map((d: DiagnosticRecord) => d.diagnosis_type).filter(Boolean)
          )
        ) as string[];
        const uniqueTreatments = Array.from(
          new Set(
            diags.map((d: DiagnosticRecord) => d.treatment).filter(Boolean)
          )
        ) as string[];

        setDiagnosticOptions(uniqueDiags);
        setTreatmentOptions(uniqueTreatments);

        // Fetch Phenotypes
        const phenoRes = await fetch("/api/phenotype");
        const phenoData = await phenoRes.json();
        const phenos = phenoData.phenotypes || [];
        const allPhenoDescs = phenos.flatMap((p: PhenotypeRecord) =>
          p.description.split(";").map((s: string) => s.trim())
        );
        const uniquePhenos = Array.from(
          new Set(allPhenoDescs.filter(Boolean))
        ) as string[];
        setPhenotypeOptions(uniquePhenos);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    }

    if (opened) {
      fetchOptions();
    }
  }, [opened]);

  const handleClear = () => {
    setFilters(initialFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl">
          Search and Filter Patients
        </Text>
      }
      size="lg"
      padding="xl"
      radius="md"
      centered
    >
      <Stack gap="md">
        {/* Patient Information */}
        <div>
          <Text fw={700} size="md" mb="xs">
            Patient Information
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Patient ID"
                placeholder="Search ID"
                value={filters.patientId}
                onChange={(e) =>
                  setFilters({ ...filters, patientId: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Sex"
                placeholder="Select Sex"
                data={["Male", "Female", "Other"]}
                value={filters.sex}
                onChange={(val) => setFilters({ ...filters, sex: val })}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="First Name"
                placeholder="Search First Name"
                value={filters.firstName}
                onChange={(e) =>
                  setFilters({ ...filters, firstName: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Last Name"
                placeholder="Search Last Name"
                value={filters.lastName}
                onChange={(e) =>
                  setFilters({ ...filters, lastName: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Text size="sm" fw={500} mb={3}>
                Date of Birth
              </Text>
              <Group grow>
                <DateInput
                  valueFormat="DD/MM/YYYY"
                  value={filters.dobFrom}
                  onChange={(val) =>
                    setFilters({
                      ...filters,
                      dobFrom: val ? new Date(val) : null,
                    })
                  }
                  placeholder="From"
                  radius="md"
                  clearable
                  maxDate={new Date()}
                />
                <DateInput
                  valueFormat="DD/MM/YYYY"
                  value={filters.dobTo}
                  onChange={(val) =>
                    setFilters({
                      ...filters,
                      dobTo: val ? new Date(val) : null,
                    })
                  }
                  placeholder="To"
                  radius="md"
                  clearable
                  maxDate={new Date()}
                />
              </Group>
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Clinical Filters */}
        <div>
          <Text fw={700} size="md" mb="xs">
            Clinical Filters
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <MultiSelect
                label="Diagnostics"
                placeholder="Select Diagnostic(s)"
                data={diagnosticOptions.map((opt) => ({
                  value: opt,
                  label: formatString(opt),
                }))}
                value={filters.diagnostics}
                onChange={(val) => setFilters({ ...filters, diagnostics: val })}
                searchable
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Treatment"
                placeholder="Select Treatment"
                data={treatmentOptions.map((opt) => ({
                  value: opt,
                  label: formatString(opt),
                }))}
                value={filters.treatment}
                onChange={(val) => setFilters({ ...filters, treatment: val })}
                searchable
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <MultiSelect
                label="Phenotypes"
                placeholder="Select Phenotype(s)"
                data={phenotypeOptions.map((opt) => ({
                  value: opt,
                  label: formatString(opt),
                }))}
                searchable
                value={filters.phenotypes}
                onChange={(val) => setFilters({ ...filters, phenotypes: val })}
                radius="md"
              />
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Footer */}
        <Group justify="space-between" mt="md">
          <div />
          <Group>
            <Button
              variant="default"
              onClick={handleClear}
              radius="md"
              size="md"
              styles={{
                root: {
                  backgroundColor: "#1f2937",
                  color: "white",
                  border: "none",
                  "&:hover": { backgroundColor: "#374151" },
                },
              }}
            >
              Clear All Filters
            </Button>
            <Button
              variant="filled"
              color="primary"
              onClick={handleApply}
              radius="md"
              size="md"
            >
              Apply Filters
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
