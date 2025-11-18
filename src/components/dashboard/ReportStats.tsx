"use client";

import { Card, Group, Loader, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconReport, IconStatusChange } from "@tabler/icons-react";

import type { ReportDTO } from "@/types/report";

type ReportStatsProps = {
  reports: ReportDTO[];
  loading: boolean;
};

const colors = {
  open: "blue",
  acknowledged: "yellow",
  closed: "teal"
} as const;

export const ReportStats = ({ reports, loading }: ReportStatsProps) => {
  const total = reports.length;
  const open = reports.filter((report) => report.status === "OPEN").length;
  const acknowledged = reports.filter((report) => report.status === "ACKNOWLEDGED").length;
  const closed = reports.filter((report) => report.status === "CLOSED").length;

  const tiles = [
    {
      label: "Total reports",
      value: total,
      icon: IconReport,
      color: "grape"
    },
    {
      label: "Open",
      value: open,
      icon: IconAlertTriangle,
      color: colors.open
    },
    {
      label: "Acknowledged",
      value: acknowledged,
      icon: IconStatusChange,
      color: colors.acknowledged
    },
    {
      label: "Closed",
      value: closed,
      icon: IconStatusChange,
      color: colors.closed
    }
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      {tiles.map((tile) => (
        <Card key={tile.label} padding="lg" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {tile.label}
              </Text>
              <Group gap="xs" mt="sm">
                <Text size="xl" fw={700}>
                  {loading ? <Loader size="sm" /> : tile.value}
                </Text>
              </Group>
            </div>
            <ThemeIcon variant="light" color={tile.color} size={36}>
              <tile.icon size={20} />
            </ThemeIcon>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
};
