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
} from "@mantine/core";
import { useState, useEffect } from "react";

export interface MutationFormData {
  icgc_specimen_id: string;
  chromosome: string;
  chromosome_start: number | "";
  chromosome_end: number | "";
  mutation_type: string;
  mutated_from_allele: string;
  mutated_to_allele: string;
  consequence_type: string;
  gene_affected: string;
  cancer_type: string; // This was NOT in your $required list, so we keep it optional
}

interface AddMutationModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (data: MutationFormData) => Promise<void>;
  initialData?: MutationFormData | null;
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
}: AddMutationModalProps) {
  const [formData, setFormData] = useState<MutationFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) {
      setFormData(initialData || defaultData);
    }
  }, [opened, initialData]);

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
      size="lg"
      padding="xl"
      radius="md"
      centered
    >
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
        <Group grow>
          <TextInput
            label="Consequence Type"
            placeholder="e.g., Missense Variant"
            value={formData.consequence_type}
            onChange={(e) => handleChange("consequence_type", e.target.value)}
            required
            radius="md"
          />
          <TextInput
            label="Cancer Type"
            placeholder="e.g., BRCA-US"
            value={formData.cancer_type}
            onChange={(e) => handleChange("cancer_type", e.target.value)}
            radius="md"
            // Keep Optional as it wasn't in your $required array
          />
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
            disabled={!isValid} // Button is disabled until all required fields are filled
          >
            {initialData ? "Save Changes" : "Add Mutation"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
