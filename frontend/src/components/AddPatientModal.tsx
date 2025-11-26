"use client";

import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { useEffect, useState } from "react";

export interface PatientFormData {
  first_name: string;
  last_name: string;
  dob: Date | null;
  sex: string;
  phone: string;
  address: string;
  icgc_specimen_id: string;
}

interface AddPatientModalProps {
  opened: boolean;
  onClose: () => void;
  onApply: (data: PatientFormData) => Promise<void>;
  initialData?: PatientFormData | null;
}

const defaultData: PatientFormData = {
  first_name: "",
  last_name: "",
  dob: null,
  sex: "",
  phone: "",
  address: "",
  icgc_specimen_id: "",
};

const sexOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

export function AddPatientModal({
  opened,
  onClose,
  onApply,
  initialData,
}: AddPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormData>(defaultData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened) {
      setFormData(initialData || defaultData);
    }
  }, [opened, initialData]);

  const allRequiredPresent =
    !!formData.first_name.trim() &&
    !!formData.last_name.trim() &&
    !!formData.dob &&
    !!formData.sex &&
    !!formData.phone.trim();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await onApply(formData);
      setFormData(defaultData);
      onClose();
    } catch (error) {
      console.error("Failed to create patient", error);
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
          {initialData ? "Edit Patient" : "Add New Patient"}
        </Text>
      }
      size="lg"
      padding="xl"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Group grow>
          <TextInput
            label="First Name"
            placeholder="e.g., Olivia"
            value={formData.first_name}
            onChange={(event) =>
              setFormData({ ...formData, first_name: event.target.value })
            }
            required
            radius="md"
          />
          <TextInput
            label="Last Name"
            placeholder="e.g., Taylor"
            value={formData.last_name}
            onChange={(event) =>
              setFormData({ ...formData, last_name: event.target.value })
            }
            required
            radius="md"
          />
        </Group>

        <Group grow>
          <DateInput
            label="Date of Birth"
            placeholder="Select date"
            value={formData.dob}
            onChange={(value: unknown) => {
              const nextValue =
                value instanceof Date
                  ? value
                  : typeof value === "string" && value
                  ? new Date(value)
                  : null;
              setFormData({ ...formData, dob: nextValue });
            }}
            valueFormat="DD/MM/YYYY"
            maxDate={new Date()}
            clearable
            required
            radius="md"
          />
          <Select
            label="Sex"
            placeholder="Select sex"
            data={sexOptions}
            value={formData.sex}
            onChange={(value) => setFormData({ ...formData, sex: value || "" })}
            required
            radius="md"
          />
        </Group>

        <TextInput
          label="Phone"
          placeholder="Digits only, e.g., 0412345678"
          value={formData.phone}
          onChange={(event) =>
            setFormData({
              ...formData,
              phone: event.target.value.replace(/\D/g, ""),
            })
          }
          required
          radius="md"
          type="tel"
          inputMode="numeric"
        />

        <Textarea
          label="Address"
          placeholder="Enter patient address"
          value={formData.address}
          onChange={(event) =>
            setFormData({ ...formData, address: event.target.value })
          }
          minRows={2}
          radius="md"
        />

        <TextInput
          label="ICGC Specimen ID"
          placeholder="Optional identifier"
          value={formData.icgc_specimen_id}
          onChange={(event) =>
            setFormData({
              ...formData,
              icgc_specimen_id: event.target.value,
            })
          }
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
            disabled={!allRequiredPresent}
          >
            {initialData ? "Save Changes" : "Create Patient"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
