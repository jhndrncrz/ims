"use client";

import { Badge, Button, Card, Group, Paper, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMessage, IconSend } from "@tabler/icons-react";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  phoneNumber: z.string().min(10, "Enter valid phone number"),
  message: z.string().min(5, "Message too short")
});

export default function SmsSimulatorPage() {
  const [response, setResponse] = useState<{
    type: string;
    reply: string;
    confidence: number;
  } | null>(null);
  const [sending, setSending] = useState(false);

  const form = useForm({
    initialValues: {
      phoneNumber: "09171234567",
      message: ""
    },
    validate: zodResolver(schema)
  });

  const handleSubmit = async (values: typeof form.values) => {
    setSending(true);
    setResponse(null);
    try {
      const res = await fetch("/api/sms-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: values.phoneNumber,
          message: values.message,
          skipSmsReply: true
        })
      });

      if (!res.ok) throw new Error("Failed to send");

      const data = (await res.json()) as { result: { type: string; reply: string; confidence: number } };
      setResponse(data.result);
      notifications.show({
        title: "SMS Sent",
        message: "Check the response below",
        color: "teal"
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to send SMS",
        color: "red"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>SMS Simulator</Title>
        <Text c="dimmed" size="sm">
          Test the SMS chatbot interface and see AI responses in real-time
        </Text>
      </div>

      <Card withBorder shadow="sm" maw={600}>
        <Card.Section inheritPadding py="sm" withBorder>
          <Group gap="xs">
            <IconMessage size={20} />
            <Text fw={600}>Send Test SMS</Text>
          </Group>
        </Card.Section>
        <Card.Section inheritPadding py="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput label="Phone Number" placeholder="09171234567" withAsterisk {...form.getInputProps("phoneNumber")} />
              <Textarea
                label="Message"
                placeholder="What is the curfew for minors?"
                minRows={4}
                withAsterisk
                {...form.getInputProps("message")}
              />
              <Group justify="flex-end">
                <Button type="submit" leftSection={<IconSend size={16} />} loading={sending}>
                  Send SMS
                </Button>
              </Group>
            </Stack>
          </form>
        </Card.Section>
      </Card>

      {response && (
        <Paper withBorder p="md" maw={600}>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>AI Response</Text>
              <Group gap="xs">
                <Badge>{response.type.toUpperCase()}</Badge>
                <Badge>
                  {(response.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </Group>
            </Group>
            <Paper withBorder p="sm">
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {response.reply}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
