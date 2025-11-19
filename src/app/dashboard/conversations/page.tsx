"use client";

import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

import { ConversationList } from "@/components/dashboard/ConversationList";
import { ConversationDetail } from "@/components/dashboard/ConversationDetail";

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

// Helper to extract channel and display identifier from phoneNumber
function parseIdentifier(phoneNumber: string): { channel: string; display: string; color: string } {
  if (phoneNumber.startsWith("messenger:")) {
    return { channel: "Messenger", display: phoneNumber.replace("messenger:", "ID: "), color: "violet" };
  }
  if (phoneNumber.startsWith("email:")) {
    return { channel: "Email", display: phoneNumber.replace("email:", ""), color: "cyan" };
  }
  return { channel: "SMS", display: phoneNumber, color: "blue" };
}

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

  const handleConversationSelect = (conv: unknown) => {
    setSelectedConv(conv as Conversation);
  };

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
          <ConversationList
            conversations={conversations}
            selectedPhoneNumber={selectedConv?.phoneNumber || null}
            onSelect={handleConversationSelect}
            parseIdentifier={parseIdentifier}
          />

          {selectedConv && (
            <ConversationDetail
              phoneNumber={selectedConv.phoneNumber}
              messageCount={selectedConv.messageCount}
              messages={selectedConv.messages}
              parseIdentifier={parseIdentifier}
            />
          )}
        </Group>
      )}
    </Stack>
  );
}
