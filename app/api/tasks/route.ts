import { getServerClient } from "@/lib/supabase-server";

type DbTask = {
  id: string;
  text: string;
  done: boolean;
  due_date: string | null;
  priority: "low" | "medium" | "high" | null;
  created_at: string;
};

function toClientTask(row: DbTask) {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    priority: row.priority ?? undefined,
  };
}

// GET /api/tasks — fetch all tasks for the logged-in user
export async function GET() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json((data as DbTask[]).map(toClientTask));
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({ text, user_id: user.id, done: false })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(toClientTask(data as DbTask), { status: 201 });
}
