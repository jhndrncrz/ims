import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { voiceToText } from "@/lib/ai/voiceToText";
import { smsProcessor } from "@/server/services/smsProcessor";
import { logger } from "@/lib/logger";

const voiceMessageSchema = z.object({
  phoneNumber: z.string().min(8),
  audioBase64: z.string().min(1),
  format: z.enum(["pcm", "wav", "mp3", "opus"]).optional(),
  skipSmsReply: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = voiceMessageSchema.parse(body);

    logger.info("Received voice message", { phoneNumber: data.phoneNumber, format: data.format });

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(data.audioBase64, "base64");

    // Transcribe audio to text
    const transcribedText = await voiceToText.transcribe({
      audioBuffer,
      format: data.format || "wav",
      sampleRate: 16000,
      language: "zh-CN" // Filipino/Tagalog might need custom model, using Chinese as proxy
    });

    logger.info("Voice transcribed", { phoneNumber: data.phoneNumber, text: transcribedText });

    // Process transcribed text as regular message
    const result = await smsProcessor.handleIncoming({
      phoneNumber: data.phoneNumber,
      message: transcribedText,
      skipSmsReply: data.skipSmsReply
    });

    return NextResponse.json({
      success: true,
      transcription: transcribedText,
      result
    });
  } catch (error) {
    logger.error("Voice message processing failed", { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Voice processing failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
