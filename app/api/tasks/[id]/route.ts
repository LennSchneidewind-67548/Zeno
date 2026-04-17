import { getServerClient } from "@/lib/supabase-server";
import { DbTask, toClientTask } from "@/lib/task-types";

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

  const fields: Record<string, unknown> = {};
  if (typeof body.done === "boolean") fields.done = body.done;
  if ("priority" in body) fields.priority = body.priority ?? null;
  if ("dueDate" in body) fields.due_date = body.dueDate ?? null;
  if (typeof body.x === "number") fields.canvas_x = body.x;
  if (typeof body.y === "number") fields.canvas_y = body.y;

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
