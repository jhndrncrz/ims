import { ReportCategory, ReportPriority, ReportStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { extractFields } from "@/lib/reporting/enhancedClassifier";
import { analyzeSentiment } from "@/lib/ai/sentimentAnalyzer";
import { logger } from "@/lib/logger";

export const reportService = {
  list: async () => {
    return prisma.report.findMany({
      orderBy: { createdAt: "desc" }
    });
  },
  findById: async (id: string) => {
    return prisma.report.findUnique({
      where: { id }
    });
  },
  create: async (input: {
    phoneNumber: string;
    message: string;
    category: ReportCategory;
    priority?: ReportPriority;
    status?: ReportStatus;
    aiReply?: string;
    confidence?: number;
    source?: string;
    attachmentsUri?: string;
  }) => {
    return prisma.report.create({
      data: {
        phoneNumber: input.phoneNumber,
        message: input.message,
        category: input.category,
        priority: input.priority ?? "LOW",
        status: input.status ?? "OPEN",
        aiReply: input.aiReply,
        confidence: input.confidence,
        source: input.source ?? "sms",
        attachmentsUri: input.attachmentsUri
      }
    });
  },
  
  /**
   * Create a report with enhanced field extraction and sentiment analysis
   */
  createWithEnhancement: async (input: {
    phoneNumber: string;
    message: string;
    category: ReportCategory;
    priority?: ReportPriority;
    status?: ReportStatus;
    aiReply?: string;
    confidence?: number;
    source?: string;
    attachmentsUri?: string;
  }) => {
    try {
      // Run field extraction and sentiment analysis in parallel
      const [extractedFields, sentimentResult] = await Promise.all([
        extractFields(input.message),
        analyzeSentiment(input.message)
      ]);

      logger.info("Enhanced report creation", {
        phoneNumber: input.phoneNumber,
        extractedLocation: extractedFields.location,
        extractedSeverity: extractedFields.severity,
        sentiment: sentimentResult.sentiment,
        sentimentScore: sentimentResult.score
      });

      // Create report with all extracted data
      return prisma.report.create({
        data: {
          phoneNumber: input.phoneNumber,
          message: input.message,
          category: input.category,
          priority: input.priority ?? "LOW",
          status: input.status ?? "OPEN",
          aiReply: input.aiReply,
          confidence: input.confidence,
          source: input.source ?? "sms",
          attachmentsUri: input.attachmentsUri,
          
          // Enhanced extraction fields
          extractedLocation: extractedFields.location,
          extractedTime: extractedFields.time,
          incidentType: extractedFields.incidentType,
          severity: extractedFields.severity,
          actionNeeded: extractedFields.actionNeeded,
          extractedEntities: extractedFields.entities as Prisma.JsonObject,
          summaryGenerated: extractedFields.summary,
          
          // Sentiment analysis fields
          sentiment: sentimentResult.sentiment,
          sentimentScore: sentimentResult.score,
          sentimentKeywords: sentimentResult.keywords as Prisma.JsonArray
        }
      });
    } catch (error) {
      logger.error("Error creating enhanced report, falling back to basic creation", { error });
      
      // Fallback to basic creation if enhancement fails
      return prisma.report.create({
        data: {
          phoneNumber: input.phoneNumber,
          message: input.message,
          category: input.category,
          priority: input.priority ?? "LOW",
          status: input.status ?? "OPEN",
          aiReply: input.aiReply,
          confidence: input.confidence,
          source: input.source ?? "sms",
          attachmentsUri: input.attachmentsUri
        }
      });
    }
  },
  
  update: async (id: string, input: {
    status?: ReportStatus;
    category?: ReportCategory;
    priority?: ReportPriority;
    resolution?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    addedToKnowledge?: boolean;
  }) => {
    return prisma.report.update({
      where: { id },
      data: input
    });
  }
};
