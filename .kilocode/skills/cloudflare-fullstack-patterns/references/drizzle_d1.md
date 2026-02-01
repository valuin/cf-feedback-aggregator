# Drizzle-D1 Handshake

To ensure Drizzle ORM works correctly with Cloudflare D1 in both development and production.

## Configuration (`drizzle.config.ts`)
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

## Wrangler Setup (`wrangler.jsonc`)
Crucially, point `migrations_dir` to where Drizzle outputs its SQL files.
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "YOUR_ID",
      "migrations_dir": "drizzle"
    }
  ]
}
```

## Usage in Worker
```typescript
import { drizzle } from "drizzle-orm/d1";
import { myTable } from "./db/schema";

const db = drizzle(env.DB);
const results = await db.select().from(myTable).all();
```

## Deployment Commands
1. Generate migration: `npx drizzle-kit generate`
2. Apply locally: `npx wrangler d1 migrations apply my-db --local`
3. Apply remote: `npx wrangler d1 migrations apply my-db --remote`
