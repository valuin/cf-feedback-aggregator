# AI SDK 6 Patterns (Structured Output)

To ensure high-fidelity structured output from Cloudflare Workers AI using the Vercel AI SDK 6:

## Setup
```typescript
import { createWorkersAI } from "workers-ai-provider";
import { generateText, Output } from "ai";
import { z } from "zod";

const workersai = createWorkersAI({ binding: env.AI });
```

## Implementation
Use `generateText` with the `output` parameter set to `Output.object`. This is superior to `generateObject` for stability in the May 2025+ ecosystem.

```typescript
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

// Access typed result
console.log(output.sentiment);
```

## Why this pattern?
1. **No Conversational Noise**: `Output.object` forces the model to adhere to the schema, bypassing "Here is the JSON you requested..." prefixes.
2. **Strict Validation**: Zod ensures the runtime data matches your TypeScript interfaces.
3. **Ecosystem Compliance**: Matches the latest recommendations for Cloudflare + AI SDK integration.
