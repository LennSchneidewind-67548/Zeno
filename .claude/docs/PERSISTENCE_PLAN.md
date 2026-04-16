# Persistence Plan — Saving Tasks Per User

## What we want to achieve

Right now, every task you add lives only in the browser's memory. The moment you refresh the page, everything is gone. We want to fix this so that:

1. Each visitor to the site has their own account
2. Their tasks are saved to a real database
3. When they come back — on any device, after any amount of time — their tasks are exactly where they left them

---

## The big picture before we dive in

Before looking at individual steps, here's the overall system we're building and how the pieces connect:

```
Browser (React)
    │
    │  HTTP requests (fetch)
    ▼
Next.js API Routes  ←── only these touch the database or secrets
    │
    ▼
Supabase
  ├── Auth  (handles login, sessions, user accounts)
  └── Database  (PostgreSQL table that stores tasks)
```

The browser never talks to the database directly. It only talks to our own API routes, which sit in the middle and do the database work. This is important for security — it means no database credentials ever reach the user's browser.

---

## Technology choice: Supabase

We'll use **Supabase** (supabase.com). Here's why it's the right pick for this project:

- **It handles both the database and user authentication in one place.** We don't need to wire two separate services together.
- **It has a generous free tier.** No credit card required to get started.
- **It's PostgreSQL under the hood.** PostgreSQL is a professional-grade database used by companies worldwide. What you learn here transfers directly to real-world projects.
- **It has a simple JavaScript SDK.** We can interact with it using clean, readable code rather than raw SQL in most cases.
- **It has a web UI.** You can look at your database tables in a browser like a spreadsheet, which makes it easy to verify things are working.

---

## Step 1 — Set up a Supabase project

**What this is:** Supabase is a cloud service. You create a "project" on their website and they spin up a dedicated PostgreSQL database for you.

**What to do:**
1. Go to supabase.com and create a free account
2. Click "New project"
3. Give it a name (e.g. "zeno"), choose a region close to you, set a strong database password (save it somewhere)
4. Wait ~2 minutes for it to provision

**What you get:** A live PostgreSQL database with a unique URL, and a set of API keys.

---

## Step 2 — Create the database table

**What this is:** A database is made up of tables. A table is like a spreadsheet — it has columns (the fields each row can have) and rows (the actual data entries). We need one table called `tasks`.

**What the table will look like:**

| column | type | description |
|---|---|---|
| `id` | `uuid` | A unique ID for each task, auto-generated |
| `user_id` | `uuid` | Which user this task belongs to (links to Supabase's built-in users table) |
| `text` | `text` | The task text the user typed |
| `done` | `boolean` | Whether the task is checked off |
| `due_date` | `timestamptz` | Optional due date |
| `priority` | `text` | "low", "medium", "high", or null |
| `created_at` | `timestamptz` | When the task was created, auto-filled |

**What to do:** In the Supabase web UI, go to the SQL editor and run this SQL statement:

```sql
create table tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  text       text not null,
  done       boolean not null default false,
  due_date   timestamptz,
  priority   text check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);
```

**What the SQL does, line by line:**
- `uuid primary key default gen_random_uuid()` — every task gets a unique ID automatically
- `uuid references auth.users(id) on delete cascade` — the user_id must match a real user; if the user is deleted, their tasks are deleted too
- `check (priority in ('low', 'medium', 'high'))` — the database itself enforces that only valid priority values can be stored

---

## Step 3 — Set up Row Level Security (RLS)

**What this is:** By default, Supabase's database is locked down — nobody can read or write to it from outside. We need to define rules that say "a logged-in user may only see and edit their own tasks". This is called Row Level Security (RLS).

**Why this matters:** Without RLS, a malicious user could potentially query the database and read *everyone's* tasks. With RLS, the database itself enforces that each user only ever sees rows where `user_id` matches their own ID. It's a second layer of protection beyond our application code.

**What to do:** In the Supabase SQL editor, run:

```sql
-- Turn on RLS for the tasks table
alter table tasks enable row level security;

-- Policy: users can only select their own tasks
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

-- Policy: users can only insert tasks for themselves
create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

-- Policy: users can only update their own tasks
create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

-- Policy: users can only delete their own tasks
create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);
```

**What `auth.uid()` is:** Supabase automatically knows who is making a request based on the session token the browser sends. `auth.uid()` returns that user's ID. So `using (auth.uid() = user_id)` means "only allow this if the requesting user's ID matches the row's user_id".

---

## Step 4 — Install the Supabase JavaScript SDK

**What this is:** An SDK (Software Development Kit) is a package that gives us JavaScript functions to talk to Supabase without writing raw HTTP requests ourselves.

**What to do:**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` — the core SDK for database queries
- `@supabase/ssr` — a helper specifically for Next.js that handles cookies and sessions correctly in a server-rendered app

---

## Step 5 — Store API credentials as environment variables

**What this is:** Our app needs a URL and an API key to talk to Supabase. We never want to hardcode these directly in our source code — they'd be visible to anyone who looks at the repo. Instead, we store them as *environment variables*, which are values that live outside the code in a special file.

**What to do:**

1. In the Supabase web UI, go to Project Settings → API. You'll find:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon/public key** — a long string starting with `eyJ...`

2. Create a file called `.env.local` at the root of the project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Why `NEXT_PUBLIC_`?** In Next.js, only environment variables that start with `NEXT_PUBLIC_` are sent to the browser. The Supabase URL and anon key are safe to expose to the browser — they're designed to be public. The anon key only gets access to what RLS policies allow, which is why setting up RLS in Step 3 is so important.

3. Make sure `.env.local` is in `.gitignore` (it already is by default in Next.js) so you never accidentally commit secrets.

---

## Step 6 — Create a Supabase client helper

**What this is:** We'll create a small utility file that sets up the Supabase connection. Rather than repeating the setup code everywhere, we write it once and import it wherever needed.

**New file: `lib/supabase.ts`**

This file will export two functions:
- `createBrowserClient()` — used inside React components (runs in the browser); handles reading/writing the session cookie automatically
- `createServerClient()` — used inside API routes (runs on the server); also reads the session from cookies, but using Next.js's server-side cookie APIs

We use two different clients because the browser and the server have different ways of accessing cookies. The `@supabase/ssr` package handles this complexity for us.

---

## Step 7 — Add authentication

**What this is:** Authentication is the process of knowing *who* a user is. We need users to log in so we can associate their tasks with their account.

**Chosen approach: Email + password**

We'll use the simplest approach — a user enters their email and password, Supabase verifies it and hands back a session token (a long secret string). That token gets stored in a cookie in the browser. On every subsequent request, the browser sends that cookie, so both our API routes and Supabase know who is making the request.

**New files we'll create:**

- `app/login/page.tsx` — a login/sign-up page with a simple form (email + password + a toggle between "log in" and "create account")

**What happens when a user signs up:**
1. They type their email and password
2. We call `supabase.auth.signUp({ email, password })`
3. Supabase creates a new entry in its internal `auth.users` table and emails a confirmation link
4. Once confirmed, they're logged in and get a session cookie

**What happens when a user logs in:**
1. They type their email and password
2. We call `supabase.auth.signInWithPassword({ email, password })`
3. Supabase verifies the credentials and returns a session
4. The session is stored in a cookie — all future requests are authenticated

**Session persistence:** The `@supabase/ssr` package automatically refreshes the session token before it expires, so users stay logged in indefinitely unless they explicitly sign out.

**What we'll add to `app/layout.tsx`:**
A check on the server side: if no session cookie exists, redirect to `/login`. This protects the main page so only logged-in users can see it.

---

## Step 8 — Create API routes

**What this is:** Currently, all task operations (add, toggle, delete, etc.) happen purely in React state — they never leave the browser. We need to create *API routes*, which are server-side endpoints that our React code will call to read from and write to the database.

An API route is a file inside `app/api/` that exports a function. When the browser makes an HTTP request to that URL, Next.js runs the function on the server.

**New file: `app/api/tasks/route.ts`**

This single file will handle multiple operations based on the HTTP method:

- **`GET /api/tasks`** — fetch all tasks for the logged-in user
  - Reads the session from cookies to know who is asking
  - Queries the `tasks` table in Supabase (RLS ensures only their rows are returned)
  - Returns the tasks as JSON

- **`POST /api/tasks`** — create a new task
  - Reads the request body (the task text)
  - Inserts a new row into `tasks` with the user's ID, the text, and defaults for `done`, etc.
  - Returns the newly created task (including its database-generated `id`)

**New file: `app/api/tasks/[id]/route.ts`**

The `[id]` in the folder name is a *dynamic segment* — it matches any URL like `/api/tasks/some-uuid`. This file handles operations on a specific task:

- **`PATCH /api/tasks/[id]`** — update a task (toggle done, change priority, set due date)
  - Reads which fields to update from the request body
  - Updates only that row in Supabase (RLS prevents touching other users' tasks)

- **`DELETE /api/tasks/[id]`** — delete a task
  - Deletes the row with that ID from Supabase

---

## Step 9 — Update the frontend to use the API

**What this is:** Right now `app/page.tsx` manages tasks entirely with `useState`. We need to change it so that every action goes through the API routes we just created.

**Changes to `app/page.tsx`:**

1. **On page load — fetch tasks from the API**
   - Use `useEffect` to call `GET /api/tasks` when the component mounts
   - Set the fetched tasks into state
   - Show a loading indicator while waiting

2. **Adding a task — POST to the API**
   - Instead of doing `setTasks(prev => [...prev, newTask])` directly, call `POST /api/tasks` with the task text
   - When the response comes back with the real task (including its database-generated UUID), add *that* to state
   - This ensures our local state's IDs always match the database

3. **Toggling done / changing priority / setting due date — PATCH the API**
   - After updating local state optimistically (so the UI feels instant), also call `PATCH /api/tasks/[id]` with the changed fields
   - "Optimistic update" means: update the UI immediately, and assume the server will agree. This prevents a noticeable lag.

4. **Deleting a task — DELETE the API**
   - Same pattern: remove from local state immediately, call `DELETE /api/tasks/[id]` in the background

---

## Step 10 — Add a sign-out button

**What this is:** Users need a way to log out. We'll add a small "Sign out" button somewhere unobtrusive on the main page.

**What it does:** Calls `supabase.auth.signOut()`, which clears the session cookie, then redirects to `/login`.

---

## Summary: files being created or changed

| File | Change |
|---|---|
| `.env.local` | New — Supabase URL and anon key |
| `lib/supabase.ts` | New — browser and server Supabase client helpers |
| `app/login/page.tsx` | New — login/sign-up form |
| `app/layout.tsx` | Modified — add session check, redirect to login if unauthenticated |
| `app/api/tasks/route.ts` | New — GET (list) and POST (create) endpoints |
| `app/api/tasks/[id]/route.ts` | New — PATCH (update) and DELETE endpoints |
| `app/page.tsx` | Modified — replace in-memory state with API calls |

---

## What the flow looks like end-to-end after all this

1. User visits the site → server checks for a session cookie → none found → redirect to `/login`
2. User signs up with email + password → Supabase creates their account → session cookie set → redirect to `/`
3. Page loads → `useEffect` fires → `GET /api/tasks` → API route queries Supabase → returns their tasks → rendered on screen
4. User adds a task → `POST /api/tasks` → row inserted in database → new task (with real ID) added to state
5. User checks a task off → local state updated immediately → `PATCH /api/tasks/[id]` sent in background → database updated
6. User refreshes the page → step 3 repeats → their tasks are back
7. User signs out → session cookie cleared → redirected to `/login`
