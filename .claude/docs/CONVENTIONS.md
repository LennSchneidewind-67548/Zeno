# Conventions

## Code Style
- TypeScript strict mode throughout — no `any`
- Functional components only; no class components
- Keep components small and single-purpose

## File Naming
- React components: PascalCase (`TaskCard.tsx`)
- Utilities/lib: camelCase (`gemini.ts`, `task-types.ts`)
- Route handlers: `app/api/.../route.ts` (Next.js convention)

## Styling
- No `tailwind.config.js` — Tailwind v4 configuration lives in CSS via `@theme` blocks in `globals.css`
- The app UI is styled with inline `style` objects using `oklch()` colours; Tailwind utilities are used for layout primitives. Match the surrounding file rather than mixing both in one component
- The landing page keeps its own scoped CSS in the `STYLES` constant in `app/page.tsx`

## API Routes
- All model calls must go through server-side Route Handlers — the Google AI key never reaches the browser
- Never import `lib/gemini.ts` or `lib/supabase-server.ts` from a `"use client"` component
- Every handler checks `auth.getUser()` first and returns 401 when there is no session
- Route handlers return JSON; use standard HTTP status codes

## State Management
- Start with React `useState`/`useReducer` — do not reach for external state libraries unless clearly needed
- Persistence goes to Supabase. Write optimistically for instant feedback, and roll back on failure so the UI never claims something was saved when it was not
- Anything updated on every frame (drag position) belongs in a ref or a motion value, not React state

## XP System (not yet built)
- When built, XP values live in `lib/xp.ts` as named constants — don't scatter magic numbers across components
- Until then, do not show XP, levels, or streaks anywhere in the app UI. Placeholder numbers that never change read as broken; show real counts or nothing

## Git
- Commit messages: imperative mood, present tense ("Add task splitting endpoint")
- Keep commits focused; one logical change per commit
