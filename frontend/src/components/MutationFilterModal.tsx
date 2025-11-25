"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Divider,
  Grid,
} from "@mantine/core";
import { useState } from "react";
import { formatString } from "@/utils/stringUtils";

export interface MutationFilterValues {
  icgcSpecimenId: string;
  mutationId: string;
  geneAffected: string;
  cancerType: string | null;
  chromosome: string | null;
  chromosomeStart: string;
  chromosomeEnd: string;
  mutationType: string | null;
  mutatedFrom: string | null;
  mutatedTo: string | null;
  consequenceType: string;
}

interface MutationFilterModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (filters: MutationFilterValues) => void;
}

const initialFilters: MutationFilterValues = {
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
};

const CANCER_TYPES = [
  "blood",
  "brain",
  "breast",
  "prostate",
  "pancreas",
  "liver",
];

const CHROMOSOMES = [
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

const MUTATION_TYPES = [
  "single base substitution",
  "insertion of <=200bp",
  "deletion of <= 200bp",
];

const ALLELES = ["A", "T", "C", "G"];

export function MutationFilterModal({
  opened,
  onClose,
  onApply,
}: MutationFilterModalProps) {
  const [filters, setFilters] = useState<MutationFilterValues>(initialFilters);

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
          Search and Filter Mutations
        </Text>
      }
      size="lg"
      padding="xl"
      radius="md"
      centered
    >
      <Stack gap="md">
        {/* Identifiers */}
        <div>
          <Text fw={700} size="md" mb="xs">
            Identifiers & Genes
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="ICGC Specimen ID"
                placeholder="Search ID"
                value={filters.icgcSpecimenId}
                onChange={(e) =>
                  setFilters({ ...filters, icgcSpecimenId: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Mutation ID"
                placeholder="Search Mutation ID"
                value={filters.mutationId}
                onChange={(e) =>
                  setFilters({ ...filters, mutationId: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Gene Affected"
                placeholder="Search Gene"
                value={filters.geneAffected}
                onChange={(e) =>
                  setFilters({ ...filters, geneAffected: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Mutation Details */}
        <div>
          <Text fw={700} size="md" mb="xs">
            Mutation Details
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Cancer Type"
                placeholder="Select Cancer Type"
                data={CANCER_TYPES.map((t) => ({
                  value: t,
                  label: formatString(t),
                }))}
                value={filters.cancerType}
                onChange={(val) => setFilters({ ...filters, cancerType: val })}
                radius="md"
                searchable
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Chromosome"
                placeholder="Select Chromosome"
                data={CHROMOSOMES}
                value={filters.chromosome}
                onChange={(val) => setFilters({ ...filters, chromosome: val })}
                radius="md"
                searchable
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Chromosome Start"
                placeholder="Start Position"
                value={filters.chromosomeStart}
                onChange={(e) =>
                  setFilters({ ...filters, chromosomeStart: e.target.value })
                }
                radius="md"
                type="number"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Chromosome End"
                placeholder="End Position"
                value={filters.chromosomeEnd}
                onChange={(e) =>
                  setFilters({ ...filters, chromosomeEnd: e.target.value })
                }
                radius="md"
                type="number"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Mutation Type"
                placeholder="Select Mutation Type"
                data={MUTATION_TYPES}
                value={filters.mutationType}
                onChange={(val) =>
                  setFilters({ ...filters, mutationType: val })
                }
                radius="md"
                searchable
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Mutated From"
                placeholder="Select Allele"
                data={ALLELES}
                value={filters.mutatedFrom}
                onChange={(val) => setFilters({ ...filters, mutatedFrom: val })}
                radius="md"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Mutated To"
                placeholder="Select Allele"
                data={ALLELES}
                value={filters.mutatedTo}
                onChange={(val) => setFilters({ ...filters, mutatedTo: val })}
                radius="md"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Consequence Type"
                placeholder="Search Consequence"
                value={filters.consequenceType}
                onChange={(e) =>
                  setFilters({ ...filters, consequenceType: e.target.value })
                }
                radius="md"
              />
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Footer */}
        <Group justify="space-between" mt="md">
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
      </Stack>
    </Modal>
  );
}
