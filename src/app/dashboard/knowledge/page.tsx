"use client";

import { Card, List, Stack, Text, Title } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";

const sources = ["announcements.md", "ordinances.md", "disaster-guidelines.md"];

export default function KnowledgePage() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Knowledge Base Overview</Title>
        <Text size="sm">
          Current sources powering the AI chatbot
        </Text>
      </div>

      <Card withBorder shadow="sm" p="lg">
        <Text fw={600} mb="md">
          Active Document Sources
        </Text>
        <List spacing="sm" icon={<IconFileDescription size={16} stroke={1.5} />}>
          {sources.map((source) => (
            <List.Item key={source}>{source}</List.Item>
          ))}
        </List>
        <Text size="sm" mt="lg">
          These files are chunked into embeddings for semantic search. Manage them in the Documents section.
        </Text>
      </Card>
    </Stack>
  );
}
