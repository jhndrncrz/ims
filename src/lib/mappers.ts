import { Report } from "@prisma/client";

import { ReportDTO, ReportSentiment, ReportSeverity } from "@/types/report";

export const toReportDTO = (report: Report): ReportDTO => ({
  id: report.id,
  phoneNumber: report.phoneNumber,
  message: report.message,
  category: report.category,
  priority: report.priority,
  status: report.status,
  aiReply: report.aiReply,
  confidence: report.confidence,
  resolution: report.resolution,
  resolvedBy: report.resolvedBy,
  resolvedAt: report.resolvedAt?.toISOString(),
  addedToKnowledge: report.addedToKnowledge,
  createdAt: report.createdAt.toISOString(),
  
  // Enhanced extraction fields
  extractedLocation: report.extractedLocation,
  extractedTime: report.extractedTime,
  incidentType: report.incidentType,
  severity: report.severity as ReportSeverity | null,
  actionNeeded: report.actionNeeded,
  extractedEntities: report.extractedEntities ? (report.extractedEntities as { people: string[]; places: string[] }) : null,
  summaryGenerated: report.summaryGenerated,
  
  // Sentiment analysis fields
  sentiment: report.sentiment as ReportSentiment | null,
  sentimentScore: report.sentimentScore,
  sentimentKeywords: report.sentimentKeywords ? (report.sentimentKeywords as string[]) : null,
  
  // AI recommendations
  recommendations: report.recommendations ? (report.recommendations as {
    recommendations: string[];
    urgencyLevel: "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW";
    suggestedActions: string[];
    estimatedResolutionTime: string;
    requiredResources: string[];
  }) : null,
  recommendationsGeneratedAt: report.recommendationsGeneratedAt?.toISOString()
});
