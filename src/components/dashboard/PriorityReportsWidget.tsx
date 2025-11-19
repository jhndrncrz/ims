import { Card, Badge, Group, Text, Stack, ActionIcon, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconClock, IconEye } from "@tabler/icons-react";
import { createElement } from "react";
import type { ReportDTO } from "@/types/report";
import { 
  severityColors, 
  categoryColors, 
  categoryIcons,
  priorityColors,
  statusColors,
  statusIcons
} from "@/constants/reportConstants";

interface PriorityReport {
  id: string;
  category: string;
  priority: string;
  status: string;
  severity: string | null | undefined;
  message: string;
  extractedLocation: string | null | undefined;
  createdAt: string;
}

interface PriorityReportsWidgetProps {
  reports: ReportDTO[];
  onViewReport: (reportId: string) => void;
}

/**
 * Format time ago from date
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes}m ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays === 1) {
    return "1 day ago";
  }
  return `${diffInDays} days ago`;
}

export function PriorityReportsWidget({
  reports,
  onViewReport
}: PriorityReportsWidgetProps) {
  // Filter for high-priority reports (HIGH priority or CRITICAL/HIGH severity)
  const priorityReports: PriorityReport[] = reports
    .filter((r) => r.status !== "CLOSED")
    .filter((r) => 
      r.priority === "HIGH" || 
      r.severity === "CRITICAL" || 
      r.severity === "HIGH" ||
      (r.category === "DISASTER" && r.severity === "MEDIUM")
    )
    .map((report) => ({
      id: report.id,
      category: report.category,
      priority: report.priority,
      status: report.status,
      severity: report.severity,
      message: report.message,
      extractedLocation: report.extractedLocation,
      createdAt: report.createdAt
    }))
    .sort((a, b) => {
      // Sort by priority first (HIGH > MEDIUM > LOW)
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by severity (CRITICAL > HIGH > MEDIUM > LOW)
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const severityDiff = (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 4);
      if (severityDiff !== 0) return severityDiff;

      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5); // Show top 5 only

  if (priorityReports.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconAlertTriangle size={20} style={{ color: "var(--mantine-color-gray-6)" }} />
              <Text fw={600}>High Priority Reports</Text>
            </Group>
            <Badge color="green" variant="light">
              All Clear
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No urgent reports at this time
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconAlertTriangle size={20} style={{ color: "var(--mantine-color-red-6)" }} />
            <Text fw={600}>High Priority Reports</Text>
          </Group>
          <Badge color="red" variant="filled">
            {priorityReports.length} Urgent
          </Badge>
        </Group>

        <Stack gap="xs">
          {priorityReports.map((report) => (
            <Card
              key={report.id}
              padding="sm"
              radius="sm"
              withBorder
              onClick={() => onViewReport(report.id)}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      color={categoryColors[report.category as keyof typeof categoryColors] || "gray"}
                      size="xs"
                      leftSection={createElement(
                        categoryIcons[report.category as keyof typeof categoryIcons],
                        { size: 10 }
                      )}
                    >
                      {report.category}
                    </Badge>
                    <Badge
                      color={priorityColors[report.priority as keyof typeof priorityColors]}
                      variant="dot"
                      size="xs"
                    >
                      {report.priority}
                    </Badge>
                    {report.severity && (
                      <Badge
                        color={severityColors[report.severity as keyof typeof severityColors] || "gray"}
                        variant="light"
                        size="xs"
                      >
                        {report.severity}
                      </Badge>
                    )}
                    <Badge
                      color={statusColors[report.status as keyof typeof statusColors]}
                      size="xs"
                      leftSection={createElement(
                        statusIcons[report.status as keyof typeof statusIcons],
                        { size: 10 }
                      )}
                    >
                      {report.status}
                    </Badge>
                  </Group>

                  <Text size="sm" fw={500} lineClamp={2}>
                    {report.message}
                  </Text>

                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {report.extractedLocation || "No location"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      •
                    </Text>
                    <Group gap={4}>
                      <IconClock size={12} style={{ color: "var(--mantine-color-gray-6)" }} />
                      <Text size="xs" c="dimmed">
                        {formatTimeAgo(new Date(report.createdAt))}
                      </Text>
                    </Group>
                  </Group>
                </Stack>

                <Tooltip label="View Details">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReport(report.id);
                    }}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
