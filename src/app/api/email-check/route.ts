import { NextRequest, NextResponse } from "next/server";
import { emailReceiver } from "@/lib/email/receiver";
import { smsProcessor } from "@/server/services/smsProcessor";
import { logger } from "@/lib/logger";

// Manual trigger to check emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, user, password } = body;

    if (!host || !port || !user || !password) {
      return NextResponse.json({ error: "Missing email configuration" }, { status: 400 });
    }

    logger.info("Checking emails", { host, user });

    const emails = await emailReceiver.checkEmails({
      host,
      port,
      user,
      password,
      tls: true
    });

    logger.info(`Found ${emails.length} unread emails`);

    const processed = [];

    for (const email of emails) {
      // Extract sender email address
      const senderMatch = email.from.match(/<([^>]+)>/) || [null, email.from];
      const senderEmail = senderMatch[1] || email.from;

      // Process email content as a report/query
      const messageBody = `${email.subject}\n\n${email.text}`;

      const result = await smsProcessor.handleIncoming({
        phoneNumber: `email:${senderEmail}`,
        message: messageBody.trim(),
        skipSmsReply: true, // Don't send SMS, will send email reply
        channel: "EMAIL"
      });

      processed.push({
        from: senderEmail,
        subject: email.subject,
        type: result.type,
        reply: result.reply
      });

      // TODO: Send email reply back to sender
      logger.info("Email processed", { from: senderEmail, type: result.type });
    }

    return NextResponse.json({
      success: true,
      emailsProcessed: processed.length,
      emails: processed
    });
  } catch (error) {
    logger.error("Email check failed", { error });
    return NextResponse.json(
      { error: "Failed to check emails", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
