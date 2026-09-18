import { getServerClient } from "@/lib/supabase-server";
import { splitTask } from "@/lib/gemini";
import { toClientSubtask, type DbSubtask } from "@/lib/task-types";

type DetailLevel = "low" | "medium" | "high";

function buildPrompt(
  title: string,
  description: string,
  chips: string[],
  detailLevel: DetailLevel,
  dumpText: string
): string {
  const countMap: Record<DetailLevel, string> = {
    low: "3–5",
    medium: "7–9",
    high: "12–15",
  };

  const lines: string[] = [
    `You are helping someone with ADHD break down a task into manageable subtasks.`,
    ``,
    `Task: "${title}"`,
  ];

  if (description.trim()) lines.push(`Workflow: ${description.trim()}`);
  if (chips.length > 0) lines.push(`Context: ${chips.join("; ")}`);
  if (dumpText.trim()) lines.push(`Additional material: ${dumpText.trim()}`);

  lines.push(
    ``,
    `Target subtask count: ${countMap[detailLevel]}.`,
    ``,
    `Choose the best structure for this task:`,
    `- "linear": numbered steps that must happen in strict sequence`,
    `- "star": independent tasks, any order, all equally valid starting points`,
    `- "tree": 2–3 main sections, each with 2–4 subtasks (parent_id links children to section root)`,
    `- "pipeline": 2–4 sequential phases, parallel tasks within each phase (same shape as tree — roots = phases, children = tasks)`,
    ``,
    `Rules:`,
    `- Keep each subtask under 10 words`,
    `- Focus on action, not explanation`,
    `- For tree/pipeline: root nodes (parent_id omitted or null) are section/phase labels, NOT tasks themselves`,
    `- For tree/pipeline: add a "temp_id" field like "s1", "s2"... to root nodes so children can reference them via parent_id`
  );

  return lines.join("\n");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as {
    description?: string;
    selectedChips?: string[];
    detailLevel?: DetailLevel;
    dumpText?: string;
  };

  // Fetch task title
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("text")
    .eq("id", id)
    .single();

  if (taskError || !task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const prompt = buildPrompt(
    task.text,
    body.description ?? "",
    body.selectedChips ?? [],
    body.detailLevel ?? "medium",
    body.dumpText ?? ""
  );

  let aiResult: Awaited<ReturnType<typeof splitTask>>;
  try {
    aiResult = await splitTask(prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }

  // Delete existing subtasks (re-run support)
  await supabase.from("subtasks").delete().eq("task_id", id);

  const { structure, subtasks } = aiResult;

  // Two-pass insert for tree/pipeline structures with temp_id references
  const tempIdToRealId = new Map<string, string>();

  // Pass 1: insert root nodes (parent_id null / undefined)
  const roots = subtasks.filter((s) => !s.parent_id);
  if (roots.length > 0) {
    const { data: insertedRoots, error: rootsError } = await supabase
      .from("subtasks")
      .insert(
        roots.map((s) => ({
          task_id: id,
          user_id: user.id,
          text: s.text,
          position: s.position,
          parent_id: null,
        }))
      )
      .select();

    if (rootsError) {
      return Response.json({ error: rootsError.message }, { status: 500 });
    }

    // Map temp_id → real UUID
    roots.forEach((s, i) => {
      if (s.temp_id && insertedRoots[i]) {
        tempIdToRealId.set(s.temp_id, insertedRoots[i].id);
      }
    });
  }

  // Pass 2: insert child nodes with resolved parent_id
  const children = subtasks.filter((s) => s.parent_id);
  if (children.length > 0) {
    const { error: childrenError } = await supabase.from("subtasks").insert(
      children.map((s) => ({
        task_id: id,
        user_id: user.id,
        text: s.text,
        position: s.position,
        parent_id: tempIdToRealId.get(s.parent_id!) ?? s.parent_id ?? null,
      }))
    );

    if (childrenError) {
      return Response.json({ error: childrenError.message }, { status: 500 });
    }
  }

  // Update tasks.breakdown_structure
  await supabase
    .from("tasks")
    .update({ breakdown_structure: structure })
    .eq("id", id);

  // Fetch and return all inserted subtasks
  const { data: allSubtasks, error: fetchError } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", id)
    .order("position");

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  return Response.json({
    structure,
    subtasks: (allSubtasks as DbSubtask[]).map(toClientSubtask),
  });
}
