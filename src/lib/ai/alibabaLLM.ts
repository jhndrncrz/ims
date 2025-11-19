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
      logger.warn("DashScope API key missing, using fallback answer");
      return fallbackAnswer(payload);
    }

    try {
      const completion = await client.chat.completions.create({
        model: "qwen-plus",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Context:\n${payload.context}\n\nQuestion: ${payload.question}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const answer = completion.choices[0]?.message?.content?.trim();
      
      if (!answer) {
        logger.warn("Empty response from DashScope");
        return fallbackAnswer(payload);
      }

      return answer;
    } catch (error) {
      logger.error("DashScope error", { error });
      return fallbackAnswer(payload);
    }
  }
};
