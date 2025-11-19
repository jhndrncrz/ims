"use client";

import { Badge, Button, Combobox, Group, Input, InputBase, Modal, Stack, Text, Textarea, useCombobox } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconBuildingBridge, IconFlame, IconFileText, IconQuestionMark, IconAlertTriangle, IconClock, IconCheck } from "@tabler/icons-react";
import { createElement, useState } from "react";

import { formatDateTime } from "@/lib/formatters";
import { useReportStore } from "@/store/reportStore";
import type { ReportDTO } from "@/types/report";
import { ReportCategory } from "@prisma/client";

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

export function ReportDetailModal({ report, opened, onClose }: ReportDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const updateReport = useReportStore((state) => state.updateReport);

  const categoryCombobox = useCombobox({
    onDropdownClose: () => categoryCombobox.resetSelectedOption(),
  });
  const priorityCombobox = useCombobox({
    onDropdownClose: () => priorityCombobox.resetSelectedOption(),
  });
  const statusCombobox = useCombobox({
    onDropdownClose: () => statusCombobox.resetSelectedOption(),
  });

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
            <div>
              <Input.Label>Category</Input.Label>
              <Combobox
                store={categoryCombobox}
                onOptionSubmit={(val) => {
                  form.setFieldValue("category", val as ReportCategory);
                  categoryCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    onClick={() => categoryCombobox.toggleDropdown()}
                    rightSectionPointerEvents="none"
                  >
                    <Badge 
                      color={categoryColors[form.values.category as ReportDTO["category"]]} 
                      leftSection={createElement(categoryIcons[form.values.category as ReportDTO["category"]], { size: 12 })}
                    >
                      {form.values.category}
                    </Badge>
                  </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {(["INFRASTRUCTURE", "DISASTER", "ADMIN", "OTHER"] as const).map((cat) => (
                      <Combobox.Option value={cat} key={cat}>
                        <Badge 
                          color={categoryColors[cat]} 
                          leftSection={createElement(categoryIcons[cat], { size: 12 })}
                        >
                          {cat}
                        </Badge>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </div>

            <div>
              <Input.Label>Priority</Input.Label>
              <Combobox
                store={priorityCombobox}
                onOptionSubmit={(val) => {
                  form.setFieldValue("priority", val as ReportDTO["priority"]);
                  priorityCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    onClick={() => priorityCombobox.toggleDropdown()}
                    rightSectionPointerEvents="none"
                  >
                    <Badge 
                      color={priorityColors[form.values.priority as ReportDTO["priority"]]} 
                      variant="dot"
                    >
                      {form.values.priority}
                    </Badge>
                  </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {(["LOW", "MEDIUM", "HIGH"] as const).map((prio) => (
                      <Combobox.Option value={prio} key={prio}>
                        <Badge 
                          color={priorityColors[prio]} 
                          variant="dot"
                        >
                          {prio}
                        </Badge>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </div>

            <div>
              <Input.Label>Status</Input.Label>
              <Combobox
                store={statusCombobox}
                onOptionSubmit={(val) => {
                  form.setFieldValue("status", val as ReportDTO["status"]);
                  statusCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    onClick={() => statusCombobox.toggleDropdown()}
                    rightSectionPointerEvents="none"
                  >
                    <Badge 
                      color={statusColors[form.values.status as ReportDTO["status"]]} 
                      leftSection={createElement(statusIcons[form.values.status as ReportDTO["status"]], { size: 12 })}
                    >
                      {form.values.status}
                    </Badge>
                  </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {(["OPEN", "ACKNOWLEDGED", "CLOSED"] as const).map((stat) => (
                      <Combobox.Option value={stat} key={stat}>
                        <Badge 
                          color={statusColors[stat]} 
                          leftSection={createElement(statusIcons[stat], { size: 12 })}
                        >
                          {stat}
                        </Badge>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </div>

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
