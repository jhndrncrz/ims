import { env } from "@/env";
import { logger } from "@/lib/logger";

export type LLMRequest = {
  question: string;
  context: string;
};

const DASH_SCOPE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

const buildPrompt = ({ question, context }: LLMRequest) => `You are Barangay AI SMS Hub, a factual Filipino barangay assistant.
Use only the context below. If unsure, say: "Please check with the barangay hall."

Context:
${context}

Question: ${question}
Answer in two short paragraphs.`;

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
      const response = await fetch(DASH_SCOPE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`
        },
        body: JSON.stringify({
          input: { prompt: buildPrompt(payload) },
          model: "qwen-plus"
        })
      });

      if (!response.ok) {
        logger.error("DashScope request failed", { status: response.status, statusText: response.statusText });
        return fallbackAnswer(payload);
      }

      const json = (await response.json()) as { output?: { text?: string } };
      return json.output?.text?.trim() || fallbackAnswer(payload);
    } catch (error) {
      logger.error("DashScope error", { error });
      return fallbackAnswer(payload);
    }
  }
};
