import { getServerClient } from "@/lib/supabase-server";
import { toClientSubtask, type DbSubtask } from "@/lib/task-types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get the task's breakdown_structure
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("breakdown_structure")
    .eq("id", id)
    .single();

  if (taskError || !task || !task.breakdown_structure) {
    return Response.json(null);
  }

  const { data: subtasks, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", id)
    .order("position");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    structure: task.breakdown_structure,
    subtasks: (subtasks as DbSubtask[]).map(toClientSubtask),
  });
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

  await supabase.from("subtasks").delete().eq("task_id", id);
  await supabase
    .from("tasks")
    .update({ breakdown_structure: null })
    .eq("id", id);

  return new Response(null, { status: 204 });
}
