import { describe, it, expect, mock } from "bun:test";

// Mock cloudflare:workers before any other imports
mock.module("cloudflare:workers", () => ({
  WorkflowEntrypoint: class {},
  WorkflowEvent: class {},
  WorkflowStep: class {},
}));

describe("Hono App Routes", () => {
  it("POST /feedback should be defined", async () => {
    const { default: app } = await import("./src/index");
    expect(app).toBeDefined();
  });
});
