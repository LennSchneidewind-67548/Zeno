import { getServerClient } from "@/lib/supabase-server";
import { DbTask, toClientTask } from "@/lib/task-types";

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
    .insert({
      text,
      user_id: user.id,
      done: false,
      canvas_x: 600 + (Math.random() * 120 - 60),
      canvas_y: 300 + (Math.random() * 120 - 60),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(toClientTask(data as DbTask), { status: 201 });
}
