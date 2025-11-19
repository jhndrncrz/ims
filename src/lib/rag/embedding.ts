import OpenAI from "openai";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { tokenize } from "@/lib/rag/tokenizer";

// Real vector embeddings using Alibaba Cloud DashScope (OpenAI-compatible API)
export type EmbeddingVector = number[];

// Generate embeddings using Alibaba Cloud DashScope via OpenAI SDK
export const buildEmbedding = async (text: string): Promise<EmbeddingVector> => {
  if (!env.ALIBABA_DASHSCOPE_API_KEY) {
    logger.warn("DashScope API key missing, using fallback TF-IDF embedding");
    return buildTfIdfEmbedding(text);
  }

  try {
    const client = new OpenAI({
      apiKey: env.ALIBABA_DASHSCOPE_API_KEY,
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    });

    const response = await client.embeddings.create({
      model: "text-embedding-v3",
      input: text.slice(0, 2048), // Limit to 2048 chars
      encoding_format: "float"
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      logger.warn("Invalid embedding response, using fallback");
      return buildTfIdfEmbedding(text);
    }

    return embedding;
  } catch (error) {
    logger.error("Error generating embedding", { error });
    return buildTfIdfEmbedding(text);
  }
};

// Fallback TF-IDF based embedding (normalized to 768 dimensions for consistency)
const buildTfIdfEmbedding = (text: string): number[] => {
  const tokens = tokenize(text);
  const counts: Record<string, number> = {};
  
  tokens.forEach((token) => {
    counts[token] = (counts[token] ?? 0) + 1;
  });
  
  // Convert to fixed-size vector (768 dimensions to match typical embeddings)
  const vector = new Array(768).fill(0);
  Object.entries(counts).forEach(([token, count]) => {
    const hash = simpleHash(token) % 768;
    vector[hash] += count;
  });
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(val => val / magnitude);
};

// Simple hash function for token distribution
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const cosineSimilarity = (a: EmbeddingVector, b: EmbeddingVector): number => {
  if (a.length !== b.length) {
    logger.warn("Embedding dimension mismatch", { aLen: a.length, bLen: b.length });
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / Math.sqrt(magA * magB);
};
