"use client";

import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

import { ConversationList } from "@/components/dashboard/ConversationList";
import { ConversationDetail } from "@/components/dashboard/ConversationDetail";
import { logger } from "@/lib/logger";

type EnhancedFields = {
  extractedLocation?: string | null;
  extractedTime?: string | null;
  incidentType?: string | null;
  severity?: string | null;
  actionNeeded?: string | null;
  summaryGenerated?: string | null;
  sentiment?: string | null;
  sentimentScore?: number | null;
  sentimentKeywords?: string[] | null;
};

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  enhancedFields?: EnhancedFields | null;
};

type ConversationSentiment = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number;
  keywords: string[];
  summary?: string | null;
  lastAnalyzedAt?: string;
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
  conversationSentiment?: ConversationSentiment | null;
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
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      const fetchedConversations = data.conversations || [];
      setConversations(fetchedConversations);
      
      // Update selected conversation with fresh data if it exists
      if (selectedPhoneNumber) {
        const updatedConv = fetchedConversations.find(
          (c: Conversation) => c.phoneNumber === selectedPhoneNumber
        );
        if (updatedConv) {
          setSelectedConv(updatedConv);
        }
      } else if (fetchedConversations.length > 0) {
        setSelectedConv(fetchedConversations[0]);
        setSelectedPhoneNumber(fetchedConversations[0].phoneNumber);
      }
    } catch (error) {
      logger.error("Failed to fetch conversations", { error });
      setConversations([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [selectedPhoneNumber]);

  const handleConversationSelect = (conv: unknown) => {
    const newConv = conv as Conversation;
    setSelectedPhoneNumber(newConv.phoneNumber);
    setSelectedConv(newConv);
  };

  useEffect(() => {
    void fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Conversations</Title>
        <Text c="dimmed" size="sm">
          View all SMS inquiries and their AI responses
        </Text>
      </div>

      {initialLoad && loading ? (
        <Card withBorder p="xl">
          <Text c="dimmed">Loading conversations...</Text>
        </Card>
      ) : conversations.length === 0 ? (
        <Card withBorder p="xl">
          <Text c="dimmed">No conversations yet. Send a test SMS to get started.</Text>
        </Card>
      ) : (
        <Group align="stretch" gap="md" wrap="nowrap">
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
              conversationSentiment={selectedConv.conversationSentiment}
              parseIdentifier={parseIdentifier}
              onRefresh={() => fetchConversations(true)}
            />
          )}
        </Group>
      )}
    </Stack>
  );
}
