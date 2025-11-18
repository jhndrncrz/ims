"use client";

import { Badge, Button, Group, Modal, Select, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import { formatDateTime } from "@/lib/formatters";
import { useReportStore } from "@/store/reportStore";
import type { ReportDTO } from "@/types/report";

type ReportDetailModalProps = {
  report: ReportDTO | null;
  opened: boolean;
  onClose: () => void;
};

const categoryColors: Record<ReportDTO["category"], string> = {
  INFRASTRUCTURE: "indigo",
  DISASTER: "red",
  ADMIN: "orange",
  OTHER: "gray"
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

export function ReportDetailModal({ report, opened, onClose }: ReportDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const updateReport = useReportStore((state) => state.updateReport);

  const form = useForm({
    initialValues: {
      category: report?.category || "OTHER",
      priority: report?.priority || "LOW",
      status: report?.status || "OPEN",
      resolution: report?.resolution || ""
    }
  });

  if (!report) return null;

  const handleUpdate = async (values: typeof form.values) => {
    setUpdating(true);
    try {
      await updateReport(report.id, {
        category: values.category as ReportDTO["category"],
        priority: values.priority as ReportDTO["priority"],
        status: values.status as ReportDTO["status"],
        resolution: values.resolution || undefined
      });
      notifications.show({
        title: "Success",
        message: "Report updated successfully",
        color: "teal"
      });
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to update report",
        color: "red"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddToKnowledge = async () => {
    if (!form.values.resolution) {
      notifications.show({
        title: "Missing Resolution",
        message: "Please add a resolution before adding to knowledge base",
        color: "orange"
      });
      return;
    }

    setUpdating(true);
    try {
      await updateReport(report.id, {
        resolution: form.values.resolution,
        addToKnowledge: true
      });
      notifications.show({
        title: "Added to Knowledge Base",
        message: "This resolution is now available for AI responses",
        color: "teal"
      });
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to add to knowledge base",
        color: "red"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Report Details" size="lg">
      <Stack gap="md">
        <Group>
          <Badge color={categoryColors[report.category]}>{report.category}</Badge>
          <Badge color={priorityColors[report.priority]} variant="dot">
            {report.priority}
          </Badge>
          <Badge color={statusColors[report.status]}>{report.status}</Badge>
          {report.addedToKnowledge && <Badge color="violet">In Knowledge Base</Badge>}
        </Group>

        <div>
          <Text size="sm" c="dimmed">
            Phone Number
          </Text>
          <Text fw={500}>{report.phoneNumber}</Text>
        </div>

        <div>
          <Text size="sm" c="dimmed">
            Message
          </Text>
          <Text>{report.message}</Text>
        </div>

        {report.aiReply && (
          <div>
            <Text size="sm" c="dimmed">
              AI Response
            </Text>
            <Text size="sm">{report.aiReply}</Text>
          </div>
        )}

        <div>
          <Text size="sm" c="dimmed">
            Received
          </Text>
          <Text size="sm">{formatDateTime(report.createdAt)}</Text>
        </div>

        {report.confidence && (
          <div>
            <Text size="sm" c="dimmed">
              Classification Confidence
            </Text>
            <Text size="sm">{(report.confidence * 100).toFixed(0)}%</Text>
          </div>
        )}

        <form onSubmit={form.onSubmit(handleUpdate)}>
          <Stack gap="md">
            <Select
              label="Category"
              data={["INFRASTRUCTURE", "DISASTER", "ADMIN", "OTHER"]}
              {...form.getInputProps("category")}
            />
            <Select
              label="Priority"
              data={["LOW", "MEDIUM", "HIGH"]}
              {...form.getInputProps("priority")}
            />
            <Select
              label="Status"
              data={["OPEN", "ACKNOWLEDGED", "CLOSED"]}
              {...form.getInputProps("status")}
            />
            <Textarea
              label="Resolution"
              placeholder="Describe how this was resolved..."
              minRows={4}
              {...form.getInputProps("resolution")}
            />

            <Group justify="space-between">
              <Button
                variant="light"
                color="violet"
                onClick={handleAddToKnowledge}
                loading={updating}
                disabled={report.addedToKnowledge}
              >
                {report.addedToKnowledge ? "Already in Knowledge Base" : "Add to Knowledge Base"}
              </Button>
              <Group>
                <Button variant="subtle" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={updating}>
                  Update Report
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
