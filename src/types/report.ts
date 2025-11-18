export type ReportCategory = "INFRASTRUCTURE" | "DISASTER" | "ADMIN" | "OTHER";
export type ReportPriority = "LOW" | "MEDIUM" | "HIGH";
export type ReportStatus = "OPEN" | "ACKNOWLEDGED" | "CLOSED";

export type ReportDTO = {
  id: string;
  phoneNumber: string;
  message: string;
  category: ReportCategory;
  priority: ReportPriority;
  status: ReportStatus;
  aiReply?: string | null;
  confidence?: number | null;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  addedToKnowledge?: boolean;
  createdAt: string;
};
