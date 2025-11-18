import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { smsProcessor } from "@/server/services/smsProcessor";

const smsSchema = z.object({
  phoneNumber: z.string().min(8),
  message: z.string().min(1),
  skipSmsReply: z.coerce.boolean().optional()
});

const parseBody = async (request: NextRequest) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
};

export async function POST(request: NextRequest) {
  try {
    const payload = smsSchema.parse(await parseBody(request));
    const result = await smsProcessor.handleIncoming({
      phoneNumber: payload.phoneNumber,
      message: payload.message,
      skipSmsReply: payload.skipSmsReply
    });

    return NextResponse.json({ status: "ok", result });
  } catch (error) {
    logger.error("SMS webhook failure", { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ status: "error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ status: "error", message: "Unexpected failure" }, { status: 500 });
  }
}
