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
    const queryEmbedding = await buildEmbedding(query);
    const chunks = await prisma.documentChunk.findMany();
    
    type ScoredChunk = { chunk: DocumentChunk; score: number };
    const scored: ScoredChunk[] = chunks.map((chunk: DocumentChunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, parseEmbedding(chunk.embedding))
    }));
    
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
    logger.info(`Similarity search completed`, { 
      query: query.slice(0, 50), 
      topScore: sorted[0]?.score,
      results: sorted.length 
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
    } catch {
      // Fall through to default
    }
  }
  if (Array.isArray(value)) {
    return value;
  }
  logger.warn("Invalid embedding format, returning empty vector");
  return new Array(768).fill(0);
};
