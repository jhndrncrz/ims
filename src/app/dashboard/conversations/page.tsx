"use client";

import { Badge, Card, Group, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";

import { formatDateTime } from "@/lib/formatters";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type Conversation = {
  phoneNumber: string;
  messageCount: number;
  lastMessage: {
    body: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  };
  messages: Message[];
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data.conversations);
      if (data.conversations.length > 0 && !selectedConv) {
        setSelectedConv(data.conversations[0]);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedConv]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Conversations</Title>
        <Text c="dimmed" size="sm">
          View all SMS inquiries and their AI responses
        </Text>
      </div>

      {loading ? (
        <Card withBorder p="xl">
          <Text c="dimmed">Loading conversations...</Text>
        </Card>
      ) : conversations.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed">No conversations yet. Send a test SMS to get started.</Text>
        </Card>
      ) : (
        <Group align="flex-start" gap="md" wrap="nowrap">
          {/* Conversations List */}
          <Card withBorder shadow="sm" style={{ flex: "0 0 320px" }}>
            <Card.Section inheritPadding py="sm" withBorder>
              <Text fw={600}>All Conversations ({conversations.length})</Text>
            </Card.Section>
            <ScrollArea h={600}>
              <Stack gap="xs" p="xs">
                {conversations.map((conv) => (
                  <Paper
                    key={conv.phoneNumber}
                    p="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      backgroundColor: selectedConv?.phoneNumber === conv.phoneNumber ? "var(--mantine-color-gray-1)" : undefined
                    }}
                    onClick={() => setSelectedConv(conv)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} size="sm">
                          {conv.phoneNumber}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {conv.lastMessage.body}
                        </Text>
                      </div>
                      <div>
                        <Badge size="sm" color="blue">
                          {conv.messageCount}
                        </Badge>
                        <IconChevronRight size={16} />
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Card>

          {/* Conversation Detail */}
          {selectedConv && (
            <Card withBorder shadow="sm" style={{ flex: 1 }}>
              <Card.Section inheritPadding py="sm" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{selectedConv.phoneNumber}</Text>
                    <Text size="xs" c="dimmed">
                      {selectedConv.messageCount} messages
                    </Text>
                  </div>
                </Group>
              </Card.Section>
              <ScrollArea h={600} p="md">
                <Stack gap="md">
                  {selectedConv.messages.map((message) => (
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
          )}
        </Group>
      )}
    </Stack>
  );
}
