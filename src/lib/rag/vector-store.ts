import { prisma } from "@/server/db/client";
import { buildEmbedding, cosineSimilarity, EmbeddingVector } from "@/lib/rag/embedding";
import { DocumentChunk } from "@prisma/client";
import { logger } from "@/lib/logger";

export type ChunkInput = {
  title: string;
  source: string;
  content: string;
  tags?: string[];
};

// Split text into chunks for better embedding quality
const chunkText = (text: string, maxChunkSize = 500): string[] => {
  const sentences = text.split(/[.!?]\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
};

export const vectorStore = {
  async upsertChunk(chunk: ChunkInput) {
    // Split long documents into smaller chunks
    const textChunks = chunkText(chunk.content);
    logger.info(`Splitting document into ${textChunks.length} chunks`, { source: chunk.source });

    const created = [];
    for (let i = 0; i < textChunks.length; i++) {
      const chunkContent = textChunks[i];
      const embedding = await buildEmbedding(chunkContent);
      
      const result = await prisma.documentChunk.create({
        data: {
          title: `${chunk.title}${textChunks.length > 1 ? ` (Part ${i + 1})` : ""}`,
          source: chunk.source,
          content: chunkContent,
          embedding: JSON.stringify(embedding),
          tags: chunk.tags ? chunk.tags : undefined
        }
      });
      created.push(result);
    }

    return created[0]; // Return first chunk for compatibility
  },

  async similaritySearch(query: string, limit = 4) {
    logger.info("🔍 Starting similarity search", { query: query.slice(0, 50), limit });
    
    const queryEmbedding = await buildEmbedding(query);
    logger.info("📐 Query embedding generated", { dimensions: queryEmbedding.length });
    
    const chunks = await prisma.documentChunk.findMany();
    logger.info("📚 Retrieved chunks from database", { totalChunks: chunks.length });
    
    if (chunks.length === 0) {
      logger.warn("⚠️ No chunks found in database! Please run: pnpm rag:ingest");
      return [];
    }
    
    type ScoredChunk = { chunk: DocumentChunk; score: number };
    const scored: ScoredChunk[] = chunks.map((chunk: DocumentChunk) => {
      const chunkEmbedding = parseEmbedding(chunk.embedding);
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { chunk, score };
    });
    
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
    
    logger.info(`✅ Similarity search completed`, { 
      query: query.slice(0, 50), 
      topScore: sorted[0]?.score,
      allScores: sorted.map(s => ({ title: s.chunk.title, score: s.score.toFixed(4) })),
      results: sorted.length,
      queryEmbedDim: queryEmbedding.length,
      firstChunkEmbedDim: sorted[0] ? parseEmbedding(sorted[0].chunk.embedding).length : 0
    });
    
    return sorted;
  }
};

const parseEmbedding = (value: unknown): EmbeddingVector => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      logger.error("Failed to parse embedding JSON", { error, valuePreview: String(value).slice(0, 100) });
    }
  }
  if (Array.isArray(value)) {
    return value;
  }
  logger.warn("⚠️ Invalid embedding format, returning empty 1024-dim vector", {
    valueType: typeof value,
    isArray: Array.isArray(value)
  });
  // Return 1024 dimensions to match text-embedding-v3
  return new Array(1024).fill(0);
};
