# Architecture

## Current State
Blank Next.js scaffold. Only meaningful files:
- `app/layout.tsx` — root layout; loads Geist/Geist Mono, sets base Tailwind classes
- `app/page.tsx` — home page (placeholder)
- `app/globals.css` — Tailwind v4 entry point

## Planned Structure

```
app/
  layout.tsx              # root layout
  page.tsx                # home / task list view
  api/
    tasks/
      split/route.ts      # POST — calls Claude API to split a task into subtasks
globals.css

components/
  TaskList.tsx            # list of top-level tasks
  TaskItem.tsx            # single task row with expand/collapse
  SubtaskItem.tsx         # individual subtask with checkbox
  XPBar.tsx               # gamification: XP progress display

lib/
  claude.ts               # Claude API client wrapper (server-only)
  xp.ts                   # XP calculation logic

types/
  task.ts                 # Task, Subtask type definitions
```

## Data Flow

1. User adds a task → stored in state (or DB later)
2. User clicks "Break it down" on a task → POST to `/api/tasks/split`
3. Route handler calls Claude API with the task text → returns array of subtasks
4. Subtasks stored alongside the parent task
5. User checks off subtasks → XP awarded per subtask + bonus on full completion

## Key Constraints
- Claude API key must never be exposed to the client — all AI calls go through Route Handlers
- Keep state simple for MVP: local state or localStorage before adding a DB
