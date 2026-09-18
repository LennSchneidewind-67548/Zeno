export type Priority = "low" | "medium" | "high";
export type Structure = "linear" | "star" | "tree" | "pipeline";

export type DbTask = {
  id: string;
  text: string;
  done: boolean;
  due_date: string | null;
  priority: Priority | null;
  created_at: string;
  canvas_x: number | null;
  canvas_y: number | null;
  breakdown_structure: Structure | null;
  // Present only when the query embeds them (see GET /api/tasks).
  subtasks?: { done: boolean; parent_id: string | null }[];
};

export type TaskProgress = { done: number; total: number };

export type ClientTask = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: Date;
  priority?: Priority;
  x: number | null;
  y: number | null;
  breakdownStructure?: Structure;
  /** null when the task has not been broken down (or counts were not requested). */
  progress: TaskProgress | null;
};

/**
 * Count only the nodes a user can actually tick off.
 *
 * Tree and pipeline breakdowns store their section/phase labels as root rows
 * (parent_id === null) — those are headings, not work. When any child rows
 * exist, the leaves are the real subtasks; linear and star breakdowns are flat,
 * so every row counts.
 */
export function countProgress(
  rows: { done: boolean; parent_id: string | null }[]
): TaskProgress | null {
  if (rows.length === 0) return null;
  const children = rows.filter((r) => r.parent_id !== null);
  const leaves = children.length > 0 ? children : rows;
  return { done: leaves.filter((r) => r.done).length, total: leaves.length };
}

export function toClientTask(row: DbTask): ClientTask {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    priority: row.priority ?? undefined,
    x: row.canvas_x,
    y: row.canvas_y,
    breakdownStructure: row.breakdown_structure ?? undefined,
    progress: row.subtasks ? countProgress(row.subtasks) : null,
  };
}

export type DbSubtask = {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  done: boolean;
  position: number;
  parent_id: string | null;
  created_at: string;
};

export type ClientSubtask = {
  id: string;
  text: string;
  done: boolean;
  position: number;
  parentId: string | null;
};

export function toClientSubtask(row: DbSubtask): ClientSubtask {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    position: row.position,
    parentId: row.parent_id,
  };
}
