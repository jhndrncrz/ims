import OpenAI from "openai";
import { ReportCategory, ReportPriority } from "@prisma/client";
import { env } from "@/env";
import { logger } from "@/lib/logger";

type ClassificationResult = {
  category: ReportCategory;
  priority: ReportPriority;
  confidence: number;
};

// Initialize OpenAI client with Alibaba Cloud Model Studio endpoint
const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY || "dummy-key",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const CLASSIFICATION_PROMPT = `You are a barangay report classifier. Analyze citizen reports and classify them accurately.

Categories:
- DISASTER: Natural disasters, floods, earthquakes, fires, storms
- INFRASTRUCTURE: Broken streetlights, damaged roads, water/power issues
- ADMIN: Document requests, permits, clearances, complaints
- OTHER: Anything that doesn't fit the above categories

Priority Levels:
- HIGH: Immediate danger, disasters, emergencies
- MEDIUM: Infrastructure problems, quality of life issues
- LOW: Administrative requests, minor concerns

Respond ONLY with valid JSON in this exact format:
{"category": "DISASTER|INFRASTRUCTURE|ADMIN|OTHER", "priority": "HIGH|MEDIUM|LOW", "confidence": 0.9}`;

const fallbackClassify = (message: string): ClassificationResult => {
  const rules: Array<{
    match: RegExp;
    category: ReportCategory;
    priority: ReportPriority;
  }> = [
    { match: /(flood|baha|overflow|rain|storm|earthquake|lindol|fire|sunog)/i, category: "DISASTER", priority: "HIGH" },
    { match: /(streetlight|ilaw|poste|power|electric|kuryente|tulay|bridge|kalsada|road)/i, category: "INFRASTRUCTURE", priority: "MEDIUM" },
    { match: /(clearance|document|permit|id|barangay id|certificate)/i, category: "ADMIN", priority: "LOW" }
  ];

  const rule = rules.find((entry) => entry.match.test(message));
  if (rule) {
    return { category: rule.category, priority: rule.priority, confidence: 0.7 };
  }
  return { category: "OTHER", priority: "LOW", confidence: 0.4 };
};

export const classifyReport = async (message: string): Promise<ClassificationResult> => {
  if (!env.ALIBABA_DASHSCOPE_API_KEY) {
    logger.warn("DashScope API key missing, using fallback classifier");
    return fallbackClassify(message);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: CLASSIFICATION_PROMPT },
        { role: "user", content: `Report: "${message}"` }
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      logger.warn("Empty response from DashScope, using fallback");
      return fallbackClassify(message);
    }

    const parsed = JSON.parse(text) as { category: string; priority: string; confidence: number };

    // Validate the parsed result
    const validCategories = ["DISASTER", "INFRASTRUCTURE", "ADMIN", "OTHER"];
    const validPriorities = ["HIGH", "MEDIUM", "LOW"];

    if (!validCategories.includes(parsed.category) || !validPriorities.includes(parsed.priority)) {
      logger.warn("Invalid classification from LLM, using fallback", { parsed });
      return fallbackClassify(message);
    }

    return {
      category: parsed.category as ReportCategory,
      priority: parsed.priority as ReportPriority,
      confidence: parsed.confidence || 0.85
    };
  } catch (error) {
    logger.error("Error in LLM-based classification", { error });
    return fallbackClassify(message);
  }
};
