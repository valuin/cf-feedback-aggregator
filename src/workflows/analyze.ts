import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { FeedbackEntry, AIAnalysisResult } from "../types";
import { drizzle } from "drizzle-orm/d1";
import { feedbackEntries } from "../db/schema";
import { createWorkersAI } from "workers-ai-provider";
import { generateText, Output } from "ai";
import { z } from "zod";

export class AnalyzeWorkflow extends WorkflowEntrypoint<CloudflareBindings, FeedbackEntry> {
  async run(event: WorkflowEvent<FeedbackEntry>, step: WorkflowStep) {
    const feedback = event.payload;

    // Step 1: AI Analysis using Vercel AI SDK 6
    const analysis = await step.do("analyze-feedback", async () => {
      const workersai = createWorkersAI({ binding: this.env.AI });
      const { output } = await generateText({
        model: workersai("@cf/meta/llama-3.1-8b-instruct-fp8"),
        output: Output.object({
          schema: z.object({
            sentiment: z.enum(["positive", "neutral", "negative"]),
            urgency: z.enum(["low", "medium", "high", "critical"]),
            category: z.string(),
          }),
        }),
        prompt: `Analyze this feedback: "${feedback.rawText}"`,
      });
      return output as AIAnalysisResult;
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

    // Step 3: Notify if critical
    if (analysis.urgency === "critical") {
      await step.do("notify-critical", async () => {
        await fetch("https://ntfy.sh/cf-feedback", {
          method: "POST",
          body: `Critical Feedback Detected!\n\nSource: ${feedback.source}\nCategory: ${analysis.category}\nText: ${feedback.rawText}`,
          headers: {
            Title: "CRITICAL: New Feedback Received",
            Priority: "5",
            Tags: "rotating_light,boom,warning",
          },
        });
      });
    }
  }
}
