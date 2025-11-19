import { Report } from "@prisma/client";
import { ExportOptions } from "@/types/templates";

export class JSONExportService {
  /**
   * Export report as structured JSON
   */
  exportReport(report: Report, options: ExportOptions = {}): string {
    const data: Record<string, unknown> = {
      reportInfo: {
        id: report.id,
        dateReported: report.createdAt.toISOString(),
        status: report.status,
        priority: report.priority,
        category: report.category,
        source: report.source,
        channel: report.channel,
        confidence: report.confidence,
      },
      contact: {
        phoneNumber: report.phoneNumber,
      },
      incident: {
        message: report.message,
        location: report.extractedLocation || null,
        dateTime: report.extractedTime || null,
        type: report.incidentType || null,
        severity: report.severity || null,
      },
      response: {
        aiReply: report.aiReply || null,
        actionNeeded: report.actionNeeded || null,
        resolution: report.resolution || null,
        resolvedBy: report.resolvedBy || null,
        resolvedAt: report.resolvedAt?.toISOString() || null,
      },
      metadata: {
        addedToKnowledge: report.addedToKnowledge,
        attachmentsUri: report.attachmentsUri || null,
        updatedAt: report.updatedAt.toISOString(),
      },
    };

    // Include enhanced fields if requested
    if (options.includeEnhancedFields) {
      data.enhancedAnalysis = {
        extractedEntities: report.extractedEntities || null,
        summaryGenerated: report.summaryGenerated || null,
        sentiment: report.sentiment || null,
        sentimentScore: report.sentimentScore || null,
        sentimentKeywords: report.sentimentKeywords || null,
      };
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export multiple reports
   */
  exportReports(reports: Report[], options: ExportOptions = {}): string {
    const data = {
      exportDate: new Date().toISOString(),
      totalReports: reports.length,
      reports: reports.map((report) => JSON.parse(this.exportReport(report, options))),
    };

    return JSON.stringify(data, null, 2);
  }
}

export const jsonExportService = new JSONExportService();
