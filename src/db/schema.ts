import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedbackEntries = sqliteTable("feedback_entries", {
  id: text("id").primaryKey(),
  source: text("source"), // 'discord', 'github', 'twitter', 'support'
  rawText: text("raw_text").notNull(),
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  urgency: text("urgency"), // 'low', 'medium', 'high', 'critical'
  category: text("category"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
