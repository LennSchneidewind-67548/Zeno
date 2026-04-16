# app/

Next.js App Router directory. Every file here either renders a page, defines a layout, or handles an API request. Next.js uses the folder structure here to determine URL routes automatically.

| File / Folder | What it does |
|---|---|
| `layout.tsx` | The root HTML shell — wraps every page. Sets the font, page title, and global styles. |
| `page.tsx` | The home page (`/`). Currently contains the full to-do list UI. |
| `globals.css` | Global CSS entry point. Loads Tailwind v4 and defines CSS variables (colors, fonts). |
| `api/tasks/route.ts` | `GET` — list tasks for logged-in user. `POST` — create a task. |
| `api/tasks/[id]/route.ts` | `PATCH` — update a task (done/priority/dueDate). `DELETE` — delete a task. |
| `login/page.tsx` | Login / sign-up page. Unauthenticated users are redirected here by `proxy.ts`. |
