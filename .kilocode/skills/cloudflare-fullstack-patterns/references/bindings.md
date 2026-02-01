# Cloudflare Bindings Reference

Common binding configurations for `wrangler.jsonc` used in this stack.

## D1 Database
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "feedback-db",
    "database_id": "uuid-here",
    "migrations_dir": "drizzle"
  }
]
```

## Workers AI
```json
"ai": {
  "binding": "AI"
}
```

## Workflows
```json
"workflows": [
  {
    "binding": "ANALYZE_WORKFLOW",
    "name": "feedback-analysis-workflow",
    "class_name": "AnalyzeWorkflow"
  }
]
```

## Assets (Static Files)
```json
"assets": {
  "binding": "ASSETS",
  "directory": "./public"
}
```

## Compatibility Settings
Required for modern Node.js libraries and AI SDK.
```json
"compatibility_date": "2026-01-28",
"compatibility_flags": ["nodejs_compat"]
```
