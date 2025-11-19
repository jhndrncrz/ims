"use client";

import { Badge, Button, Combobox, Group, Input, InputBase, Modal, Stack, Text, Textarea, useCombobox, Menu, Divider, Collapse } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconFileTypePdf, IconJson, IconBulb, IconDotsVertical } from "@tabler/icons-react";
import { createElement, useState, useEffect } from "react";

import { formatDateTime } from "@/lib/formatters";
import { useReportStore } from "@/store/reportStore";
import type { ReportDTO } from "@/types/report";
import { ReportCategory } from "@prisma/client";
import { logger } from "@/lib/logger";
import {
  categoryColors,
  categoryIcons,
  priorityColors,
  statusColors,
  statusIcons,
  severityColors,
  sentimentColors
} from "@/constants/reportConstants";

type ReportDetailModalProps = {
  report: ReportDTO | null;
  opened: boolean;
  onClose: () => void;
};

type RecommendationResult = {
  recommendations: string[];
  urgencyLevel: "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW";
  suggestedActions: string[];
  estimatedResolutionTime: string;
  requiredResources: string[];
  generatedAt?: string;
};

export function ReportDetailModal({ report, opened, onClose }: ReportDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
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
      category: "OTHER",
      priority: "LOW",
      status: "OPEN",
      resolution: ""
    }
  });

  // Sync form values and recommendations when report changes
  useEffect(() => {
    if (report) {
      form.setValues({
        category: report.category,
        priority: report.priority,
        status: report.status,
        resolution: report.resolution || ""
      });
      
      // Load stored recommendations if available
      if (report.recommendations) {
        setRecommendations({
          ...report.recommendations,
          generatedAt: report.recommendationsGeneratedAt || undefined
        });
        setShowRecommendations(true); // Automatically show if recommendations exist
      } else {
        setRecommendations(null);
        setShowRecommendations(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id]);

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
      logger.error("Failed to update report", { reportId: report.id, error });
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
      logger.error("Failed to add to knowledge base", { reportId: report.id, error });
      notifications.show({
        title: "Error",
        message: "Failed to add to knowledge base",
        color: "red"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (recommendations && showRecommendations) {
      setShowRecommendations(false);
      return;
    }
    
    if (recommendations && !showRecommendations) {
      setShowRecommendations(true);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/recommendations`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const data = await response.json() as RecommendationResult;
      setRecommendations(data);
      setShowRecommendations(true);

      notifications.show({
        title: "Recommendations Generated",
        message: "AI-powered action plan created and saved",
        color: "teal",
      });
    } catch (error) {
      logger.error("Failed to generate recommendations", { reportId: report.id, error });
      notifications.show({
        title: "Failed to Generate Recommendations",
        message: "Could not create recommendations",
        color: "red"
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleExport = async (format: "pdf" | "json", template?: string) => {
    try {
      const params = new URLSearchParams({ format });
      if (template) params.append("template", template);
      params.append("includeEnhanced", "true");

      if (format === "pdf") {
        // Open HTML in new window for print-to-PDF
        const url = `/api/reports/${report.id}/export?${params.toString()}`;
        window.open(url, "_blank");
        
        notifications.show({
          title: "Opening Print Preview",
          message: "Click the print button to save as PDF",
          color: "blue",
        });
      } else {
        // JSON - download directly
        const response = await fetch(`/api/reports/${report.id}/export?${params.toString()}`);
        
        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${report.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notifications.show({
          title: "Export Successful",
          message: `Report exported as ${format.toUpperCase()}`,
          color: "teal",
        });
      }
    } catch (error) {
      logger.error("Failed to export report", { reportId: report.id, error });
      notifications.show({
        title: "Export Failed",
        message: "Could not export report",
        color: "red"
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Report Details" size="lg">
      <Stack gap="md">
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

        {/* Enhanced Extraction Section */}
        {(report.summaryGenerated || report.extractedLocation || report.extractedTime) && (
          <>
            <Text size="sm" fw={600}>
              AI-Extracted Information
            </Text>

            {report.summaryGenerated && (
              <div>
                <Text size="sm" c="dimmed">
                  Summary
                </Text>
                <Text size="sm">{report.summaryGenerated}</Text>
              </div>
            )}

            <Group grow>
              {report.extractedLocation && (
                <div>
                  <Text size="sm" c="dimmed">
                    Location
                  </Text>
                  <Text size="sm">{report.extractedLocation}</Text>
                </div>
              )}

              {report.extractedTime && (
                <div>
                  <Text size="sm" c="dimmed">
                    Time
                  </Text>
                  <Text size="sm">{report.extractedTime}</Text>
                </div>
              )}
            </Group>

            <Group grow>
              {report.incidentType && (
                <div>
                  <Text size="sm" c="dimmed">
                    Incident Type
                  </Text>
                  <Text size="sm">{report.incidentType}</Text>
                </div>
              )}

              {report.severity && (
                <div>
                  <Text size="sm" c="dimmed">
                    Severity
                  </Text>
                  <Badge 
                    color={severityColors[report.severity as keyof typeof severityColors] || "gray"}
                    variant="dot"
                  >
                    {report.severity}
                  </Badge>
                </div>
              )}
            </Group>

            {report.actionNeeded && (
              <div>
                <Text size="sm" c="dimmed">
                  Recommended Action
                </Text>
                <Text size="sm">{report.actionNeeded}</Text>
              </div>
            )}
          </>
        )}

        {/* Sentiment Analysis Section */}
        {report.sentiment && (
          <>
            <Text size="sm" fw={600}>
              Sentiment Analysis
            </Text>

            <Stack>
              <Group>
                <Text size="sm" c="dimmed">
                  Sentiment
                </Text>
                <Badge 
                  color={sentimentColors[report.sentiment as keyof typeof sentimentColors] || "gray"}
                  variant="light"
                >
                  {report.sentiment}
                </Badge>
              </Group>

              {report.sentimentScore && (
                <Group>
                  <Text size="sm" c="dimmed">
                    Confidence
                  </Text>
                  <Text size="sm">{(report.sentimentScore * 100).toFixed(0)}%</Text>
                </Group>
              )}
            </Stack>

            {report.sentimentKeywords && Array.isArray(report.sentimentKeywords) && report.sentimentKeywords.length > 0 && (
              <div>
                <Text size="sm" c="dimmed">
                  Keywords
                </Text>
                <Group gap="xs">
                  {report.sentimentKeywords.map((keyword, idx) => (
                    <Badge key={idx} size="sm" variant="outline" color="gray">
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
          </>
        )}

        <form onSubmit={form.onSubmit(handleUpdate)}>
          <Stack gap="md">
            <div>
              <Input.Label>Category</Input.Label>
              <Text size="xs" c="dimmed" mb={4}>
                Manually override AI-assigned category
              </Text>
              <Combobox
                store={categoryCombobox}
                onOptionSubmit={(val) => {
                  form.setFieldValue("category", val as ReportCategory);
                  categoryCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    value={form.values.category}
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
              <Text size="xs" c="dimmed" mb={4}>
                Manually override priority level
              </Text>
              <Combobox
                store={priorityCombobox}
                onOptionSubmit={(val) => {
                  form.setFieldValue("priority", val as ReportDTO["priority"]);
                  priorityCombobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    value={form.values.priority}
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
                    value={form.values.status}
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

            <Collapse in={showRecommendations && !!recommendations}>
              {recommendations && (
                <Stack gap="md" p="md" style={{ backgroundColor: "var(--mantine-color-violet-0)", borderRadius: "var(--mantine-radius-md)" }}>
                  <Group justify="space-between">
                    <Group>
                      <Badge
                        color={
                          recommendations.urgencyLevel === "IMMEDIATE"
                            ? "red"
                            : recommendations.urgencyLevel === "URGENT"
                            ? "orange"
                            : recommendations.urgencyLevel === "MODERATE"
                            ? "yellow"
                            : "green"
                        }
                        variant="filled"
                      >
                        {recommendations.urgencyLevel}
                      </Badge>
                      <Text size="sm" c="dimmed">
                        Est. Resolution: {recommendations.estimatedResolutionTime}
                      </Text>
                    </Group>
                    {recommendations.generatedAt && (
                      <Text size="xs" c="dimmed">
                        Generated: {formatDateTime(recommendations.generatedAt)}
                      </Text>
                    )}
                  </Group>

                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Recommended Actions
                    </Text>
                    <Stack gap="xs">
                      {recommendations.recommendations.map((rec, idx) => (
                        <Group key={idx} align="flex-start" gap="xs">
                          <Text size="sm" c="dimmed">
                            {idx + 1}.
                          </Text>
                          <Text size="sm">{rec}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </div>

                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Suggested Steps
                    </Text>
                    <Stack gap="xs">
                      {recommendations.suggestedActions.map((action, idx) => (
                        <Group key={idx} align="flex-start" gap="xs">
                          <Text size="sm" c="dimmed">
                            •
                          </Text>
                          <Text size="sm">{action}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </div>

                  {recommendations.requiredResources.length > 0 && (
                    <div>
                      <Text size="sm" fw={600} mb="xs">
                        Required Resources
                      </Text>
                      <Group gap="xs">
                        {recommendations.requiredResources.map((resource, idx) => (
                          <Badge key={idx} variant="outline" color="violet">
                            {resource}
                          </Badge>
                        ))}
                      </Group>
                    </div>
                  )}
                </Stack>
              )}
            </Collapse>

            <Divider />

            <Group justify="space-between">
              <Menu shadow="md" width={250}>
                <Menu.Target>
                  <Button variant="light" leftSection={<IconDotsVertical size={16} />}>
                    More Actions
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>AI Tools</Menu.Label>
                  <Menu.Item
                    leftSection={<IconBulb size={16} />}
                    onClick={handleGetRecommendations}
                    disabled={loadingRecommendations}
                  >
                    {loadingRecommendations
                      ? "Generating..."
                      : recommendations
                      ? showRecommendations
                        ? "Hide Recommendations"
                        : "Show Recommendations"
                      : "Get AI Recommendations"}
                  </Menu.Item>
                  {recommendations && (
                    <Menu.Item
                      leftSection={<IconBulb size={16} />}
                      onClick={async () => {
                        setRecommendations(null);
                        await handleGetRecommendations();
                      }}
                      disabled={loadingRecommendations}
                      color="violet"
                    >
                      Regenerate Recommendations
                    </Menu.Item>
                  )}
                  <Menu.Item
                    leftSection={<IconBulb size={16} />}
                    onClick={handleAddToKnowledge}
                    disabled={report.addedToKnowledge || updating}
                    color={report.addedToKnowledge ? "gray" : "violet"}
                  >
                    {report.addedToKnowledge ? "Already in Knowledge Base" : "Add to Knowledge Base"}
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Label>Export Options</Menu.Label>
                  <Menu.Item
                    leftSection={<IconFileTypePdf size={16} />}
                    onClick={() => void handleExport("pdf", "INCIDENT_REPORT")}
                  >
                    Export as PDF (Incident Report)
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileTypePdf size={16} />}
                    onClick={() => void handleExport("pdf", "BLOTTER_ENTRY")}
                  >
                    Export as PDF (Blotter Entry)
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconJson size={16} />}
                    onClick={() => void handleExport("json")}
                  >
                    Export as JSON
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

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
