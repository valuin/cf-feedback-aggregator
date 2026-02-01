import { describe, it, expect, mock } from "bun:test";

// Mock cloudflare:workers before any other imports
mock.module("cloudflare:workers", () => ({
  WorkflowEntrypoint: class {},
  WorkflowEvent: class {},
  WorkflowStep: class {},
}));

// Mock drizzle-orm/d1 to return controlled data
mock.module("drizzle-orm/d1", () => ({
  drizzle: (_db: unknown) => ({
    select: () => ({
      from: () => ({
        all: () =>
          Promise.resolve([
            {
              id: "signal-1",
              source: "github",
              rawText: "CRITICAL: The API is down in production!!",
              sentiment: "negative",
              urgency: "critical",
              category: "infrastructure",
              createdAt: new Date().toISOString(),
            },
          ]),
      }),
    }),
  }),
}));

describe("End-to-End Logic: Ingestion to Dashboard", () => {
  it("should process a critical signal and surface it in the Dashboard filtering", async () => {
    const { default: app } = await import("./src/index");

    const env = {
      DB: {}, // Drizzle mock ignores this
      ANALYZE_WORKFLOW: {
        create: mock(() => Promise.resolve({ id: "wf-id" })),
      },
    };

    const res = await app.request("/", {}, env);
    expect(res.status).toBe(200);

    const html = await res.text();

    // Verify the Dashboard renders the critical signal
    expect(html).toContain("Feedback Signal Aggregator");
    expect(html).toContain("CRITICAL: The API is down in production!!");
    expect(html).toContain("critical");
    expect(html).toContain("infrastructure");
    expect(html).toContain("Urgent/Critical");
  });
});

// Reset mock for second test
describe("End-to-End Logic: Filtering non-priority signals", () => {
  it("should exclude non-urgent or non-negative signals from the priority queue", async () => {
    // Re-mock with positive data
    mock.module("drizzle-orm/d1", () => ({
      drizzle: (_db: unknown) => ({
        select: () => ({
          from: () => ({
            all: () =>
              Promise.resolve([
                {
                  id: "signal-2",
                  source: "discord",
                  rawText: "This app is amazing, thanks!",
                  sentiment: "positive",
                  urgency: "low",
                  category: "app",
                  createdAt: new Date().toISOString(),
                },
              ]),
          }),
        }),
      }),
    }));

    const { default: app } = await import("./src/index");

    const env = {
      DB: {},
    };

    const res = await app.request("/", {}, env);
    const html = await res.text();

    expect(html).toContain("No urgent negative signals found");
  });
});
