# Architecture

## Structure

```
app/
  layout.tsx                       # root layout; loads Fraunces + Geist fonts
  page.tsx                         # landing page + Supabase auth form
  globals.css                      # Tailwind v4 entry point
  tasks/page.tsx                   # the spatial desktop (main app)
  api/
    tasks/route.ts                 # GET list (+ subtask counts) · POST create
    tasks/[id]/route.ts            # PATCH position/done · DELETE
    tasks/[id]/split/route.ts      # POST — AI breakdown
    tasks/[id]/subtasks/route.ts   # GET breakdown · DELETE (start over)
    subtasks/[id]/route.ts         # PATCH — persist a node's done state

components/
  TaskCard.tsx                     # draggable canvas card + progress bar
  TaskExpandedView.tsx             # fullscreen overlay shell
  ContextPanel.tsx                 # pre-breakdown input
  StructureView.tsx                # 4 structure renderers + unlock logic

lib/
  gemini.ts                        # model call, constrained to a JSON schema
  task-types.ts                    # DB ↔ client types, progress counting
  supabase-browser.ts              # browser client
  supabase-server.ts               # server client

supabase/schema.sql                # tables + RLS policies
proxy.ts                           # session refresh + /tasks protection
```

## Data Flow

1. User drops a task on the canvas → `POST /api/tasks` → row in `tasks`, positioned by the server
2. Dragging writes straight to a Framer Motion value; on mouseup the position commits via `PATCH /api/tasks/[id]`
3. Opening a card fetches `GET /api/tasks/[id]/subtasks`. No breakdown yet → Context Panel; otherwise → Structure View
4. Submitting context calls `POST /api/tasks/[id]/split`, which builds a prompt, calls Gemini with a response schema, and persists the result
5. Ticking a node calls `PATCH /api/subtasks/[id]` optimistically, rolling back if the write fails
6. Closing the overlay refetches tasks so canvas progress bars stay current

## Breakdown persistence

The model cannot know the UUIDs of rows that do not exist yet, so tree and pipeline
structures label their root nodes with a `temp_id` and have children reference it.
`split/route.ts` inserts roots first, builds a `temp_id → real UUID` map, then inserts
the children with resolved `parent_id` values.

Root rows (`parent_id = null`) in tree and pipeline breakdowns are section and phase
*headings*, not work items. `countProgress()` in `lib/task-types.ts` therefore counts
leaf rows when any exist, and all rows for the flat linear/star structures.

## Key Constraints

- The Google AI API key is server-only — all model calls go through Route Handlers
- `lib/supabase-server.ts` uses `next/headers` and must never be imported from a `"use client"` component
- Row level security is the real authorization boundary; route handlers additionally check `auth.getUser()` and scope writes by `user_id`
