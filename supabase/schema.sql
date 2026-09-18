-- Zeno database schema
--
-- Run this once in the Supabase SQL editor on a fresh project.
-- Row level security is the only thing standing between users' data and the
-- public anon key, so every table has it enabled with owner-only policies.

-- ── tasks ────────────────────────────────────────────────────────────────────
-- One row per card on the spatial desktop.

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  text                text not null,
  done                boolean not null default false,
  due_date            timestamptz,
  priority            text check (priority in ('low', 'medium', 'high')),
  -- Where the card sits on the canvas. Null until first placed.
  canvas_x            double precision,
  canvas_y            double precision,
  -- Null until the AI has broken the task down.
  breakdown_structure text check (breakdown_structure in ('linear', 'tree', 'star', 'pipeline')),
  created_at          timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- ── subtasks ─────────────────────────────────────────────────────────────────
-- The nodes of a breakdown. For tree and pipeline structures the rows with
-- parent_id = null are section/phase headings rather than work items; the
-- rows pointing at them are the actual subtasks.

create table if not exists public.subtasks (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  -- Denormalised from tasks so RLS can check ownership without a join.
  user_id    uuid not null references auth.users (id) on delete cascade,
  text       text not null,
  done       boolean not null default false,
  position   integer not null default 0,
  parent_id  uuid references public.subtasks (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists subtasks_task_id_idx on public.subtasks (task_id);
create index if not exists subtasks_user_id_idx on public.subtasks (user_id);

-- ── Row level security ───────────────────────────────────────────────────────

alter table public.tasks    enable row level security;
alter table public.subtasks enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own subtasks" on public.subtasks;
create policy "Users manage their own subtasks"
  on public.subtasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
