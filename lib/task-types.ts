export type Priority = "low" | "medium" | "high";

export type DbTask = {
  id: string;
  text: string;
  done: boolean;
  due_date: string | null;
  priority: Priority | null;
  created_at: string;
  canvas_x: number | null;
  canvas_y: number | null;
};

export type ClientTask = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: Date;
  priority?: Priority;
  x: number | null;
  y: number | null;
};

export function toClientTask(row: DbTask): ClientTask {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    priority: row.priority ?? undefined,
    x: row.canvas_x,
    y: row.canvas_y,
  };
}
