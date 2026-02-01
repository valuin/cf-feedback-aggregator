import { describe, it, expect, mock } from "bun:test";

// Mock cloudflare:workers before any other imports
mock.module("cloudflare:workers", () => ({
  WorkflowEntrypoint: class {},
  WorkflowEvent: class {},
  WorkflowStep: class {},
}));

describe("Hono App Routes", () => {
  it("POST /feedback should be defined and return 200", async () => {
    const { default: app } = await import("./src/index");

    // Mock environment for testing
    const env = {
      ANALYZE_WORKFLOW: {
        create: mock(() => Promise.resolve({ id: "test-id" })),
      },
    };

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({ source: "discord", text: "this is a test" }),
        headers: { "Content-Type": "application/json" },
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "queued", id: expect.any(String) });
    expect(env.ANALYZE_WORKFLOW.create).toHaveBeenCalled();
  });

  it("GET / should be defined and return 200", async () => {
    const { default: app } = await import("./src/index");

    // Mock environment for D1 to satisfy Drizzle
    const env = {
      DB: {
        prepare: mock(() => ({
          bind: mock(() => ({
            all: mock(() => Promise.resolve({ results: [] })),
            raw: mock(() => Promise.resolve([])),
          })),
        })),
      },
    };

    const res = await app.request("/", {}, env);
    expect(res.status).toBe(200);
  });
});
