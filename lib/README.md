# lib/

Server-side utilities and shared helpers. Files here are imported by API routes and Server Components — never directly by client-side React components.

| File | What it does |
|---|---|
| `supabase-browser.ts` | `getBrowserClient()` — import this in `"use client"` components. No server-only APIs, safe for the browser bundle. |
| `supabase-server.ts` | `getServerClient()` — import this in API routes and Server Components only. Uses `next/headers` which is server-only. |
