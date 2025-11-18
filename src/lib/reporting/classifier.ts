import { ReportCategory, ReportPriority } from "@prisma/client";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const DASH_SCOPE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

type ClassificationResult = {
  category: ReportCategory;
  priority: ReportPriority;
  confidence: number;
};

const buildClassificationPrompt = (message: string) => `You are a barangay report classifier. Analyze the following citizen report and classify it.

Report: "${message}"

Classify this report into one of these categories:
- DISASTER: Natural disasters, floods, earthquakes, fires, storms
- INFRASTRUCTURE: Broken streetlights, damaged roads, water/power issues
- ADMIN: Document requests, permits, clearances, complaints
- OTHER: Anything that doesn't fit the above categories

Also assign a priority:
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
    const response = await fetch(DASH_SCOPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        input: { prompt: buildClassificationPrompt(message) },
        model: "qwen-plus",
        parameters: {
          result_format: "text"
        }
      })
    });

    if (!response.ok) {
      logger.error("DashScope classification request failed", { status: response.status });
      return fallbackClassify(message);
    }

    const json = (await response.json()) as { output?: { text?: string } };
    const text = json.output?.text?.trim();

    if (!text) {
      logger.warn("Empty response from DashScope, using fallback");
      return fallbackClassify(message);
    }

    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("No JSON found in DashScope response, using fallback");
      return fallbackClassify(message);
    }

    const parsed = JSON.parse(jsonMatch[0]) as { category: string; priority: string; confidence: number };

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
