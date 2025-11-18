import { ReportCategory, ReportPriority, ReportStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";

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
