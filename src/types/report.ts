export type ReportCategory = "INFRASTRUCTURE" | "DISASTER" | "ADMIN" | "OTHER";
export type ReportPriority = "LOW" | "MEDIUM" | "HIGH";
export type ReportStatus = "OPEN" | "ACKNOWLEDGED" | "CLOSED";
export type ReportSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ReportSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

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
  
  // Enhanced extraction fields
  extractedLocation?: string | null;
  extractedTime?: string | null;
  incidentType?: string | null;
  severity?: ReportSeverity | null;
  actionNeeded?: string | null;
  extractedEntities?: {
    people: string[];
    places: string[];
  } | null;
  summaryGenerated?: string | null;
  
  // Sentiment analysis fields
  sentiment?: ReportSentiment | null;
  sentimentScore?: number | null;
  sentimentKeywords?: string[] | null;
};
