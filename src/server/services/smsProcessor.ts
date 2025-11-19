import { MessageDirection } from "@prisma/client";

import { env } from "@/env";
import { formatPhone } from "@/lib/formatters";
import { logger } from "@/lib/logger";
import { classifyReport } from "@/lib/reporting/classifier";
import { ragEngine } from "@/lib/rag/engine";
import { smsClient } from "@/lib/sms/alibabaSms";
import { messageService } from "@/server/services/messageService";
import { reportService } from "@/server/services/reportService";

const REPORT_TRIGGER = /(report|busted|broken|incident|baha|flood|streetlight|sira)/i;

export type SmsProcessResult =
  | {
      type: "report";
      reply: string;
      reportId: string;
      confidence: number;
    }
  | {
      type: "info";
      reply: string;
      confidence: number;
    };

export const smsProcessor = {
  async handleIncoming(input: { phoneNumber: string; message: string; skipSmsReply?: boolean; channel?: string }): Promise<SmsProcessResult> {
    const normalizedPhone = formatPhone(input.phoneNumber);
    const channel = input.channel || "SMS";
    
    await messageService.log({
      direction: MessageDirection.INBOUND,
      channel,
      phoneNumber: normalizedPhone,
      body: input.message
    });

    const isReport = REPORT_TRIGGER.test(input.message);

    if (isReport) {
      const classification = await classifyReport(input.message);
      const ackMessage =
        "Salamat! Naitala ang ulat mo. Susubaybayan ito ng barangay team. Mga tanong? Sagutin lang ang SMS na ito.";

      const report = await reportService.create({
        phoneNumber: normalizedPhone,
        message: input.message,
        category: classification.category,
        priority: classification.priority,
        aiReply: ackMessage,
        confidence: classification.confidence
      });

      if (!input.skipSmsReply) {
        await safeSmsSend(normalizedPhone, ackMessage);
      }

      await messageService.log({
        direction: MessageDirection.OUTBOUND,
        channel,
        phoneNumber: normalizedPhone,
        body: ackMessage,
        metadata: { reportId: report.id }
      });

      return { type: "report", reply: ackMessage, reportId: report.id, confidence: classification.confidence };
    }

    const ragAnswer = await ragEngine.answer(input.message);

    if (!input.skipSmsReply) {
      await safeSmsSend(normalizedPhone, ragAnswer.answer);
    }

    await messageService.log({
      direction: MessageDirection.OUTBOUND,
      channel,
      phoneNumber: normalizedPhone,
      body: ragAnswer.answer,
      metadata: { references: ragAnswer.references }
    });

    return { type: "info", reply: ragAnswer.answer, confidence: ragAnswer.confidence };
  }
};

const safeSmsSend = async (phone: string, message: string) => {
  try {
    await smsClient.send({ phoneNumber: phone, message });
  } catch (error) {
    logger.error("Failed to send SMS", { error });
    if (env.NODE_ENV === "development") {
      logger.info("SMS fallback message", { phone, message });
    }
  }
};
