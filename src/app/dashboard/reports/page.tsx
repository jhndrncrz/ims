"use client";

import { Badge, Button, Card, ScrollArea, Stack, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBuildingBridge, IconFlame, IconFileText, IconQuestionMark, IconAlertTriangle, IconClock, IconCheck } from "@tabler/icons-react";
import { useEffect, useState, createElement } from "react";

import { formatDateTime } from "@/lib/formatters";
import { useReportStore } from "@/store/reportStore";
import type { ReportDTO } from "@/types/report";
import { ReportDetailModal } from "@/components/dashboard/ReportDetailModal";

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

export default function ReportsPage() {
  const reports = useReportStore((state) => state.reports);
  const loading = useReportStore((state) => state.loading);
  const fetchReports = useReportStore((state) => state.fetchReports);
  const [selectedReport, setSelectedReport] = useState<ReportDTO | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleRowClick = (report: ReportDTO) => {
    setSelectedReport(report);
    open();
  };

  const handleClose = () => {
    close();
    setSelectedReport(null);
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Citizen Reports</Title>
        <Text c="dimmed" size="sm">
          View and manage reports submitted by citizens via SMS
        </Text>
      </div>

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
                    <Button size="xs" variant="light" onClick={() => handleRowClick(report)}>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <ReportDetailModal report={selectedReport} opened={opened} onClose={handleClose} />
    </Stack>
  );
}
