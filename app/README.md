# app/

Next.js App Router directory. Every file here either renders a page, defines a layout, or handles an API request. Next.js derives the URL routes from this folder structure.

| File / Folder | What it does |
|---|---|
| `layout.tsx` | Root HTML shell — wraps every page. Loads Fraunces, Geist Sans, and Geist Mono. |
| `page.tsx` | Landing page (`/`). Marketing content plus the Supabase email/password auth form. Redirects to `/tasks` once signed in. |
| `tasks/page.tsx` | The spatial desktop (`/tasks`) — the actual app. Draggable cards, task creation, and the fullscreen overlay. |
| `globals.css` | Global CSS entry point. Loads Tailwind v4 and defines the base theme variables. |
| `api/tasks/route.ts` | `GET` — list the user's tasks with subtask counts. `POST` — create a task. |
| `api/tasks/[id]/route.ts` | `PATCH` — update a task (done / canvas position). `DELETE` — delete a task and its subtasks. |
| `api/tasks/[id]/split/route.ts` | `POST` — build the prompt, call Gemini, and persist the returned breakdown. |
| `api/tasks/[id]/subtasks/route.ts` | `GET` — fetch a task's structure and subtasks. `DELETE` — clear the breakdown ("Start over"). |
| `api/subtasks/[id]/route.ts` | `PATCH` — persist a single node's done state. |

Unauthenticated requests to `/tasks` are redirected to `/` by `proxy.ts` at the repo root.
