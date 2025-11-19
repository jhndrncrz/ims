import OpenAI from "openai";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Report } from "@prisma/client";

export interface RecommendationResult {
  recommendations: string[];
  urgencyLevel: "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW";
  suggestedActions: string[];
  estimatedResolutionTime: string;
  requiredResources: string[];
}

// Initialize OpenAI client with Alibaba Cloud Model Studio endpoint
const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY || "dummy-key",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const RECOMMENDATION_PROMPT = `You are an expert barangay administrator providing actionable recommendations for incident reports.

Based on the incident details, provide:
1. Specific action recommendations (3-5 items)
2. Urgency level (IMMEDIATE/URGENT/MODERATE/LOW)
3. Suggested immediate actions (2-3 items)
4. Estimated resolution time
5. Required resources or departments

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "urgencyLevel": "URGENT",
  "suggestedActions": ["action 1", "action 2"],
  "estimatedResolutionTime": "2-5 days",
  "requiredResources": ["resource 1", "resource 2"]
}`;

export class RecommendationService {
  /**
   * Generate AI recommendations for a report
   */
  async generateRecommendations(report: Report): Promise<RecommendationResult> {
    const context = this.buildContext(report);
    
    // If no API key, return fallback immediately
    if (!env.ALIBABA_DASHSCOPE_API_KEY) {
      logger.warn("🔴 No API key, using fallback recommendations");
      return this.getFallbackRecommendations(report);
    }
    
    try {
      logger.info("📊 Generating AI recommendations", {
        category: report.category,
        severity: report.severity,
        priority: report.priority
      });

      const completion = await client.chat.completions.create({
        model: "qwen-plus",
        messages: [
          { role: "system", content: RECOMMENDATION_PROMPT },
          { role: "user", content: `Incident Report:\n${context}\n\nProvide recommendations in JSON format.` }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        logger.warn("🔴 Empty response from LLM, using fallback");
        return this.getFallbackRecommendations(report);
      }

      // Parse and validate response
      const parsed = JSON.parse(response);
      logger.info("✅ AI recommendations generated successfully");
      return this.validateAndNormalize(parsed);
    } catch (error) {
      logger.error("❌ Failed to generate AI recommendations", {
        error: error instanceof Error ? error.message : String(error)
      });
      return this.getFallbackRecommendations(report);
    }
  }

  /**
   * Build context string from report
   */
  private buildContext(report: Report): string {
    const parts: string[] = [];
    
    parts.push(`Category: ${report.category}`);
    parts.push(`Priority: ${report.priority}`);
    parts.push(`Message: ${report.message}`);
    
    if (report.extractedLocation) {
      parts.push(`Location: ${report.extractedLocation}`);
    }
    
    if (report.extractedTime) {
      parts.push(`Time: ${report.extractedTime}`);
    }
    
    if (report.incidentType) {
      parts.push(`Type: ${report.incidentType}`);
    }
    
    if (report.severity) {
      parts.push(`Severity: ${report.severity}`);
    }
    
    if (report.sentiment) {
      parts.push(`Sentiment: ${report.sentiment} (${((report.sentimentScore || 0) * 100).toFixed(0)}%)`);
    }
    
    return parts.join("\n");
  }

  /**
   * Validate and normalize AI response
   */
  private validateAndNormalize(data: unknown): RecommendationResult {
    const result = data as Partial<RecommendationResult>;
    
    return {
      recommendations: Array.isArray(result.recommendations) 
        ? result.recommendations.slice(0, 5) 
        : ["Review incident details and assess situation"],
      urgencyLevel: this.normalizeUrgency(result.urgencyLevel),
      suggestedActions: Array.isArray(result.suggestedActions)
        ? result.suggestedActions.slice(0, 3)
        : ["Contact relevant authorities", "Document incident details"],
      estimatedResolutionTime: result.estimatedResolutionTime || "To be determined",
      requiredResources: Array.isArray(result.requiredResources)
        ? result.requiredResources
        : []
    };
  }

  /**
   * Normalize urgency level
   */
  private normalizeUrgency(level?: string): "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW" {
    const normalized = (level || "").toUpperCase();
    if (["IMMEDIATE", "URGENT", "MODERATE", "LOW"].includes(normalized)) {
      return normalized as "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW";
    }
    return "MODERATE";
  }

  /**
   * Get fallback recommendations when AI fails
   */
  private getFallbackRecommendations(report: Report): RecommendationResult {
    const recommendations: string[] = [];
    const suggestedActions: string[] = [];
    let urgencyLevel: "IMMEDIATE" | "URGENT" | "MODERATE" | "LOW" = "MODERATE";
    const requiredResources: string[] = [];

    // Category-based recommendations
    switch (report.category) {
      case "DISASTER":
        recommendations.push(
          "Assess damage and safety risks immediately",
          "Evacuate affected residents if necessary",
          "Coordinate with MDRRMO and emergency services",
          "Set up temporary shelter if needed"
        );
        suggestedActions.push(
          "Contact disaster response team",
          "Conduct safety assessment"
        );
        urgencyLevel = report.severity === "CRITICAL" ? "IMMEDIATE" : "URGENT";
        requiredResources.push("MDRRMO", "Emergency Services", "Medical Team");
        break;

      case "INFRASTRUCTURE":
        recommendations.push(
          "Inspect and document the infrastructure issue",
          "Determine if immediate repairs are needed",
          "Coordinate with municipal engineering office",
          "Set up warning signs if hazardous"
        );
        suggestedActions.push(
          "Schedule site inspection",
          "Contact engineering department"
        );
        urgencyLevel = report.severity === "CRITICAL" ? "URGENT" : "MODERATE";
        requiredResources.push("Engineering Office", "Public Works");
        break;

      case "ADMIN":
        recommendations.push(
          "Review administrative requirements",
          "Process documents according to protocol",
          "Schedule appointment with concerned office"
        );
        suggestedActions.push(
          "Verify requirements",
          "Schedule processing"
        );
        urgencyLevel = "LOW";
        requiredResources.push("Administrative Staff");
        break;

      default:
        recommendations.push(
          "Review incident details thoroughly",
          "Assess priority and resource requirements",
          "Coordinate with appropriate departments"
        );
        suggestedActions.push(
          "Conduct initial assessment",
          "Determine response protocol"
        );
    }

    // Severity-based urgency override
    if (report.severity === "CRITICAL") {
      urgencyLevel = "IMMEDIATE";
    } else if (report.severity === "HIGH" && urgencyLevel === "MODERATE") {
      urgencyLevel = "URGENT";
    }

    return {
      recommendations,
      urgencyLevel,
      suggestedActions,
      estimatedResolutionTime: this.estimateResolutionTime(report),
      requiredResources
    };
  }

  /**
   * Estimate resolution time based on category and severity
   */
  private estimateResolutionTime(report: Report): string {
    if (report.severity === "CRITICAL") {
      return "24-48 hours";
    } else if (report.severity === "HIGH") {
      return "2-5 days";
    } else if (report.category === "DISASTER") {
      return "1-2 weeks";
    } else if (report.category === "INFRASTRUCTURE") {
      return "1-3 weeks";
    } else {
      return "3-7 days";
    }
  }

  /**
   * Get urgency color for UI
   */
  getUrgencyColor(level: string): string {
    switch (level) {
      case "IMMEDIATE": return "red";
      case "URGENT": return "orange";
      case "MODERATE": return "yellow";
      case "LOW": return "green";
      default: return "gray";
    }
  }
}

export const recommendationService = new RecommendationService();
