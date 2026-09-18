# lib/

Shared helpers and types. Anything touching an API key or `next/headers` belongs to the server and must never be imported from a `"use client"` component.

| File | What it does |
|---|---|
| `supabase-browser.ts` | `getBrowserClient()` — import in `"use client"` components. No server-only APIs, safe for the browser bundle. |
| `supabase-server.ts` | `getServerClient()` — import in route handlers and Server Components only. Uses `next/headers`. |
| `gemini.ts` | `splitTask()` — calls Gemini with a response schema that forces structured JSON back. Server-only; reads `GOOGLE_AI_API_KEY`. |
| `task-types.ts` | Database row types, their client-side counterparts, the `toClient*` mappers, and `countProgress()` for subtask counts. |

`task-types.ts` is the one file here that is safe to import from either side — it is types and pure functions only.
