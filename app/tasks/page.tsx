"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import { useCanvasPhysics, type PositionUpdate } from "@/hooks/useCanvasPhysics";
import { TaskCard } from "@/components/TaskCard";
import type { Priority, ClientTask } from "@/lib/task-types";

type Task = ClientTask;

function parseTask(raw: Task & { dueDate?: string | Date }): Task {
  return {
    ...raw,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
    x: typeof raw.x === "number" ? raw.x : null,
    y: typeof raw.y === "number" ? raw.y : null,
  };
}

function resolvedPosition(task: Task, index: number): { x: number; y: number } {
  if (task.x !== null && task.y !== null) return { x: task.x, y: task.y };
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: window.innerWidth / 2 - 112 + col * 240 - 360,
    y: window.innerHeight / 2 - 80 + row * 180 - 180,
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ── Position persistence ───────────────────────────────────────

  const savePositions = useCallback((updates: PositionUpdate[]) => {
    for (const { id, x, y } of updates) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
      fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
      });
    }
  }, []);

  const {
    initCard,
    pruneCards,
    getMotionValues,
    registerHeight,
    handlePointerDown,
    draggingId,
  } = useCanvasPhysics(savePositions);

  // ── Data loading ──────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => {
        if (res.status === 401) { router.replace("/"); return null; }
        return res.json();
      })
      .then((data: Task[] | null) => {
        if (data) setTasks(data.map(parseTask));
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Initialize motion values once tasks and DOM are ready
  useEffect(() => {
    if (loading || initialized) return;
    tasks.forEach((task, index) => {
      const pos = resolvedPosition(task, index);
      initCard(task.id, pos.x, pos.y);
    });
    setInitialized(true);
  }, [loading, initialized, tasks, initCard]);

  // Keep physics map in sync with tasks list
  useEffect(() => {
    if (!initialized) return;
    const activeIds = new Set(tasks.map((t) => t.id));
    pruneCards(activeIds);
    // Init any newly added tasks
    tasks.forEach((task, index) => {
      const pos = resolvedPosition(task, index);
      initCard(task.id, pos.x, pos.y);
    });
  }, [tasks, initialized, initCard, pruneCards]);

  // ── Task operations ──────────────────────────────────────────

  async function signOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function addTask() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    const newTask = await res.json();
    setTasks((prev) => [...prev, parseTask(newTask)]);
  }

  function setDueDate(id: string, date: Date) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: date } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: date.toISOString() }),
    });
  }

  function setPriority(id: string, priority: Priority) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <span className="text-slate-500 text-sm font-medium tracking-widest uppercase">Zeno</span>
        <button onClick={signOut} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          Sign out
        </button>
      </div>

      {/* Cards */}
      {initialized && tasks.map((task) => {
        const mv = getMotionValues(task.id);
        if (!mv) return null;
        return (
          <TaskCard
            key={task.id}
            task={task}
            x={mv.x}
            y={mv.y}
            isDragging={draggingId === task.id}
            onPointerDown={(e) => handlePointerDown(task.id, e)}
            registerHeight={registerHeight}
            onSetDueDate={setDueDate}
            onSetPriority={setPriority}
          />
        );
      })}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-700">Loading…</p>
        </div>
      )}

      {/* Floating input */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl px-5 py-3 shadow-2xl shadow-black/60 w-80">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
            placeholder="Add a task…"
            className="w-full bg-transparent text-white placeholder:text-slate-600 text-sm outline-none caret-cyan-400"
          />
        </div>
      </div>

    </div>
  );
}
