import { Accordion, ActionIcon, Badge, Button, Card, Collapse, Group, Paper, ScrollArea, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconChevronUp, IconBrain } from "@tabler/icons-react";
import { useState } from "react";

import { formatDateTime } from "@/lib/formatters";
import { sentimentColors } from "@/constants/conversationConstants";

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

type ConversationDetailProps = {
  phoneNumber: string;
  messageCount: number;
  messages: Message[];
  conversationSentiment?: ConversationSentiment | null;
  parseIdentifier: (phoneNumber: string) => { channel: string; display: string; color: string };
  onRefresh?: () => void;
};

function MessageWithEnhancedFields({ message }: { message: Message }) {
  const [opened, { toggle }] = useDisclosure(false);
  const hasEnhancedFields = Boolean(message.enhancedFields) && (
    Boolean(message.enhancedFields?.extractedLocation) ||
    Boolean(message.enhancedFields?.extractedTime) ||
    Boolean(message.enhancedFields?.incidentType) ||
    Boolean(message.enhancedFields?.sentiment) ||
    Boolean(message.enhancedFields?.summaryGenerated)
  );

  return (
    <Paper
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
        <Group gap="xs">
          <Badge 
            size="xs" 
            color={message.direction === "INBOUND" ? "blue" : "green"}
          >
            {message.direction}
          </Badge>
          {hasEnhancedFields && (
            <Tooltip label="AI-extracted information available">
              <ActionIcon 
                size="xs" 
                variant="subtle" 
                color="violet"
                onClick={toggle}
              >
                {opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
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

      {hasEnhancedFields && (
        <Collapse in={opened} mt="sm">
          <Stack gap="xs" p="sm" style={{ background: "var(--mantine-color-gray-1)", borderRadius: 4 }}>
            <Text size="xs" fw={600} c="violet">AI-Extracted Information</Text>
            
            {message.enhancedFields?.summaryGenerated && (
              <div>
                <Text size="xs" c="dimmed">Summary</Text>
                <Text size="xs">{message.enhancedFields.summaryGenerated}</Text>
              </div>
            )}
            
            <Group grow>
              {message.enhancedFields?.extractedLocation && (
                <div>
                  <Text size="xs" c="dimmed">Location</Text>
                  <Text size="xs">{message.enhancedFields.extractedLocation}</Text>
                </div>
              )}
              
              {message.enhancedFields?.extractedTime && (
                <div>
                  <Text size="xs" c="dimmed">Time</Text>
                  <Text size="xs">{message.enhancedFields.extractedTime}</Text>
                </div>
              )}
            </Group>
            
            <Group grow>
              {message.enhancedFields?.incidentType && (
                <div>
                  <Text size="xs" c="dimmed">Incident Type</Text>
                  <Text size="xs">{message.enhancedFields.incidentType}</Text>
                </div>
              )}
              
              {message.enhancedFields?.severity && (
                <div>
                  <Text size="xs" c="dimmed">Severity</Text>
                  <Badge 
                    size="xs"
                    color={
                      message.enhancedFields.severity === "CRITICAL" ? "red" : 
                      message.enhancedFields.severity === "HIGH" ? "orange" : 
                      message.enhancedFields.severity === "MEDIUM" ? "yellow" : "green"
                    }
                  >
                    {message.enhancedFields.severity}
                  </Badge>
                </div>
              )}
            </Group>
            
            {message.enhancedFields?.actionNeeded && (
              <div>
                <Text size="xs" c="dimmed">Recommended Action</Text>
                <Text size="xs">{message.enhancedFields.actionNeeded}</Text>
              </div>
            )}
            
            {message.enhancedFields?.sentiment && (
              <Group gap="xs">
                <Text size="xs" c="dimmed">Sentiment:</Text>
                <Badge 
                  size="xs"
                  color={sentimentColors[message.enhancedFields.sentiment as keyof typeof sentimentColors] || "gray"}
                >
                  {message.enhancedFields.sentiment}
                </Badge>
                {message.enhancedFields.sentimentScore && (
                  <Text size="xs" c="dimmed">
                    ({(message.enhancedFields.sentimentScore * 100).toFixed(0)}%)
                  </Text>
                )}
              </Group>
            )}
          </Stack>
        </Collapse>
      )}
    </Paper>
  );
}

export function ConversationDetail({ phoneNumber, messageCount, messages, conversationSentiment, parseIdentifier, onRefresh }: ConversationDetailProps) {
  const { channel, display, color } = parseIdentifier(phoneNumber);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeSentiment = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/conversations/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) throw new Error("Failed to analyze");

      notifications.show({
        title: "Analysis Complete",
        message: "Conversation sentiment has been analyzed",
        color: "teal"
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to analyze sentiment",
        color: "red"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card withBorder shadow="sm" style={{ flex: 1 }}>
      <Card.Section inheritPadding py="sm" withBorder>
        <Group justify="space-between">
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb={4}>
              <Badge size="sm" color={color}>
                {channel}
              </Badge>
              {conversationSentiment ? (
                <Tooltip label={`Analyzed ${new Date(conversationSentiment.lastAnalyzedAt || "").toLocaleString()} (${(conversationSentiment.score * 100).toFixed(0)}% confidence)`}>
                  <Badge 
                    size="sm" 
                    color={sentimentColors[conversationSentiment.sentiment]}
                    variant="dot"
                  >
                    {conversationSentiment.sentiment}
                  </Badge>
                </Tooltip>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftSection={<IconBrain size={14} />}
                  onClick={handleAnalyzeSentiment}
                  loading={analyzing}
                >
                  Analyze Sentiment
                </Button>
              )}
            </Group>
            <Text fw={600}>{display}</Text>
            <Text size="xs" c="dimmed">
              {messageCount} messages
            </Text>
            {conversationSentiment?.lastAnalyzedAt && (
              <Text size="xs" c="dimmed" mt="xs">
                Last analyzed: {formatDateTime(conversationSentiment.lastAnalyzedAt)}
              </Text>
            )}
          </div>
          {conversationSentiment && (
            <Button
              size="xs"
              variant="subtle"
              color="violet"
              leftSection={<IconBrain size={14} />}
              onClick={handleAnalyzeSentiment}
              loading={analyzing}
            >
              Re-analyze
            </Button>
          )}
        </Group>
      </Card.Section>
      
      {conversationSentiment?.summary && (
        <Card.Section>
          <Accordion variant="filled">
            <Accordion.Item value="summary">
              <Accordion.Control>
                <Group gap="xs">
                  <IconBrain size={16} />
                  <Text size="sm" fw={500}>AI-Generated Summary</Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
                  {conversationSentiment.summary}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Card.Section>
      )}
      
      <ScrollArea h={600} p="md">
        <Stack gap="md">
          {messages.map((message) => (
            <MessageWithEnhancedFields key={message.id} message={message} />
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
