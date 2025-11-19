import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { smsProcessor } from "@/server/services/smsProcessor";

const messengerMessageSchema = z.object({
  object: z.literal("page"),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number(),
      messaging: z.array(
        z.object({
          sender: z.object({ id: z.string() }),
          recipient: z.object({ id: z.string() }),
          timestamp: z.number(),
          message: z
            .object({
              mid: z.string(),
              text: z.string().optional(),
              attachments: z.array(z.any()).optional()
            })
            .optional()
        })
      )
    })
  )
});

// Verify webhook for Facebook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Facebook sends this to verify the webhook
  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
    logger.info("Messenger webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Receive messages from Facebook Messenger
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const body = await request.text();

    // Verify request is from Facebook
    if (signature && process.env.MESSENGER_APP_SECRET) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", process.env.MESSENGER_APP_SECRET)
        .update(body)
        .digest("hex")}`;

      if (signature !== expectedSignature) {
        logger.warn("Invalid Messenger webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const data = messengerMessageSchema.parse(JSON.parse(body));

    // Process each messaging event
    for (const entry of data.entry) {
      for (const messagingEvent of entry.messaging) {
        if (messagingEvent.message?.text) {
          const senderId = messagingEvent.sender.id;
          const messageText = messagingEvent.message.text;

          logger.info("Received Messenger message", { senderId, messageText });

          // Process message through smsProcessor (reusing same logic)
          const result = await smsProcessor.handleIncoming({
            phoneNumber: `messenger:${senderId}`,
            message: messageText,
            skipSmsReply: false, // We'll send via Messenger instead
            channel: "MESSENGER"
          });

          // Send response back via Messenger
          if (process.env.MESSENGER_PAGE_ACCESS_TOKEN) {
            await sendMessengerMessage(senderId, result.reply);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error("Messenger webhook error", { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ status: "error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function sendMessengerMessage(recipientId: string, messageText: string) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.MESSENGER_PAGE_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error("Failed to send Messenger message", { error });
      throw new Error("Messenger send failed");
    }

    logger.info("Messenger message sent", { recipientId });
  } catch (error) {
    logger.error("Error sending Messenger message", { error });
    throw error;
  }
}
