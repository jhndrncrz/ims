"use client";

import { Badge, Card, Group, ScrollArea, Table, Text } from "@mantine/core";
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

type ReportTableProps = {
  reports: ReportDTO[];
};

export const ReportTable = ({ reports }: ReportTableProps) => (
  <Card withBorder padding="md">
    <Card.Section inheritPadding py="sm">
      <Group justify="space-between">
        <div>
          <Text fw={600}>Latest SMS reports</Text>
          <Text size="sm" c="dimmed">
            Synced automatically from incoming SMS messages
          </Text>
        </div>
      </Group>
    </Card.Section>

    <ScrollArea h={360} mt="sm">
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Details</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Priority</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Recorded</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.map((report) => (
            <Table.Tr key={report.id}>
              <Table.Td>
                <Text fw={600}>{report.phoneNumber}</Text>
                <Text size="sm" c="dimmed">
                  {report.message}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge color={categoryColors[report.category]} leftSection={createElement(categoryIcons[report.category], { size: 12 })}>
                  {report.category}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge color={priorityColors[report.priority]} variant="dot">
                  {report.priority}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge color={statusColors[report.status]} leftSection={createElement(statusIcons[report.status], { size: 12 })}>
                  {report.status}
                </Badge>
              </Table.Td>
              <Table.Td>{formatDateTime(report.createdAt)}</Table.Td>
            </Table.Tr>
          ))}
          {reports.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text size="sm" c="dimmed">
                  No reports yet. Try sending an SMS or add one using the form.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Card>
);
