import { Badge, Button, Card, ScrollArea, Table, Text } from "@mantine/core";
import { IconBuildingBridge, IconFlame, IconFileText, IconQuestionMark, IconAlertTriangle, IconClock, IconCheck } from "@tabler/icons-react";
import { createElement } from "react";

import { formatDateTime } from "@/lib/formatters";
import type { ReportDTO } from "@/types/report";

const categoryColors: Record<ReportDTO["category"], string> = {
  INFRASTRUCTURE: "indigo",
  DISASTER: "red",
  ADMIN: "orange",
  OTHER: "gray"
};

const categoryIcons: Record<ReportDTO["category"], React.ComponentType<{ size?: number }>> = {
  INFRASTRUCTURE: IconBuildingBridge,
  DISASTER: IconFlame,
  ADMIN: IconFileText,
  OTHER: IconQuestionMark
};

const priorityColors: Record<ReportDTO["priority"], string> = {
  HIGH: "red",
  MEDIUM: "yellow",
  LOW: "green"
};

const statusColors: Record<ReportDTO["status"], string> = {
  OPEN: "blue",
  ACKNOWLEDGED: "yellow",
  CLOSED: "teal"
};

const statusIcons: Record<ReportDTO["status"], React.ComponentType<{ size?: number }>> = {
  OPEN: IconAlertTriangle,
  ACKNOWLEDGED: IconClock,
  CLOSED: IconCheck
};

type ReportsTableProps = {
  reports: ReportDTO[];
  loading: boolean;
  onRowClick: (report: ReportDTO) => void;
};

export function ReportsTable({ reports, loading, onRowClick }: ReportsTableProps) {
  return (
    <Card withBorder shadow="sm">
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Message</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Received</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text size="sm" c="dimmed">
                    Loading reports...
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {!loading && reports.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text size="sm" c="dimmed">
                    No reports yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {reports.map((report) => (
              <Table.Tr key={report.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {report.phoneNumber}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2}>
                    {report.message}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={categoryColors[report.category]} size="sm" leftSection={createElement(categoryIcons[report.category], { size: 12 })}>
                    {report.category}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={priorityColors[report.priority]} size="sm" variant="dot">
                    {report.priority}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={statusColors[report.status]} size="sm" leftSection={createElement(statusIcons[report.status], { size: 12 })}>
                    {report.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDateTime(report.createdAt)}</Text>
                </Table.Td>
                <Table.Td>
                  <Button size="xs" variant="light" onClick={() => onRowClick(report)}>
                    View
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
