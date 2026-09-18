# Project: Zeno

## What is this?

Zeno is an ADHD-friendly productivity app. The core problem it solves: people with ADHD struggle to start large tasks because they feel overwhelming. Zeno lets users capture tasks on a spatial desktop, then break them down automatically using AI into a visual structure — linear, tree, star, or pipeline — that makes it obvious where to start. Completing subtasks earns XP, building a satisfying reward loop.

---

## The Three Layers

### Layer 1 — Landing Page ✅ Done

Bright, gamified marketing page (`app/page.tsx`). Features:
- Hero with floating level-up cards, XP bar, and streak chips
- Animated SVG previews of all 4 structure types (Linear, Tree, Star, Pipeline)
- Scrolling marquee, "How it works" steps, draggable desktop demo
- Email + password sign-in / sign-up form wired to Supabase Auth
- On successful auth, redirects to `/tasks`
- Fonts: Fraunces (display) + Geist Sans + Geist Mono

---

### Layer 2 — The Desktop ✅ Done

`app/tasks/page.tsx` — spatial canvas where tasks live as draggable cards.

**What's built**
- Infinite canvas with dot-grid background
- Task cards are freely draggable; positions saved to Supabase (`canvas_x`, `canvas_y`)
- "New task" button creates a card and drops it at a random position
- Cards show task title, icon (emoji), done state, and task type badge
- Cards show a progress bar (done/total subtasks) once a breakdown exists, with a golden glow at 100%
- Header shows a live count of completed steps across all broken-down tasks
- Empty-state prompt when the desktop has no cards yet
- Clicking a card opens Layer 3 (fullscreen overlay)
- Sign-out button in header

**What's NOT here**
- No traditional list view
- No sidebar, folders, or hierarchy at this layer — the canvas is flat
- No snap-to-grid or collision behaviour (cards use spring physics while dragging, but float freely)
- No XP, levels, or streaks — see Gamification below

---

### Layer 3 — The Task View ✅ Done

Clicking a card opens a fullscreen overlay. Two states:

#### 3a — Before breakdown: the Context Panel (`components/ContextPanel.tsx`) ✅

Two input modes:

**Option A — Guided input**
1. Workflow description free-text field
2. A fixed set of 5 clarifying question chips (static list in `ContextPanel.tsx` — AI-generated chips were considered and dropped)
3. Detail level slider (maps to target subtask count, 3–15)

**Option B — Document dump**
Large text area for pasting existing content (notes, conversation transcripts, brainstorm docs). Both modes can be combined.

Submit button calls `POST /api/tasks/[id]/split`. Shows spinner while AI runs.

#### 3b — After breakdown: the Structure View (`components/StructureView.tsx`) ✅

The AI picks one of four structures and generates subtasks. The entire screen becomes the visual breakdown:

| Structure | Visual | Unlock logic |
|---|---|---|
| **Linear** | Horizontal strip of cards with → arrows | Sequential: first non-done = active, rest locked |
| **Tree** | Root → branch row → child columns, SVG connector lines | Sequential branches; within active branch, sequential children |
| **Star** | Center circle (task title) + surrounding cards | Parallel: all cards active simultaneously |
| **Pipeline** | Phase header row with → arrows + task columns below each phase | Sequential phases; within active phase, sequential tasks |

Node states: `done` (teal), `active` (purple + ring), `locked` (gray), `todo` (slate).

Clicking a node toggles its done state. "Start over" deletes the breakdown and returns to the Context Panel.

Toggling a node updates local state optimistically and persists via `PATCH /api/subtasks/[id]`; a failed write rolls the node back. Closing the overlay refetches tasks so canvas cards show current progress.

---

## Gamification — Planned Next

Detailed plan in `/Users/lennschneidewind/.claude/plans/okay-i-want-you-cosmic-harp.md`.

### XP Economy
| Event | XP |
|---|---|
| Complete a subtask | +15 |
| First subtask of a task ("activation bonus") | +5 extra |
| All subtasks done (task complete) | +50 bonus |
| AI breakdown triggered (once per task) | +10 |
| Pipeline phase complete | +10 |
| Tree branch complete | +10 |

Levels: 10 thresholds from 0 → 13,000 XP. Level displayed in desktop header.

### What needs to be built
1. ~~`PATCH /api/subtasks/[id]` — persist done toggle~~ ✅ done (XP not yet awarded)
2. `user_stats` Supabase table — xp, level, streak_days, last_active_date
3. `lib/xp.ts` — XP constants + level calculation
4. `components/XPToast.tsx` — floating "+15 XP" animation on completion
5. `components/XPBar.tsx` — level + XP progress bar in desktop header
6. ~~Task card progress bar on canvas (done/total subtasks)~~ ✅ done
7. Streak tracking (daily active days)

### Zeno-specific mechanics
- **Activation bonus**: reward starting specifically, not just finishing — ADHD brains struggle most with initiation
- **Breakdown bonus**: incentivises the healthy habit of splitting before starting
- **Structure-aware bonuses**: Pipeline phases and Tree branches each fire a mini-bonus, reinforcing the structural mechanic
- **Canvas card glow**: cards on the desktop show a mini progress bar; golden glow at 100% done

---

## Design Philosophy
- The desktop feels like a calm personal space — not a productivity dashboard
- Cognitive load stays low: canvas shows just titles and icons; depth lives inside each item
- Reward small wins — every node completion should feel satisfying
- Bright, gamified aesthetic (cream background, yellow/purple/green/pink palette, Fraunces serif)
- Desktop-first for drag interactions; mobile-aware

---

## Data Model (actual, as of now)

### `tasks` table
```
id                    uuid pk, default gen_random_uuid()
user_id               uuid → auth.users (cascade delete)
text                  text
done                  boolean, default false
canvas_x              float (desktop position)
canvas_y              float
breakdown_structure   text ('linear' | 'tree' | 'star' | 'pipeline'), nullable
breakdown_xp_awarded  boolean, default false  ← to add in gamification phase
created_at            timestamptz
```

### `subtasks` table
```
id         uuid pk
task_id    uuid → tasks.id (cascade delete)
user_id    uuid → auth.users (for RLS)
text       text
done       boolean, default false
position   integer (ordering within structure)
parent_id  uuid? (null = root/phase; set = child in tree/pipeline)
created_at timestamptz
```

### `user_stats` table (to add in gamification phase)
```
user_id              uuid pk → auth.users
xp                   integer, default 0
level                integer, default 1
streak_days          integer, default 0
last_active_date     date
total_subtasks_done  integer, default 0
total_tasks_complete integer, default 0
updated_at           timestamptz
```

---

## API Routes (actual)

| Route | Method | Purpose |
|---|---|---|
| `/api/tasks` | `GET` | Fetch all tasks for the user |
| `/api/tasks` | `POST` | Create a new task |
| `/api/tasks/[id]` | `PATCH` | Update title, done, canvas position |
| `/api/tasks/[id]` | `DELETE` | Delete task + subtasks |
| `/api/tasks/[id]/split` | `POST` | AI breakdown: context → structure + subtasks (Gemini 2.5 Flash Lite) |
| `/api/tasks/[id]/subtasks` | `GET` | Fetch subtasks + structure for a task |
| `/api/tasks/[id]/subtasks` | `DELETE` | Clear all subtasks (reset to Context Panel) |
| `/api/subtasks/[id]` | `PATCH` | Toggle a subtask's done state |
| `/api/user-stats` | `GET` | Fetch user XP/level/streak ← **to build** |

---

## Key Files

| File | Purpose |
|---|---|
| `app/page.tsx` | Landing page (gamified marketing + auth form) |
| `app/layout.tsx` | Root layout; loads Fraunces, Geist, Geist Mono fonts |
| `app/tasks/page.tsx` | Desktop canvas (main app) |
| `app/api/tasks/route.ts` | GET + POST tasks |
| `app/api/tasks/[id]/route.ts` | PATCH + DELETE task |
| `app/api/tasks/[id]/split/route.ts` | AI breakdown endpoint |
| `app/api/tasks/[id]/subtasks/route.ts` | GET + DELETE subtasks |
| `components/TaskCard.tsx` | Draggable card on canvas |
| `components/TaskExpandedView.tsx` | Fullscreen task overlay |
| `components/ContextPanel.tsx` | Pre-breakdown input form |
| `components/StructureView.tsx` | 4 visual structure renderers |
| `lib/gemini.ts` | Gemini API wrapper (structured JSON output) |
| `lib/task-types.ts` | TypeScript types: Task, Subtask, Structure, UserStats |
| `lib/supabase-browser.ts` | Browser Supabase client |
| `lib/supabase-server.ts` | Server-side Supabase client (for API routes) |
| `supabase/schema.sql` | Tables + row level security policies (run once on a fresh project) |

---

## Build Order

1. ✅ Desktop canvas — drag-and-drop cards, create/delete, position persistence
2. ✅ Task view shell — fullscreen overlay, title, back button
3. ✅ Context panel — guided input (description + question chips + slider) + document dump
4. ✅ AI split endpoint — Gemini picks structure + generates subtasks, saved to Supabase
5. ✅ Structure visualisation — Linear, Tree, Star, Pipeline renderers with state-colour logic
6. ✅ Landing page — bright gamified design, Supabase auth, 4 animated structure previews
7. 🔜 **Gamification** — subtask persistence, XP system, level/streak tracking, completion animations
