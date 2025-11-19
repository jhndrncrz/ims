import { MessageDirection, ChannelType, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { analyzeSentiment } from "@/lib/ai/sentimentAnalyzer";
import { logger } from "@/lib/logger";

export const messageService = {
  log: async (input: { 
    direction: MessageDirection; 
    channel: ChannelType | string; 
    phoneNumber: string; 
    email?: string; 
    messengerId?: string; 
    body: string; 
    responseId?: string; 
    metadata?: Record<string, unknown> 
  }) => {
    return prisma.messageLog.create({
      data: {
        direction: input.direction,
        channel: input.channel as import("@prisma/client").ChannelType,
        phoneNumber: input.phoneNumber,
        email: input.email,
        messengerId: input.messengerId,
        body: input.body,
        responseId: input.responseId,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined
      }
    });
  },
  getConversations: async () => {
    const messages = await prisma.messageLog.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Group by phone number
    const grouped = messages.reduce((acc, msg) => {
      if (!acc[msg.phoneNumber]) {
        acc[msg.phoneNumber] = [];
      }
      acc[msg.phoneNumber].push(msg);
      return acc;
    }, {} as Record<string, typeof messages>);

    // Get cached sentiments for all conversations
    const phoneNumbers = Object.keys(grouped);
    const cachedSentiments = await prisma.conversationSentiment.findMany({
      where: { phoneNumber: { in: phoneNumbers } }
    });
    const sentimentMap = new Map(cachedSentiments.map(s => [s.phoneNumber, s]));

    // Convert to array and get latest message for each conversation
    const conversations = await Promise.all(
      Object.entries(grouped).map(async ([phoneNumber, msgs]) => {
        const sorted = msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Get report IDs from metadata
        const reportIds = sorted
          .map(msg => {
            const metadata = msg.metadata as { reportId?: string } | null;
            return metadata?.reportId;
          })
          .filter((id): id is string => Boolean(id));
        
        // Fetch associated reports with enhanced fields
        const reports = reportIds.length > 0 
          ? await prisma.report.findMany({
              where: { id: { in: reportIds } },
              select: {
                id: true,
                extractedLocation: true,
                extractedTime: true,
                incidentType: true,
                severity: true,
                actionNeeded: true,
                summaryGenerated: true,
                sentiment: true,
                sentimentScore: true,
                sentimentKeywords: true
              }
            })
          : [];
        
        const reportMap = new Map(reports.map(r => [r.id, r]));
        
        // Get cached sentiment if available
        const cachedSentiment = sentimentMap.get(phoneNumber);
        const conversationSentiment = cachedSentiment ? {
          sentiment: cachedSentiment.sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE",
          score: cachedSentiment.sentimentScore,
          keywords: cachedSentiment.sentimentKeywords as string[],
          summary: cachedSentiment.summary,
          lastAnalyzedAt: cachedSentiment.lastAnalyzedAt.toISOString()
        } : null;
        
        return {
          phoneNumber,
          messages: sorted,
          reports: reportMap,
          lastMessage: sorted[0],
          messageCount: msgs.length,
          conversationSentiment
        };
      })
    );
    
    return conversations.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  },

  analyzeConversationSentiment: async (phoneNumber: string) => {
    // Get all messages for this conversation
    const messages = await prisma.messageLog.findMany({
      where: { phoneNumber },
      orderBy: { createdAt: "asc" }
    });

    const inboundMessages = messages.filter(m => m.direction === "INBOUND");
    
    if (inboundMessages.length === 0) {
      return null;
    }

    const conversationText = inboundMessages.map(m => m.body).join(" ");
    const result = await analyzeSentiment(conversationText);

    // Generate conversation summary using OpenAI client
    let summary: string | null = null;
    try {
      const { OpenAI } = await import("openai");
      const { env } = await import("@/env");
      
      if (env.ALIBABA_DASHSCOPE_API_KEY) {
        const client = new OpenAI({
          apiKey: env.ALIBABA_DASHSCOPE_API_KEY,
          baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        });

        // Create a chronological summary of the conversation
        const conversationHistory = messages.map((m, i) => 
          `${i + 1}. [${m.direction}]: ${m.body}`
        ).join("\n");

        const completion = await client.chat.completions.create({
          model: "qwen-flash",
          messages: [
            {
              role: "system",
              content: "You are a barangay assistant summarizing citizen conversations. Provide a brief 2-3 sentence summary highlighting the main topics, concerns, and current status of the conversation."
            },
            {
              role: "user",
              content: `Summarize this conversation:\n\n${conversationHistory}`
            }
          ],
          temperature: 0.5,
          max_tokens: 200
        });

        summary = completion.choices[0]?.message?.content?.trim() || null;
      }
    } catch (error) {
      logger.error("Failed to generate conversation summary", { error });
      // Continue without summary
    }

    // Store in database
    await prisma.conversationSentiment.upsert({
      where: { phoneNumber },
      create: {
        phoneNumber,
        sentiment: result.sentiment,
        sentimentScore: result.score,
        sentimentKeywords: result.keywords as Prisma.InputJsonValue,
        summary,
        messageCount: inboundMessages.length
      },
      update: {
        sentiment: result.sentiment,
        sentimentScore: result.score,
        sentimentKeywords: result.keywords as Prisma.InputJsonValue,
        summary,
        messageCount: inboundMessages.length,
        lastAnalyzedAt: new Date()
      }
    });

    return {
      sentiment: result.sentiment,
      score: result.score,
      keywords: result.keywords,
      summary,
      lastAnalyzedAt: new Date().toISOString()
    };
  }
};
