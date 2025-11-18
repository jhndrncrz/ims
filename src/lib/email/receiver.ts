import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { logger } from "@/lib/logger";

export type EmailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  tls?: boolean;
};

export type ProcessedEmail = {
  from: string;
  subject: string;
  text: string;
  html?: string;
  date?: Date;
};

export class EmailReceiver {
  private imap: Imap | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls ?? true,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.imap.once("ready", () => {
        logger.info("Email IMAP connection ready");
        resolve();
      });

      this.imap.once("error", (err: Error) => {
        logger.error("IMAP connection error", { error: err });
        reject(err);
      });

      this.imap.connect();
    });
  }

  async fetchUnreadEmails(inbox = "INBOX"): Promise<ProcessedEmail[]> {
    if (!this.imap) {
      throw new Error("IMAP not connected");
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox(inbox, false, (err) => {
        if (err) {
          logger.error("Failed to open inbox", { error: err });
          return reject(err);
        }

        // Search for unseen emails
        this.imap!.search(["UNSEEN"], (searchErr, results) => {
          if (searchErr) {
            logger.error("Email search failed", { error: searchErr });
            return reject(searchErr);
          }

          if (!results || results.length === 0) {
            logger.info("No unread emails found");
            return resolve([]);
          }

          logger.info(`Found ${results.length} unread emails`);

          const emails: ProcessedEmail[] = [];
          const fetch = this.imap!.fetch(results, { bodies: "" });

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              simpleParser(stream as any, (parseErr, parsed: ParsedMail) => {
                if (parseErr) {
                  logger.error("Email parse error", { error: parseErr });
                  return;
                }

                emails.push({
                  from: parsed.from?.text || "",
                  subject: parsed.subject || "",
                  text: parsed.text || "",
                  html: parsed.html ? String(parsed.html) : undefined,
                  date: parsed.date
                });
              });
            });

            msg.once("attributes", (attrs) => {
              // Mark as read after processing
              this.imap!.addFlags(attrs.uid, ["\\Seen"], (flagErr) => {
                if (flagErr) {
                  logger.error("Failed to mark email as seen", { error: flagErr });
                }
              });
            });
          });

          fetch.once("error", (fetchErr) => {
            logger.error("Fetch error", { error: fetchErr });
            reject(fetchErr);
          });

          fetch.once("end", () => {
            logger.info(`Processed ${emails.length} emails`);
            resolve(emails);
          });
        });
      });
    });
  }

  disconnect(): void {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
      logger.info("IMAP connection closed");
    }
  }
}

export const emailReceiver = {
  async checkEmails(config: EmailConfig): Promise<ProcessedEmail[]> {
    const receiver = new EmailReceiver(config);
    try {
      await receiver.connect();
      const emails = await receiver.fetchUnreadEmails();
      return emails;
    } finally {
      receiver.disconnect();
    }
  }
};
