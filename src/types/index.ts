export type FeedbackSource = "discord" | "github" | "twitter" | "support";
export type Sentiment = "positive" | "neutral" | "negative";
export type Urgency = "low" | "medium" | "high" | "critical";

export interface FeedbackEntry {
  id: string;
  source: FeedbackSource;
  rawText: string;
  sentiment?: Sentiment;
  urgency?: Urgency;
  category?: string;
  createdAt?: string;
}

export interface AIAnalysisResult {
  sentiment: Sentiment;
  urgency: Urgency;
  category: string;
}
