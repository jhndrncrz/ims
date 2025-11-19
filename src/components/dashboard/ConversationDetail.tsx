import { Badge, Card, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";

import { formatDateTime } from "@/lib/formatters";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type ConversationDetailProps = {
  phoneNumber: string;
  messageCount: number;
  messages: Message[];
  parseIdentifier: (phoneNumber: string) => { channel: string; display: string; color: string };
};

export function ConversationDetail({ phoneNumber, messageCount, messages, parseIdentifier }: ConversationDetailProps) {
  const { channel, display, color } = parseIdentifier(phoneNumber);

  return (
    <Card withBorder shadow="sm" style={{ flex: 1 }}>
      <Card.Section inheritPadding py="sm" withBorder>
        <Group justify="space-between">
          <div>
            <Group gap="xs" mb={4}>
              <Badge size="sm" color={color}>
                {channel}
              </Badge>
            </Group>
            <Text fw={600}>{display}</Text>
            <Text size="xs" c="dimmed">
              {messageCount} messages
            </Text>
          </div>
        </Group>
      </Card.Section>
      <ScrollArea h={600} p="md">
        <Stack gap="md">
          {messages.map((message) => (
            <Paper
              key={message.id}
              p="md"
              withBorder
              style={{
                backgroundColor: message.direction === "INBOUND" 
                  ? "var(--mantine-color-blue-0)" 
                  : "var(--mantine-color-gray-0)",
                marginLeft: message.direction === "OUTBOUND" ? "auto" : undefined,
                marginRight: message.direction === "INBOUND" ? "auto" : undefined,
                maxWidth: "80%"
              }}
            >
              <Group justify="space-between" mb="xs">
                <Badge 
                  size="xs" 
                  color={message.direction === "INBOUND" ? "blue" : "green"}
                >
                  {message.direction}
                </Badge>
                <Text size="xs" c="dimmed">
                  {formatDateTime(message.createdAt)}
                </Text>
              </Group>
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {message.body}
              </Text>
              {message.metadata && "confidence" in message.metadata && (
                <Text size="xs" c="dimmed" mt="xs">
                  Confidence: {((message.metadata.confidence as number) * 100).toFixed(0)}%
                </Text>
              )}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
