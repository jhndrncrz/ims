import { Report } from "@prisma/client";

import { ReportDTO } from "@/types/report";

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
  createdAt: report.createdAt.toISOString()
});
