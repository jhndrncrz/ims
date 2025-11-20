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

// Function to clean markdown formatting
const cleanMarkdown = (text: string): string => {
  return text
    // Remove bold markers
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Remove italic markers
    .replace(/\*(.+?)\*/g, '$1')
    // Remove headers (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove list markers (-, *, 1.)
    .replace(/^[\-\*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, (match) => match)
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export default function SmsSimulatorPage() {
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
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
    setResponseTime(null);
    
    const startTime = Date.now();
    
    try {
      // Direct POST to n8n webhook from browser
      const res = await fetch(
        // "https://n8n.humain.ph/webhook-test/c8b87bcf-e39d-4d83-9b5e-bb989c70233b",
        "https://n8n.humain.ph/webhook/c8b87bcf-e39d-4d83-9b5e-bb989c70233b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: values.message,
            phoneNumber: values.phoneNumber
          })
        }
      );

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setResponseTime(elapsed);
      
      notifications.show({
        title: "Message Sent to n8n",
        message: `Response received in ${elapsed}ms`,
        color: "teal"
      });
    } catch (error) {
      console.error(error);
      const elapsed = Date.now() - startTime;
      
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to send message",
        color: "red",
        autoClose: 8000
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
              <Text fw={600}>BarangAI Response</Text>
              <Group gap="xs">
                <Badge color="green">Success</Badge>
                {responseTime && (
                  <Badge color="blue" variant="light">
                    {responseTime}ms
                  </Badge>
                )}
              </Group>
            </Group>
            
            {/* Display the output message in a user-friendly way */}
            {response.output ? (
              <Paper withBorder p="md" bg="blue.0">
                <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {cleanMarkdown(response.output)}
                </Text>
              </Paper>
            ) : (
              <Paper withBorder p="sm" bg="gray.0">
                <Text size="xs" c="dimmed" fw={500} mb="xs">Raw Response:</Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }} ff="monospace">
                  {JSON.stringify(response, null, 2)}
                </Text>
              </Paper>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}