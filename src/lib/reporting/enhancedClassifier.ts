import OpenAI from "openai";
import { env } from "@/env";
import { logger } from "@/lib/logger";

export type ExtractedFields = {
  location: string;
  time: string;
  incidentType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  actionNeeded: string;
  entities: {
    people: string[];
    places: string[];
  };
  summary: string;
};

// Initialize OpenAI client with Alibaba Cloud Model Studio endpoint
const client = new OpenAI({
  apiKey: env.ALIBABA_DASHSCOPE_API_KEY || "dummy-key",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
});

const FIELD_EXTRACTION_PROMPT = `You are an expert at extracting structured information from Filipino barangay reports. Citizens send messages in mixed Tagalog/English, often with informal grammar.

Extract the following fields from the message:

1. **location**: Where did it happen? Extract place names, landmarks, zones, streets. If not specified, return "Not specified"
2. **time**: When did it happen? Convert relative times (e.g., "kanina" = earlier today, "kahapon" = yesterday, "ngayon" = now) to descriptive text. If not specified, return "Not specified"
3. **incidentType**: What happened? Summarize in 2-5 words (e.g., "Flooding", "Streetlight broken", "Noise complaint", "Document request")
4. **severity**: Rate urgency as CRITICAL/HIGH/MEDIUM/LOW
   - CRITICAL: Fire, serious accident, violent crime, severe flooding
   - HIGH: Active emergency, infrastructure failure, ongoing disturbance
   - MEDIUM: Infrastructure problems, moderate issues
   - LOW: Information requests, minor complaints
5. **actionNeeded**: What should the barangay do? Be specific and actionable
6. **entities.people**: Names of people mentioned (empty array if none)
7. **entities.places**: Specific places/landmarks mentioned (empty array if none)
8. **summary**: A clear 1-2 sentence summary in English

Examples:

Input: "May baha banda sa amin near barangay hall kanina 3pm"
Output: {
  "location": "Near barangay hall",
  "time": "Today, 3:00 PM",
  "incidentType": "Flooding",
  "severity": "HIGH",
  "actionNeeded": "Deploy sandbags and drainage crew to area near barangay hall",
  "entities": {"people": [], "places": ["barangay hall"]},
  "summary": "Flooding reported near barangay hall this afternoon at 3 PM."
}

Input: "Naiwan ko ID ko, paano makakuha ng clearance?"
Output: {
  "location": "Not specified",
  "time": "Not specified",
  "incidentType": "Clearance inquiry",
  "severity": "LOW",
  "actionNeeded": "Provide information on clearance requirements and ID retrieval process",
  "entities": {"people": [], "places": []},
  "summary": "Citizen inquiring about getting clearance after losing ID."
}

Input: "May nag-iinuman tapos nag-aaway na sila oh sa tapat ng sari-sari store ni Aling Rosa"
Output: {
  "location": "In front of Aling Rosa's sari-sari store",
  "time": "Currently happening",
  "incidentType": "Peace and order issue",
  "severity": "HIGH",
  "actionNeeded": "Dispatch barangay tanod to address disturbance and prevent escalation",
  "entities": {"people": ["Aling Rosa"], "places": ["Aling Rosa's sari-sari store"]},
  "summary": "People drinking and fighting in front of Aling Rosa's store, immediate intervention needed."
}

Respond ONLY with valid JSON matching this exact structure. Always provide all fields, use "Not specified" for missing information.`;

/**
 * Fallback field extraction using regex patterns for common Filipino phrases
 */
const fallbackExtract = (message: string): ExtractedFields => {
  const locationPatterns = [
    /(?:sa|near|banda sa|malapit sa|tapat ng)\s+([^,\.]+)/i,
    /(?:zone|purok)\s+(\d+)/i,
    /(barangay hall|covered court|basketball court|plaza|chapel|church)/i
  ];

  const timePatterns = [
    /kanina\s+(\d+\s*(?:am|pm)?)/i, // "kanina 3pm"
    /kahapon/i, // yesterday
    /ngayon|now/i, // now
    /(\d+:\d+\s*(?:am|pm)?)/i // "3:00 PM"
  ];

  let location = "Not specified";
  let time = "Not specified";

  // Try to extract location
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      location = match[1] || match[0];
      break;
    }
  }

  // Try to extract time
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (/kanina/i.test(match[0])) {
        time = `Earlier today${match[1] ? ` at ${match[1]}` : ""}`;
      } else if (/kahapon/i.test(match[0])) {
        time = "Yesterday";
      } else if (/ngayon|now/i.test(match[0])) {
        time = "Currently happening";
      } else {
        time = match[1] || match[0];
      }
      break;
    }
  }

  // Determine severity based on keywords
  let severity: ExtractedFields["severity"] = "MEDIUM";
  if (/(fire|sunog|aksidente|accident|patayin|patay|violence|gulo|away)/i.test(message)) {
    severity = "CRITICAL";
  } else if (/(baha|flood|power|kuryente|emergency|tulong|help)/i.test(message)) {
    severity = "HIGH";
  } else if (/(clearance|document|permit|tanong|question)/i.test(message)) {
    severity = "LOW";
  }

  // Extract simple incident type
  let incidentType = "General concern";
  if (/(baha|flood)/i.test(message)) incidentType = "Flooding";
  else if (/(ilaw|streetlight|poste)/i.test(message)) incidentType = "Streetlight issue";
  else if (/(away|gulo|ingay|noise)/i.test(message)) incidentType = "Peace and order";
  else if (/(clearance|document|permit)/i.test(message)) incidentType = "Document request";
  else if (/(basura|garbage|kalat)/i.test(message)) incidentType = "Waste management";

  return {
    location,
    time,
    incidentType,
    severity,
    actionNeeded: "Review and assess situation",
    entities: {
      people: [],
      places: location !== "Not specified" ? [location] : []
    },
    summary: message.length > 100 ? message.substring(0, 97) + "..." : message
  };
};

/**
 * Extract structured fields from a citizen report message
 */
export const extractFields = async (message: string): Promise<ExtractedFields> => {
  if (!env.ALIBABA_DASHSCOPE_API_KEY) {
    logger.warn("DashScope API key missing, using fallback field extraction");
    return fallbackExtract(message);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        { role: "system", content: FIELD_EXTRACTION_PROMPT },
        { role: "user", content: `Extract fields from this report:\n\n"${message}"` }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      logger.warn("Empty response from DashScope, using fallback");
      return fallbackExtract(message);
    }

    const parsed = JSON.parse(text) as ExtractedFields;

    // Validate required fields exist
    if (!parsed.location || !parsed.time || !parsed.incidentType || !parsed.severity) {
      logger.warn("Incomplete extraction from LLM, using fallback", { parsed });
      return fallbackExtract(message);
    }

    // Validate severity value
    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (!validSeverities.includes(parsed.severity)) {
      logger.warn("Invalid severity from LLM", { severity: parsed.severity });
      parsed.severity = "MEDIUM";
    }

    // Ensure entities structure exists
    if (!parsed.entities) {
      parsed.entities = { people: [], places: [] };
    }
    if (!Array.isArray(parsed.entities.people)) {
      parsed.entities.people = [];
    }
    if (!Array.isArray(parsed.entities.places)) {
      parsed.entities.places = [];
    }

    // Ensure summary exists
    if (!parsed.summary) {
      parsed.summary = message.length > 100 ? message.substring(0, 97) + "..." : message;
    }

    // Replace empty/null values with "Not specified"
    if (!parsed.location || parsed.location.trim() === "") {
      parsed.location = "Not specified";
    }
    if (!parsed.time || parsed.time.trim() === "") {
      parsed.time = "Not specified";
    }
    if (!parsed.actionNeeded || parsed.actionNeeded.trim() === "") {
      parsed.actionNeeded = "Review and assess situation";
    }

    logger.info("Successfully extracted fields from message", { 
      location: parsed.location, 
      severity: parsed.severity,
      incidentType: parsed.incidentType 
    });

    return parsed;
  } catch (error) {
    logger.error("Error in LLM-based field extraction", { error });
    return fallbackExtract(message);
  }
};
