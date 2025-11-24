"use client";

import { Modal, Button, Group, Text, Stack } from "@mantine/core";
import { useState } from "react";

interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
}

export function ConfirmationModal({
  opened,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  confirmColor = "red",
}: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          {title}
        </Text>
      }
      centered
      radius="md"
      padding="lg"
    >
      <Stack gap="lg">
        <Text size="md" c="dimmed">
          {message}
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={onClose}
            radius="md"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color={confirmColor}
            onClick={handleConfirm}
            radius="md"
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
