"use client";

import { Card, Code, List, Text } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";

const sources = [
  "announcements.md",
  "ordinances.md",
  "disaster-guidelines.md"
];

export const KnowledgeBaseCard = () => (
  <Card withBorder padding="lg">
    <Card.Section inheritPadding py="sm">
      <Text fw={600}>Ingested references</Text>
      <Text size="sm" c="dimmed">
        These markdown files are chunked into embeddings via the built-in ingestion script.
      </Text>
    </Card.Section>
    <List
      mt="md"
      spacing="sm"
      icon={<IconFileDescription size={16} stroke={1.5} />}
      styles={{ item: { fontSize: 14 } }}
    >
      {sources.map((source) => (
        <List.Item key={source}>{source}</List.Item>
      ))}
    </List>
    <Text size="sm" c="dimmed" mt="md">
      Run <Code>pnpm rag:ingest</Code> after updating files in <Code>data/docs</Code> to refresh the knowledge base.
    </Text>
  </Card>
);
