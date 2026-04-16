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

// PATCH /api/tasks/[id] — update fields on a task
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Map camelCase from the frontend to snake_case for the database
  const fields: Record<string, unknown> = {};
  if (typeof body.done === "boolean") fields.done = body.done;
  if ("priority" in body) fields.priority = body.priority ?? null;
  if ("dueDate" in body) fields.due_date = body.dueDate ?? null;

  const { data, error } = await supabase
    .from("tasks")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(toClientTask(data as DbTask));
}

// DELETE /api/tasks/[id] — delete a task
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
