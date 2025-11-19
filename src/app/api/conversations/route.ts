import { NextResponse } from "next/server";

import { messageService } from "@/server/services/messageService";

export async function GET() {
  try {
    const conversations = await messageService.getConversations();
    
    return NextResponse.json({
      conversations: conversations.map(conv => ({
        phoneNumber: conv.phoneNumber,
        messageCount: conv.messageCount,
        lastMessage: {
          body: conv.lastMessage.body,
          direction: conv.lastMessage.direction,
          createdAt: conv.lastMessage.createdAt.toISOString()
        },
        messages: conv.messages.map(msg => {
          const reportId = (msg.metadata as any)?.reportId;
          const report = reportId ? conv.reports.get(reportId) : null;
          
          return {
            id: msg.id,
            direction: msg.direction,
            body: msg.body,
            createdAt: msg.createdAt.toISOString(),
            metadata: msg.metadata,
            // Include enhanced fields if available
            enhancedFields: report ? {
              extractedLocation: report.extractedLocation,
              extractedTime: report.extractedTime,
              incidentType: report.incidentType,
              severity: report.severity,
              actionNeeded: report.actionNeeded,
              summaryGenerated: report.summaryGenerated,
              sentiment: report.sentiment,
              sentimentScore: report.sentimentScore,
              sentimentKeywords: report.sentimentKeywords
            } : null
          };
        }),
        // Overall conversation sentiment
        conversationSentiment: conv.conversationSentiment
      }))
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ 
      error: "Failed to fetch conversations",
      conversations: [] 
    }, { status: 500 });
  }
}
