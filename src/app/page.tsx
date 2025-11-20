"use client";

import { Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconChartBar, IconMessage } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <Container size="md" py={80}>
      <Stack gap="xl" align="center">
        <div style={{ textAlign: "center" }}>
          <Title order={1} size={48} mb="md">
            BarangaAI
          </Title>
          <Text size="xl" c="dimmed" maw={600}>
            Unified SMS hotline powered by Alibaba Cloud AI, Retrieval Augmented Generation, and automated citizen reporting.
          </Text>
        </div>

        <Group gap="lg" mt="xl">
          <Card withBorder shadow="md" p="xl" maw={320}>
            <Stack gap="md" align="center">
              <IconChartBar size={48} stroke={1.5} color="var(--mantine-color-blue-6)" />
              <Title order={3}>Barangay Dashboard</Title>
              <Text size="sm" c="dimmed" ta="center">
                Access reports, analytics, and manage knowledge base documents
              </Text>
              <Button fullWidth size="md" onClick={() => router.push("/dashboard")}>
                Enter Dashboard
              </Button>
            </Stack>
          </Card>

          <Card withBorder shadow="md" p="xl" maw={320}>
            <Stack gap="md" align="center">
              <IconMessage size={48} stroke={1.5} color="var(--mantine-color-violet-6)" />
              <Title order={3}>SMS Simulator</Title>
              <Text size="sm" c="dimmed" ta="center">
                Test the AI chatbot and see real-time SMS responses
              </Text>
              <Button fullWidth size="md" variant="light" onClick={() => router.push("/simulator")}>
                Try SMS Bot
              </Button>
            </Stack>
          </Card>
        </Group>
      </Stack>
    </Container>
  );
}
