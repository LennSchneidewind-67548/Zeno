import { getServerClient } from "@/lib/supabase-server";
import { toClientSubtask, type DbSubtask } from "@/lib/task-types";

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

  if (typeof body.done !== "boolean") {
    return Response.json({ error: "done (boolean) is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("subtasks")
    .update({ done: body.done })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(toClientSubtask(data as DbSubtask));
}
