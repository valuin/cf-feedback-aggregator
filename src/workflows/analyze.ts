import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { FeedbackEntry, AIAnalysisResult } from "../types";
import { drizzle } from "drizzle-orm/d1";
import { feedbackEntries } from "../db/schema";

export class AnalyzeWorkflow extends WorkflowEntrypoint<CloudflareBindings, FeedbackEntry> {
  async run(event: WorkflowEvent<FeedbackEntry>, step: WorkflowStep) {
    const feedback = event.payload;

    // Step 1: AI Analysis
    const analysis = await step.do("analyze-feedback", async () => {
      // Note: Workers AI can be called via this.env.AI
      // We'll prompt for sentiment, urgency, and category
      const response = (await this.env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [
          {
            role: "system",
            content:
              'You are a feedback classifier. Respond ONLY with valid JSON containing "sentiment" (positive/neutral/negative), "urgency" (low/medium/high/critical), and "category" (short string).',
          },
          {
            role: "user",
            content: `Analyze this feedback: "${feedback.rawText}"`,
          },
        ],
        // Use JSON mode if supported or handle parsing
        response_format: { type: "json_object" },
      })) as { response: string };

      return JSON.parse(response.response) as AIAnalysisResult;
    });

    // Step 2: Persist to D1
    await step.do("save-to-db", async () => {
      const db = drizzle(this.env.DB);
      await db.insert(feedbackEntries).values({
        id: feedback.id,
        source: feedback.source,
        rawText: feedback.rawText,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        category: analysis.category,
      });
    });
  }
}
