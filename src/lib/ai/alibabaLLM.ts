import OpenAI from "openai";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export type LLMRequest = {
  question: string;
  context: string;
};

// Initialize OpenAI client with Alibaba Cloud Model Studio endpoint
const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY || "dummy-key",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const SYSTEM_PROMPT = `You are Barangay AI SMS Hub, a factual Filipino barangay assistant.
Use only the context provided to answer questions. If the answer is not in the context or you are unsure, say: "Please check with the barangay hall."
Answer in two short paragraphs, be concise and helpful.`;

const fallbackAnswer = ({ question, context }: LLMRequest) => {
  if (!context.trim()) {
    return "Please check with the barangay hall.";
  }
  const snippet = context.split("\n").slice(0, 4).join(" ");
  return `Regarding "${question}": ${snippet}\n\nFor more details, please confirm with the barangay hall.`;
};

export const alibabaLLM = {
  async ask(payload: LLMRequest) {
    if (!env.ALIBABA_DASHSCOPE_API_KEY) {
      logger.warn("🔴 FALLBACK: DashScope API key missing, using fallback answer", {
        questionPreview: payload.question.slice(0, 50)
      });
      return fallbackAnswer(payload);
    }

    try {
      const completion = await client.chat.completions.create({
        model: "qwen-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Context:\n${payload.context}\n\nQuestion: ${payload.question}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const answer = completion.choices[0]?.message?.content?.trim();
      
      if (!answer) {
        logger.warn("🔴 FALLBACK: Empty response from DashScope LLM", {
          questionPreview: payload.question.slice(0, 50)
        });
        return fallbackAnswer(payload);
      }

      logger.info("✅ LLM API call successful", {
        model: "qwen-plus",
        questionLength: payload.question.length,
        contextLength: payload.context.length,
        answerLength: answer.length,
        questionPreview: payload.question.slice(0, 50)
      });

      return answer;
    } catch (error) {
      logger.error("🔴 FALLBACK: DashScope LLM error", { 
        error: error instanceof Error ? error.message : String(error),
        errorDetails: error,
        questionPreview: payload.question.slice(0, 50)
      });
      return fallbackAnswer(payload);
    }
  }
};
