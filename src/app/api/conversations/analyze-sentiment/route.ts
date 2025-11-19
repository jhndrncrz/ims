import { NextRequest, NextResponse } from "next/server";

import { messageService } from "@/server/services/messageService";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const result = await messageService.analyzeConversationSentiment(phoneNumber);

    if (!result) {
      return NextResponse.json({ error: "No inbound messages found" }, { status: 404 });
    }

    return NextResponse.json({ sentiment: result });
  } catch (error) {
    console.error("Failed to analyze conversation sentiment:", error);
    return NextResponse.json({ error: "Failed to analyze sentiment" }, { status: 500 });
  }
}
