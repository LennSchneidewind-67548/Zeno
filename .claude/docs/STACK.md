# Stack

## Frontend
- **Next.js 16.2.2** — App Router (`app/` directory). See AGENTS.md: this version has breaking changes.
- **React 19.2.4**
- **Tailwind CSS v4** — CSS-first config via PostCSS (`postcss.config.mjs`). No `tailwind.config.js`.
- **TypeScript** — strict mode; path alias `@/*` maps to repo root

## AI
- **Google AI Studio** — used server-side to split tasks into subtasks
- API calls must be made from Next.js Route Handlers (`app/api/`) to keep the API key server-side

## Persistence
- **Supabase** — PostgreSQL database + authentication
- SDK installed: `@supabase/supabase-js` + `@supabase/ssr`
- Client helpers: `lib/supabase-browser.ts` (client components) and `lib/supabase-server.ts` (route handlers)
- Schema and row level security policies: `supabase/schema.sql`

## Deployment (TBD)
- Target: Vercel (natural fit for Next.js)
