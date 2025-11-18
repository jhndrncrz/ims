import { MessageDirection } from "@prisma/client";

import { prisma } from "@/server/db/client";

export const messageService = {
  log: async (input: { direction: MessageDirection; phoneNumber: string; body: string; responseId?: string; metadata?: Record<string, unknown> }) => {
    return prisma.messageLog.create({
      data: {
        direction: input.direction,
        phoneNumber: input.phoneNumber,
        body: input.body,
        responseId: input.responseId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: input.metadata as any
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

    // Convert to array and get latest message for each conversation
    return Object.entries(grouped).map(([phoneNumber, msgs]) => {
      const sorted = msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return {
        phoneNumber,
        messages: sorted,
        lastMessage: sorted[0],
        messageCount: msgs.length
      };
    }).sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }
};
