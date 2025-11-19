import OpenAI from "openai";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export type SentimentResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number; // 0.0 to 1.0 (confidence)
  keywords: string[]; // Key emotion words detected
};

// Initialize OpenAI client with Alibaba Cloud Model Studio endpoint
const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY || "dummy-key",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const SENTIMENT_ANALYSIS_PROMPT = `You are an expert at analyzing sentiment in Filipino barangay communications. Citizens send messages in mixed Tagalog/English with varying emotional tones.

Analyze the sentiment and emotional content of the message:

1. **sentiment**: Classify as POSITIVE, NEUTRAL, or NEGATIVE
   - POSITIVE: Gratitude, satisfaction, positive feedback, appreciation
   - NEUTRAL: Factual reports, inquiries, information requests without strong emotion
   - NEGATIVE: Complaints, frustration, anger, fear, distress, urgent problems

2. **score**: Confidence score from 0.0 to 1.0 (how certain are you of this classification?)

3. **keywords**: Array of key emotion words or phrases that indicate the sentiment (in the original language)

Examples:

Input: "Salamat po sa mabilis na aksyon sa dati kong report! Napakagaling ng inyong serbisyo"
Output: {
  "sentiment": "POSITIVE",
  "score": 0.95,
  "keywords": ["salamat", "mabilis na aksyon", "napakagaling", "serbisyo"]
}

Input: "May baha banda sa amin near barangay hall kanina 3pm"
Output: {
  "sentiment": "NEUTRAL",
  "score": 0.85,
  "keywords": ["baha", "report"]
}

Input: "GRABE NA YUNG INGAY NG KAPITBAHAY NAMIN! Paulit-ulit na pinapaalala pero ayaw makinig. Wala bang magawa ang barangay?!"
Output: {
  "sentiment": "NEGATIVE",
  "score": 0.92,
  "keywords": ["grabe", "ingay", "paulit-ulit", "ayaw makinig", "wala bang magawa"]
}

Input: "Paano po makakuha ng barangay clearance?"
Output: {
  "sentiment": "NEUTRAL",
  "score": 0.90,
  "keywords": ["inquiry", "clearance"]
}

Input: "Nakakatakot dito ngayon, may mga suspicious na tao na naglalakad sa gabi. Pwede po ba magpatrol ng tanod?"
Output: {
  "sentiment": "NEGATIVE",
  "score": 0.88,
  "keywords": ["nakakatakot", "suspicious", "request for help"]
}

Respond ONLY with valid JSON matching this exact structure.`;

/**
 * Fallback sentiment analysis using keyword matching
 */
const fallbackAnalyze = (message: string): SentimentResult => {
  const positiveWords = [
    "salamat", "thank", "maraming salamat", "napakagaling", "ok na", "solved", "resolved",
    "satisfied", "good", "great", "excellent", "appreciate", "mabuti", "ayos"
  ];

  const negativeWords = [
    "grabe", "sobra", "ayaw", "wala", "hindi", "disappointed", "bad", "angry", "galit",
    "nakakainis", "nakakagalit", "nakakatakot", "takot", "frustrated", "complaint",
    "reklamo", "paulit-ulit", "emergency", "urgent", "sucks", "pangit"
  ];

  const emotionalWords = [
    "ingay", "maingay", "baho", "dumi", "sira", "basura", "gulo", "away", "sunog",
    "aksidente", "baha", "putok", "dilim"
  ];

  const messageLower = message.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];

  // Count positive words
  for (const word of positiveWords) {
    if (messageLower.includes(word)) {
      positiveCount++;
      foundKeywords.push(word);
    }
  }

  // Count negative words
  for (const word of negativeWords) {
    if (messageLower.includes(word)) {
      negativeCount++;
      foundKeywords.push(word);
    }
  }

  // Count emotional/problem words
  for (const word of emotionalWords) {
    if (messageLower.includes(word)) {
      foundKeywords.push(word);
    }
  }

  // Check for all caps (often indicates strong emotion)
  const allCapsWords = message.match(/\b[A-Z]{3,}\b/g) || [];
  if (allCapsWords.length > 0) {
    negativeCount += allCapsWords.length;
    foundKeywords.push(...allCapsWords.map(w => w.toLowerCase()));
  }

  // Check for exclamation marks (often indicates strong emotion)
  const exclamationCount = (message.match(/!/g) || []).length;
  if (exclamationCount >= 2) {
    negativeCount += exclamationCount;
  }

  // Determine sentiment
  let sentiment: SentimentResult["sentiment"] = "NEUTRAL";
  let score = 0.6; // Default confidence for neutral

  if (positiveCount > negativeCount) {
    sentiment = "POSITIVE";
    score = Math.min(0.7 + (positiveCount * 0.1), 0.95);
  } else if (negativeCount > positiveCount) {
    sentiment = "NEGATIVE";
    score = Math.min(0.7 + (negativeCount * 0.1), 0.95);
  }

  // Deduplicate keywords
  const uniqueKeywords = Array.from(new Set(foundKeywords)).slice(0, 5);

  return {
    sentiment,
    score,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords : ["neutral report"]
  };
};

/**
 * Analyze the sentiment of a message
 */
export const analyzeSentiment = async (message: string): Promise<SentimentResult> => {
  if (!env.ALIBABA_DASHSCOPE_API_KEY) {
    logger.warn("DashScope API key missing, using fallback sentiment analysis");
    return fallbackAnalyze(message);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: SENTIMENT_ANALYSIS_PROMPT },
        { role: "user", content: `Analyze the sentiment of this message:\n\n"${message}"` }
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      logger.warn("Empty response from DashScope, using fallback");
      return fallbackAnalyze(message);
    }

    const parsed = JSON.parse(text) as SentimentResult;

    // Validate required fields
    if (!parsed.sentiment || typeof parsed.score !== "number" || !Array.isArray(parsed.keywords)) {
      logger.warn("Incomplete sentiment analysis from LLM, using fallback", { parsed });
      return fallbackAnalyze(message);
    }

    // Validate sentiment value
    const validSentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
    if (!validSentiments.includes(parsed.sentiment)) {
      logger.warn("Invalid sentiment from LLM", { sentiment: parsed.sentiment });
      parsed.sentiment = "NEUTRAL";
    }

    // Clamp score between 0 and 1
    if (parsed.score < 0 || parsed.score > 1) {
      logger.warn("Score out of range", { score: parsed.score });
      parsed.score = Math.max(0, Math.min(1, parsed.score));
    }

    // Ensure keywords is an array
    if (!Array.isArray(parsed.keywords)) {
      parsed.keywords = [];
    }

    logger.info("Successfully analyzed sentiment", { 
      sentiment: parsed.sentiment, 
      score: parsed.score,
      keywordCount: parsed.keywords.length
    });

    return parsed;
  } catch (error) {
    logger.error("Error in LLM-based sentiment analysis", { error });
    return fallbackAnalyze(message);
  }
};
