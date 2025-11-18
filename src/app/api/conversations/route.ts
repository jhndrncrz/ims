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
        messages: conv.messages.map(msg => ({
          id: msg.id,
          direction: msg.direction,
          body: msg.body,
          createdAt: msg.createdAt.toISOString(),
          metadata: msg.metadata
        }))
      }))
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
