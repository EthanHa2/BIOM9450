"use client";

import { Modal, Textarea, Button, Group, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useState, useEffect } from "react";
import "@mantine/dates/styles.css";

export interface PhenotypeFormData {
  description: string;
  recorded_date: Date | null;
}

interface AddPhenotypeModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (data: PhenotypeFormData) => Promise<void>;
  initialData?: PhenotypeFormData | null;
}

const defaultData: PhenotypeFormData = {
  description: "",
  recorded_date: new Date(),
};

export function AddPhenotypeModal({
  opened,
  onClose,
  onApply,
  initialData,
}: AddPhenotypeModalProps) {
  const [formData, setFormData] = useState<PhenotypeFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // clear or prefill the form each time the modal opens
    if (opened) {
      setFormData(initialData || defaultData);
    }
  }, [opened, initialData]);

  const handleSubmit = async () => {
    // parent handles notifications, we only manage spinners
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
          {initialData ? "Edit Phenotype" : "Add New Phenotype"}
        </Text>
      }
      size="md"
      padding="xl"
      radius="md"
      centered
    >
      <Stack gap="md">
        <DateInput
          label="Recorded Date"
          placeholder="Select date"
          value={formData.recorded_date}
          onChange={(val: unknown) =>
            setFormData({ ...formData, recorded_date: val as Date | null })
          }
          valueFormat="DD/MM/YYYY"
          maxDate={new Date()}
          clearable
          radius="md"
          required
        />

        <Textarea
          label="Description"
          placeholder="Detailed description of the phenotype"
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
            disabled={!formData.description || !formData.recorded_date}
          >
            {initialData ? "Save Changes" : "Add Phenotype"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
