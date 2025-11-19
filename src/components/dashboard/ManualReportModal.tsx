import { Button, Group, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useCallback, useState } from "react";
import { z } from "zod";

const manualReportSchema = z.object({
  phoneNumber: z.string().min(10, "Enter a valid PH number"),
  message: z.string().min(10, "Share more details"),
  attachmentsUri: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

type ManualReportModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createReport: (data: { phoneNumber: string; message: string; attachmentsUri?: string }) => Promise<void>;
};

export function ManualReportModal({ opened, onClose, onSuccess, createReport }: ManualReportModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      phoneNumber: "",
      message: "",
      attachmentsUri: ""
    },
    validate: zodResolver(manualReportSchema)
  });

  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      setSubmitting(true);
      try {
        await createReport({
          phoneNumber: values.phoneNumber,
          message: values.message,
          attachmentsUri: values.attachmentsUri || undefined
        });
        notifications.show({
          title: "Report saved",
          message: "Manual report has been logged successfully.",
          color: "teal"
        });
        form.reset();
        onClose();
        onSuccess();
      } catch (error) {
        console.error(error);
        notifications.show({
          title: "Failed to save",
          message: "Please try again",
          color: "red"
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createReport, form, onClose, onSuccess]
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manual Report Entry"
      size="lg"
    >
      <Text size="sm" c="dimmed" mb="md">
        Create a report directly without receiving an SMS. Useful for walk-in reports or phone calls.
      </Text>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Phone number"
            placeholder="09171234567"
            withAsterisk
            {...form.getInputProps("phoneNumber")}
          />
          <Textarea
            label="Message"
            placeholder="Broken streetlight near Barangay Hall"
            minRows={4}
            withAsterisk
            {...form.getInputProps("message")}
          />
          <TextInput
            label="Attachment link (optional)"
            placeholder="https://drive.google.com/..."
            {...form.getInputProps("attachmentsUri")}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              Save Report
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
