import { IconMessage, IconBrandMessenger, IconMail } from "@tabler/icons-react";

/**
 * Conversation Constants
 * Centralized configuration for conversation-related UI elements
 */

// Sentiment configurations
export const sentimentColors = {
  POSITIVE: "teal",
  NEUTRAL: "gray",
  NEGATIVE: "red"
} as const;

export const sentimentOptions = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;

// Channel configurations
export const channelColors = {
  SMS: "blue",
  Messenger: "violet",
  Email: "cyan"
} as const;

export const channelIcons = {
  SMS: IconMessage,
  Messenger: IconBrandMessenger,
  Email: IconMail
} as const;

export const channelOptions = ["SMS", "Messenger", "Email"] as const;

// Sort configurations
export const sortOptions = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "messages-desc", label: "Most Messages" },
  { value: "messages-asc", label: "Least Messages" }
] as const;
