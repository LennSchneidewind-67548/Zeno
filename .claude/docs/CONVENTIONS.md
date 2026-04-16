# Conventions

## Code Style
- TypeScript strict mode throughout — no `any`
- Functional components only; no class components
- Keep components small and single-purpose

## File Naming
- React components: PascalCase (`TaskItem.tsx`)
- Utilities/lib: camelCase (`xp.ts`, `claude.ts`)
- Route handlers: `app/api/.../route.ts` (Next.js convention)

## Tailwind v4
- No `tailwind.config.js` — configuration lives in CSS via `@theme` blocks in `globals.css`
- Use utility classes directly; avoid arbitrary values unless necessary

## API Routes
- All Claude API calls must go through server-side Route Handlers
- Never import `lib/claude.ts` from client components — mark it `'server only'` if needed
- Route handlers return JSON; use standard HTTP status codes

## State Management
- Start with React `useState`/`useReducer` — do not reach for external state libraries unless clearly needed
- Persist to `localStorage` for MVP; migrate to a real DB when persistence requirements are clearer

## XP System
- XP values live in `lib/xp.ts` as named constants — don't scatter magic numbers across components
- Completing a subtask: base XP award
- Completing all subtasks of a parent task: bonus multiplier applied to parent task's total

## Git
- Commit messages: imperative mood, present tense ("Add task splitting endpoint")
- Keep commits focused; one logical change per commit
