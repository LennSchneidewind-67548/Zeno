# Zeno

**An ADHD-friendly task app that breaks big tasks into a shape you can actually start.**

Most task apps are good at storing work and bad at starting it. For an ADHD brain the
hard part isn't remembering the task — it's that "Ship Q2 launch" is one undifferentiated
lump with no obvious first move. Zeno's bet is that the blocker is *shapelessness*, so it
turns every task into a visual structure where exactly one node is lit up as the thing to
do next.

> **Status: work in progress (v0.1).** The core loop — capture, AI breakdown, visual
> structure, progress — works end to end. The gamification layer is designed but not
> built. See [What's built](#whats-built) for an honest breakdown.

---

## The idea

You drop a task onto a spatial canvas. You give Zeno a little context about how you
work. It sends that to an LLM, which picks one of four shapes and fills in the subtasks:

| Structure | When it's chosen | How it unlocks |
|---|---|---|
| **Linear** | Steps that must happen in order | Sequential — first unfinished node is active, the rest are locked |
| **Tree** | A big job with 2–3 distinct branches | Branches unlock in order; within a branch, children unlock in order |
| **Star** | Independent pieces around one goal | Parallel — everything is active at once |
| **Pipeline** | Work that moves through phases | Phases unlock in order; tasks within a phase run in parallel |

The locking is the point. A locked node isn't a restriction, it's permission to ignore
everything except the one purple node in front of you.

---

## What's built

**Working end to end**

- Email/password auth via Supabase, with route protection in `proxy.ts`
- Spatial canvas — cards are dragged with spring physics and velocity-based tilt, and
  their positions persist to the database
- Fullscreen task view with a context panel (guided questions, or paste a document dump)
- AI breakdown via Gemini, using a structured-output schema so the model must return
  valid JSON with a structure choice and subtask tree
- All four structure renderers, including SVG connector lines for the tree
- Ticking a node persists, unlocks the next node, and updates the progress bar on the
  canvas card behind it

**Designed but not built**

- The XP / levels / streaks system. The landing page shows the visual direction for it;
  none of it is wired to real data. Deliberately kept out of the app UI rather than
  faked — the desktop shows real subtask counts instead.

**Known rough edges**

- No test suite
- Mobile is usable but the canvas is built for a mouse
- Breakdown re-runs replace the existing subtasks and lose their done state

---

## Running it locally

**Prerequisites:** Node.js 20+, a Supabase project, a Google AI Studio API key.

```bash
git clone https://github.com/LennSchneidewind-67548/Zeno.git
cd Zeno
npm install
```

Set up the database — open the Supabase SQL editor and run
[`supabase/schema.sql`](supabase/schema.sql). It creates both tables and the row level
security policies.

Then configure the environment:

```bash
cp .env.example .env.local   # fill in your own values
npm run dev                  # http://localhost:3000
```

In Supabase, turn off "Confirm email" under Authentication → Sign In / Providers if you
want to sign up and land straight in the app.

```bash
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

---

## How it's put together

```
app/
  page.tsx                       Landing page + auth form
  tasks/page.tsx                 The spatial desktop (main app)
  api/
    tasks/route.ts               GET list (with subtask counts) · POST create
    tasks/[id]/route.ts          PATCH position/done · DELETE
    tasks/[id]/split/route.ts    POST — prompt the model, persist the breakdown
    tasks/[id]/subtasks/route.ts GET breakdown · DELETE (start over)
    subtasks/[id]/route.ts       PATCH — persist a node's done state
components/
  TaskCard.tsx                   Draggable canvas card + progress bar
  TaskExpandedView.tsx           Fullscreen overlay shell
  ContextPanel.tsx               Pre-breakdown input
  StructureView.tsx              All four structure renderers + unlock logic
lib/
  gemini.ts                      Model call, constrained to a JSON schema
  task-types.ts                  DB ↔ client types, progress counting
  supabase-browser.ts            Browser client ("use client" only)
  supabase-server.ts             Server client (route handlers only)
supabase/schema.sql              Tables + RLS policies
proxy.ts                         Session refresh + /tasks route protection
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 ·
Framer Motion · Supabase (Postgres + Auth) · Gemini 2.5 Flash Lite

### A few decisions worth explaining

**The model returns data, not layout.** `lib/gemini.ts` pins the response to a JSON
schema, so the model picks a structure and emits subtasks with positions and parent
references — it never produces markup. Rendering stays entirely in React, which means a
bad model response degrades into a thin breakdown rather than a broken page.

**Parent references are resolved in two passes.** The model can't know the UUIDs of rows
that don't exist yet, so it labels roots with `temp_id` and points children at those.
`split/route.ts` inserts the roots, maps `temp_id → real UUID`, then inserts the children.

**Dragging never touches React state.** Cards would re-render on every mousemove
otherwise. `TaskCard` exposes a handle whose `setTarget` writes straight to a Framer
Motion value, and the page only commits to state and the database on mouseup. The tilt
is derived from the spring's own velocity, so the card leans into the movement.

**Ownership is enforced twice.** Row level security is the real boundary, but the route
handlers also check `auth.getUser()` and scope writes by `user_id`, so a policy mistake
doesn't immediately become a data leak.

---

## License

Personal project, no license granted. Ask if you'd like to use any of it.
