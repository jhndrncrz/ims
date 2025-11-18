import { env } from "@/env";
import { alibabaLLM } from "@/lib/ai/alibabaLLM";
import { logger } from "@/lib/logger";
import { vectorStore } from "@/lib/rag/vector-store";

export type RagAnswer = {
  answer: string;
  confidence: number;
  references: Array<{ title: string; source: string }>;
};

export const ragEngine = {
  async answer(question: string): Promise<RagAnswer> {
    const results = await vectorStore.similaritySearch(question, 4);
    const context = results.map((result) => `Source: ${result.chunk.source}\n${result.chunk.content}`).join("\n\n");
    const topScore = results[0]?.score ?? 0;

    if (topScore < env.RAG_CONFIDENCE_FALLBACK) {
      logger.warn("Low confidence answer", { topScore });
      return {
        answer: "Please check with the barangay hall.",
        confidence: topScore,
        references: results.map((result) => ({ title: result.chunk.title, source: result.chunk.source }))
      };
    }

    const answer = await alibabaLLM.ask({ question, context });

    return {
      answer,
      confidence: topScore,
      references: results.map((result) => ({ title: result.chunk.title, source: result.chunk.source }))
    };
  }
};
