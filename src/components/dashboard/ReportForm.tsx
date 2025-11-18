"use client";

import { Button, Card, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useCallback, useState } from "react";
import { z } from "zod";

import { useReportStore } from "@/store/reportStore";

const schema = z.object({
  phoneNumber: z.string().min(10, "Enter a valid PH number"),
  message: z.string().min(10, "Share more details"),
  attachmentsUri: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

export const ReportForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const createReport = useReportStore((state) => state.createReport);

  const form = useForm({
    initialValues: {
      phoneNumber: "",
      message: "",
      attachmentsUri: ""
    },
    validate: zodResolver(schema)
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
          message: "The barangay team will see it in the list below.",
          color: "teal"
        });
        form.reset();
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
    [createReport, form]
  );

  return (
    <Card withBorder padding="lg">
      <Card.Section inheritPadding py="sm">
        <Group justify="space-between">
          <div>
            <strong>Log a mock SMS</strong>
            <p style={{ margin: 0, fontSize: 14 }}>
              Use this form during demos to seed insights without sending an actual SMS.
            </p>
          </div>
        </Group>
      </Card.Section>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack mt="lg">
          <TextInput label="Phone number" placeholder="09171234567" withAsterisk {...form.getInputProps("phoneNumber")} />
          <Textarea label="Message" placeholder="Broken streetlight near Barangay Hall" minRows={3} withAsterisk {...form.getInputProps("message")} />
          <TextInput label="Attachment link (optional)" placeholder="https://drive.google.com/..." {...form.getInputProps("attachmentsUri")} />
          <Group justify="flex-end">
            <Button type="submit" loading={submitting} disabled={submitting}>
              Save report
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
};
