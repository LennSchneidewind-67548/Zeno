# Project: Zeno

## What is this?

Zeno is an ADHD-friendly productivity app. The core problem it solves: people with ADHD struggle to start large tasks because they feel overwhelming. Zeno lets users capture tasks and projects on a spatial desktop, then break them down automatically using AI into a visual structure — tree, star, or linear — that makes it obvious where to start.

---

## The Three Layers

### Layer 1 — Landing Page (done)
Dark atmospheric page with the Zeno lamp animation. Login / sign-up form is embedded. On success the user lands on the Desktop.

---

### Layer 2 — The Desktop

After logging in the user sees a **spatial canvas** — think a personal desktop. It is mostly empty space where items live as draggable cards.

**Items**
- Each item is a small box with an icon and a title
- Two types: **Task** (single thing to get done) and **Project** (a larger goal containing multiple tasks)
- Items can be freely dragged around the canvas and repositioned
- Clicking "+ New" (or equivalent) creates a new item and drops it onto the canvas
- Items persist their position in the database so the layout is restored on next visit

**Interactions**
- Drag to reposition
- Click to open (enters Layer 3 — the Item View)
- Fun physics / snap behaviour to be designed later
- Animations and ambient effects to be layered on later

**What is NOT here**
- No traditional list view
- No sidebar, no folders, no hierarchy at this layer — the canvas is flat

---

### Layer 3 — The Item View (fullscreen)

Clicking any item on the desktop opens it fullscreen. This is where all the depth lives.

#### 3a — Before breakdown: the Context Panel

The item opens showing its title and a prompt to generate a breakdown. The user has two ways to provide context:

**Option A — Guided input**
A panel with three components:
1. **Workflow description** — free-text field: "How do you usually approach this kind of thing? Any tools, constraints, or habits?"
2. **Clarifying question chips** — as soon as the panel opens a background call fires to the AI using just the item title. It returns ~5 short questions (e.g. "Is there a deadline?", "Do you need to do research first?"). Each appears as a clickable chip; tapping one appends it as context without the user having to type.
3. **Detail level slider** — controls how granular the breakdown should be (roughly maps to target number of subtasks, e.g. 3–15).

**Option B — Document / conversation dump**
A large text area where the user can paste any existing content: a full LLM conversation, a brainstorm doc, meeting notes, a voice transcript. The AI uses this as the primary context instead of the guided fields. Both options can be combined.

#### 3b — After breakdown: the Structure View

Once the user submits, the input is assembled into a prompt. The AI does two things in one call:
1. **Picks a structure** based on the task's nature:
   - **Linear** — steps that must happen in sequence
   - **Tree** — hierarchical, some subtasks depend on others
   - **Star** — one central goal, independent subtasks that can be done in any order
2. **Generates the subtasks** using the chosen structure and all provided context

The response (structured JSON) is saved to the database. The panel closes and the **entire screen** becomes the structure visualisation:
- **Linear**: a clean vertical sequence, numbered
- **Tree**: a node graph with dependency arrows
- **Star**: the parent node in the centre, subtasks radiating outward

Each node in the visualisation is a checkbox. Checking one marks it done, awards XP (gamification, planned), and dims the node.

---

## Gamification (planned)
- Completing a subtask awards XP
- Completing all subtasks of an item awards a bonus multiplier
- XP accumulates toward levels / milestones
- Satisfying completion animations and sounds — important for dopamine feedback

---

## Design Philosophy
- The desktop should feel like a calm, personal space — not a productivity dashboard
- Cognitive load stays low: the canvas shows just titles and icons, depth lives inside each item
- Reward small wins — every node completion should feel good
- Mobile-aware but desktop-first for the canvas (drag interactions)

---

## Data Model

### `items` table (replaces `tasks`)
```
id           uuid pk
user_id      uuid → auth.users
type         text  ('task' | 'project')
title        text
icon         text  (emoji or icon key)
canvas_x     float  (desktop position)
canvas_y     float
created_at   timestamptz
```

### `subtasks` table
```
id           uuid pk
item_id      uuid → items.id (cascade delete)
user_id      uuid → auth.users (for RLS)
text         text
done         boolean
position     integer
parent_id    uuid?   (null = root; set = child node in a tree)
structure    text    ('linear' | 'tree' | 'star')
created_at   timestamptz
```

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/items` | `GET` | Fetch all items for the user (desktop load) |
| `/api/items` | `POST` | Create a new item |
| `/api/items/[id]` | `PATCH` | Update title, icon, canvas position |
| `/api/items/[id]` | `DELETE` | Delete item and its subtasks |
| `/api/items/[id]/questions` | `POST` | Given the item title, return ~5 clarifying questions |
| `/api/items/[id]/split` | `POST` | Full breakdown: context + detail level → structure + subtasks |
| `/api/subtasks/[id]` | `PATCH` | Toggle done, update text |
| `/api/subtasks/[id]` | `DELETE` | Remove a subtask node |

---

## Build Order

1. **Desktop canvas** — drag-and-drop item cards, create/delete, position persistence
2. **Item view shell** — fullscreen overlay, title, back button
3. **Context panel** — guided input (description + questions + slider) and document dump
4. **AI split endpoint** — structure selection + subtask generation
5. **Structure visualisation** — linear, tree, and star renderers
6. **Gamification** — XP, completion animations
