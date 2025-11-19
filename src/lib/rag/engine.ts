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
    logger.info("🔍 RAG Query Started", { question: question.slice(0, 100) });
    
    const results = await vectorStore.similaritySearch(question, 4);
    const context = results.map((result) => `Source: ${result.chunk.source}\n${result.chunk.content}`).join("\n\n");
    const topScore = results[0]?.score ?? 0;
    
    logger.info("📊 RAG Similarity Results", {
      topScore,
      threshold: env.RAG_CONFIDENCE_FALLBACK,
      numResults: results.length,
      scores: results.map(r => r.score),
      willUseLLM: topScore >= env.RAG_CONFIDENCE_FALLBACK
    });

    if (topScore < env.RAG_CONFIDENCE_FALLBACK) {
      logger.warn("🔴 RAG: Low confidence, returning fallback message", { 
        topScore,
        threshold: env.RAG_CONFIDENCE_FALLBACK,
        gap: env.RAG_CONFIDENCE_FALLBACK - topScore,
        question: question.slice(0, 50)
      });
      return {
        answer: "Please check with the barangay hall.",
        confidence: topScore,
        references: results.map((result) => ({ title: result.chunk.title, source: result.chunk.source }))
      };
    }

    logger.info("✅ RAG: Confidence above threshold, calling LLM", { topScore });
    const answer = await alibabaLLM.ask({ question, context });

    logger.info("✅ RAG: Answer generated successfully", { 
      answerLength: answer.length,
      confidence: topScore
    });

    return {
      answer,
      confidence: topScore,
      references: results.map((result) => ({ title: result.chunk.title, source: result.chunk.source }))
    };
  }
};
