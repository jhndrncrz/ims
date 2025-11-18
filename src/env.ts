import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().nonempty().default("file:./dev.db"),
  ALIBABA_SMS_ACCESS_KEY_ID: z.string().optional(),
  ALIBABA_SMS_ACCESS_KEY_SECRET: z.string().optional(),
  ALIBABA_SMS_SIGN_NAME: z.string().optional(),
  ALIBABA_SMS_TEMPLATE_CODE: z.string().optional(),
  ALIBABA_DASHSCOPE_API_KEY: z.string().optional(),
  RAG_CONFIDENCE_FALLBACK: z.coerce.number().min(0).max(1).default(0.65),
  MESSENGER_PAGE_ACCESS_TOKEN: z.string().optional(),
  MESSENGER_VERIFY_TOKEN: z.string().optional(),
  MESSENGER_APP_SECRET: z.string().optional()
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  ALIBABA_SMS_ACCESS_KEY_ID: process.env.ALIBABA_SMS_ACCESS_KEY_ID,
  ALIBABA_SMS_ACCESS_KEY_SECRET: process.env.ALIBABA_SMS_ACCESS_KEY_SECRET,
  ALIBABA_SMS_SIGN_NAME: process.env.ALIBABA_SMS_SIGN_NAME,
  ALIBABA_SMS_TEMPLATE_CODE: process.env.ALIBABA_SMS_TEMPLATE_CODE,
  ALIBABA_DASHSCOPE_API_KEY: process.env.ALIBABA_DASHSCOPE_API_KEY,
  RAG_CONFIDENCE_FALLBACK: process.env.RAG_CONFIDENCE_FALLBACK,
  MESSENGER_PAGE_ACCESS_TOKEN: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
  MESSENGER_VERIFY_TOKEN: process.env.MESSENGER_VERIFY_TOKEN,
  MESSENGER_APP_SECRET: process.env.MESSENGER_APP_SECRET
});
