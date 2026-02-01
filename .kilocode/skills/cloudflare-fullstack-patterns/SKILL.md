---
name: cloudflare-fullstack-patterns
description: Procedural knowledge for building full-stack applications on Cloudflare using Hono, Workers AI (Vercel AI SDK 6), Workflows, and D1 with Drizzle ORM.
---

# Cloudflare Full-Stack Patterns

This skill provides verified implementation patterns for composing Cloudflare primitives into robust full-stack applications.

## Core Stack
- **Framework**: [Hono](https://hono.dev)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) with [Drizzle ORM](https://orm.drizzle.team)
- **AI**: [Workers AI](https://developers.cloudflare.com/workers-ai/) via [Vercel AI SDK 6](https://sdk.vercel.ai/docs/introduction)
- **Orchestration**: [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)

## Implementation Workflows

### 1. D1 + Drizzle Configuration
To ensure seamless migrations and type safety:
- Set `migrations_dir` in `wrangler.jsonc` to match Drizzle's output folder (default: `"drizzle"`).
- Use `nodejs_compat` compatibility flag in `wrangler.jsonc`.
- Export schema from a dedicated file (e.g., `src/db/schema.ts`).

### 2. Workers AI with AI SDK 6 (Structured Output)
To avoid LLM hallucinations and ensure valid JSON:
- Use `generateText` with `Output.object` instead of deprecated `generateObject`.
- Always define a Zod schema for the expected output.
- Pass the Cloudflare AI binding via `createWorkersAI` from `workers-ai-provider`.

### 3. Stateful Orchestration with Workflows
To build resilient multi-step pipelines:
- Define a class extending `WorkflowEntrypoint<CloudflareBindings, PayloadType>`.
- Wrap side effects (DB writes, AI calls, fetches) in `step.do()` for automatic retries and state persistence.
- Register the workflow in `wrangler.jsonc` with `binding`, `name`, and `class_name`.

### 4. Avoiding "Shadowing" Friction
- Ensure `public/index.html` does not conflict with Worker routes defined in Hono.
- If using Hono for SSR at `/`, ensure the static asset directory (e.g., `./public`) does not contain an `index.html` unless it is the intended entry point.

## References
- [Binding Syntax & Configuration](references/bindings.md)
- [AI SDK 6 Patterns](references/ai_sdk_6.md)
- [Drizzle-D1 Handshake](references/drizzle_d1.md)
