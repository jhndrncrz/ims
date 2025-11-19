import { IconBuildingBridge, IconFlame, IconFileText, IconQuestionMark, IconAlertTriangle, IconClock, IconCheck } from "@tabler/icons-react";
import type { ComponentType } from "react";

/**
 * Report Category Configuration
 * AI-assigned category for the type of incident
 */
export const REPORT_CATEGORIES = {
  INFRASTRUCTURE: "INFRASTRUCTURE",
  DISASTER: "DISASTER",
  ADMIN: "ADMIN",
  OTHER: "OTHER",
} as const;

export type ReportCategory = typeof REPORT_CATEGORIES[keyof typeof REPORT_CATEGORIES];

export const categoryColors: Record<ReportCategory, string> = {
  INFRASTRUCTURE: "indigo",
  DISASTER: "red",
  ADMIN: "orange",
  OTHER: "gray",
};

export const categoryIcons: Record<ReportCategory, ComponentType<{ size?: number }>> = {
  INFRASTRUCTURE: IconBuildingBridge,
  DISASTER: IconFlame,
  ADMIN: IconFileText,
  OTHER: IconQuestionMark,
};

export const categoryOptions = [
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "DISASTER", label: "Disaster" },
  { value: "ADMIN", label: "Admin" },
  { value: "OTHER", label: "Other" },
];

/**
 * Report Priority Configuration
 * Manually assignable priority level (overridable)
 */
export const REPORT_PRIORITIES = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type ReportPriority = typeof REPORT_PRIORITIES[keyof typeof REPORT_PRIORITIES];

export const priorityColors: Record<ReportPriority, string> = {
  HIGH: "red",
  MEDIUM: "yellow",
  LOW: "green",
};

export const priorityOptions = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

/**
 * Report Severity Configuration
 * AI-extracted severity from message content
 */
export const REPORT_SEVERITIES = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type ReportSeverity = typeof REPORT_SEVERITIES[keyof typeof REPORT_SEVERITIES];

export const severityColors: Record<ReportSeverity, string> = {
  CRITICAL: "red",
  HIGH: "orange",
  MEDIUM: "yellow",
  LOW: "blue",
};

export const severityOptions = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

/**
 * Report Status Configuration
 * Current status of the report
 */
export const REPORT_STATUSES = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  CLOSED: "CLOSED",
} as const;

export type ReportStatus = typeof REPORT_STATUSES[keyof typeof REPORT_STATUSES];

export const statusColors: Record<ReportStatus, string> = {
  OPEN: "blue",
  ACKNOWLEDGED: "yellow",
  CLOSED: "teal",
};

export const statusIcons: Record<ReportStatus, ComponentType<{ size?: number }>> = {
  OPEN: IconAlertTriangle,
  ACKNOWLEDGED: IconClock,
  CLOSED: IconCheck,
};

export const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "CLOSED", label: "Closed" },
];

/**
 * Report Sentiment Configuration
 * AI-detected sentiment from message
 */
export const REPORT_SENTIMENTS = {
  POSITIVE: "POSITIVE",
  NEUTRAL: "NEUTRAL",
  NEGATIVE: "NEGATIVE",
} as const;

export type ReportSentiment = typeof REPORT_SENTIMENTS[keyof typeof REPORT_SENTIMENTS];

export const sentimentColors: Record<ReportSentiment, string> = {
  POSITIVE: "teal",
  NEUTRAL: "gray",
  NEGATIVE: "red",
};

export const sentimentOptions = [
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
];
