"use client";

import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import "@mantine/dates/styles.css";

export interface DiagnosticFormData {
  diagnosis_type: string;
  description: string;
  treatment: string;
  diagnosis_date: Date | null;
}

interface AddDiagnosticModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (data: DiagnosticFormData) => Promise<void>;
  initialData?: DiagnosticFormData | null;
}

const defaultData: DiagnosticFormData = {
  diagnosis_type: "",
  description: "",
  treatment: "",
  diagnosis_date: new Date(),
};

export function AddDiagnosticModal({
  opened,
  onClose,
  onApply,
  initialData,
}: AddDiagnosticModalProps) {
  const [formData, setFormData] = useState<DiagnosticFormData>(defaultData);
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
      setFormData(defaultData); // Reset form after success
      onClose();
    } catch (error) {
      console.error("Submission failed", error);
      // Keep modal open
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl">
          {initialData ? "Edit Diagnostic" : "Add New Diagnostic"}
        </Text>
      }
      size="md"
      padding="xl"
      radius="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Diagnosis Type"
          placeholder="e.g., Genetic Disorder"
          value={formData.diagnosis_type}
          onChange={(e) =>
            setFormData({ ...formData, diagnosis_type: e.target.value })
          }
          required
          radius="md"
        />

        <DateInput
          label="Diagnosis Date"
          placeholder="Select date"
          value={formData.diagnosis_date}
          onChange={(val: unknown) =>
            setFormData({ ...formData, diagnosis_date: val as Date | null })
          }
          valueFormat="DD/MM/YYYY"
          maxDate={new Date()}
          clearable
          radius="md"
          required
        />

        <TextInput
          label="Treatment"
          placeholder="e.g., Medication, Therapy"
          value={formData.treatment}
          onChange={(e) =>
            setFormData({ ...formData, treatment: e.target.value })
          }
          radius="md"
        />

        <Textarea
          label="Description"
          placeholder="Detailed description of the diagnosis"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          minRows={3}
          required
          radius="md"
        />

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
            disabled={
              !formData.diagnosis_type ||
              !formData.description ||
              !formData.diagnosis_date
            }
          >
            {initialData ? "Save Changes" : "Add Diagnostic"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
