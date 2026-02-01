# AGENTS.md - Project Context & Directives

> **SYSTEM INSTRUCTION:** ALL AI AGENTS WORKING ON THIS REPOSITORY MUST READ AND ADHERE TO THE FOLLOWING ARCHITECTURAL GUIDELINES AND CONSTRAINTS. THIS PROJECT IS A PROTOTYPE BUILT BY A PM-AS-BUILDER TO STRESS-TEST CLOUDFLARE'S DEVELOPER PLATFORM.

## 1. Project Overview

**Project:** Feedback Signal Aggregator
**Goal:** Ingest fragmented feedback (mocked), process via Cloudflare Workflows + Workers AI, and store in D1 to answer: _"What feedback is most urgent, negative, and recurring right now?"_

## 2. Tech Stack (Strict)

- **Runtime:** [Cloudflare Workers](https://workers.cloudflare.com) (Edge-native)
- **Framework:** [Hono](https://hono.dev) (v4+)
- **Orchestration:** [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- **Intelligence:** [Workers AI](https://developers.cloudflare.com/workers-ai/) (`@cf/meta/llama-3-8b-instruct`)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **UI:** `hono/jsx` (SSR, Zero build tools)
- **Type Safety:** TypeScript (Strict) + `wrangler types`

## 3. Architecture & Core Philosophy

This prototype prioritizes **speed of insight** and **platform stress-testing** over production polish.

- **Edge-First:** Every component must run on the Cloudflare Edge. No external dependencies that require Node.js fat runtimes.
- **Contract Integrity:** Bindings are the source of truth. Always run `bun run cf-typegen` when `wrangler.jsonc` changes.
- **Minimalist UI:** Use `hono/jsx` for the PM dashboard. Do **NOT** introduce Vite, React, or complex frontend build pipelines.
- **Workflow-Centric:** All heavy processing (AI analysis, DB persistence) happens inside the `AnalyzeWorkflow` class, not the Hono request handler.

---

## 4. The "Golden Rules" (Violations = Immediate Rejection)

### 1. The Binding Rule

**NEVER** hardcode database IDs or secrets. **ALWAYS** access resources via the `c.env` (Hono) or `this.env` (Workflows) bindings.

**Why?**

- Ensures local development (`--local`) matches remote deployment.
- Keeps secrets out of the codebase.

### 2. The Workflow Isolation Rule

The Hono `POST /feedback` route should **ONLY** trigger the workflow. It must **NOT** call Workers AI or perform D1 writes directly.

**Why?**

- Represents a real-world asynchronous processing pipeline.
- Tests the DX of Cloudflare Workflows as an orchestration layer.

### 3. The Drizzle Pattern Rule

Use Drizzle ORM for all D1 interactions. Direct SQL should only be used in `wrangler d1 execute` for manual debugging.

**Why?**

- Maintains type safety from the DB schema to the UI.
- Enables easy migration management via `drizzle-kit`.

---

## 5. Directory Structure (The Map)

```text
feedback-aggregator/
├── drizzle/               # Generated SQL migrations
├── public/                # Static assets (if any)
├── src/
│   ├── index.tsx          # Hono Entry & Dashboard (SSR)
│   ├── db/
│   │   └── schema.ts      # Drizzle table definitions
│   ├── workflows/
│   │   └── analyze.ts     # The "Brain" (Workflows + AI)
│   └── types/
│       └── index.ts       # Shared TypeScript interfaces
├── wrangler.jsonc         # Binding & Platform configuration
├── drizzle.config.ts      # Drizzle CLI configuration
└── tsconfig.json          # JSX & Path configurations
```

---

## 6. Development Workflow

When asked to "Build/Update Feature X", follow this sequence:

1. **Check Bindings:** Ensure `wrangler.jsonc` has the necessary D1/AI/Workflow bindings.
2. **Schema First:** Update `src/db/schema.ts` if data shapes change.
3. **Generate Types:** Run `bun run cf-typegen` to update `worker-configuration.d.ts`.
4. **Logic:** Implement in `src/workflows/analyze.ts`.
5. **Expose:** Update routes in `src/index.tsx`.

---

## 7. Code Quality Checklist

- ✅ `bun run check` passes without type errors.
- ✅ `hono/jsx` used for all HTML responses.
- ✅ `AnalyzeWorkflow` class handles AI classification.
- ✅ `drizzle-orm` used for D1 interaction.
- ✅ Bindings correctly typed in `CloudflareBindings` interface.

---

**END OF INSTRUCTION**
