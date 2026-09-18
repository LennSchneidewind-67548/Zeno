"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { getBrowserClient } from "@/lib/supabase-browser";
import { TaskCard } from "@/components/TaskCard";
import type { CardHandle } from "@/components/TaskCard";
import { TaskExpandedView } from "@/components/TaskExpandedView";
import type { ClientTask } from "@/lib/task-types";

type Task = ClientTask;

function parseTask(raw: Task & { dueDate?: string | Date }): Task {
  return {
    ...raw,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
    x: typeof raw.x === "number" ? raw.x : null,
    y: typeof raw.y === "number" ? raw.y : null,
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Card handles give us setTarget (motion value) + getPosition (current spring pos)
  const cardHandles = useRef<Map<string, CardHandle>>(new Map());
  // Drag state lives in a ref — updated every frame without triggering re-renders
  const draggingRef = useRef<{
    id: string; dx: number; dy: number; startX: number; startY: number;
  } | null>(null);

  // ── Load tasks ────────────────────────────────────────────────
  // Never rejects — callers treat a failed refresh as "keep showing what we have".
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.status === 401) { router.replace("/"); return; }
      if (!res.ok) return;
      const parsed: Task[] = (await res.json() as Task[]).map(parseTask);
      setTasks(parsed);
      // Seed a position for any card that doesn't have one yet. Cards already
      // on screen keep theirs, so a refetch never yanks them out from under a drag.
      setPositions((prev) => {
        const next = { ...prev };
        parsed.forEach((task, i) => {
          if (next[task.id]) return;
          next[task.id] = {
            x: task.x ?? (80 + (i % 4) * 230),
            y: task.y ?? (100 + Math.floor(i / 4) * 170),
          };
        });
        return next;
      });
    } catch {
      // Offline or the request was aborted — leave the current cards in place.
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  // ── Drag — runs once, reads from refs so no stale closures ────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const x = Math.max(0, e.clientX - d.dx);
      const y = Math.max(64, e.clientY - d.dy);
      // Update motion value directly — no React state, no re-render
      cardHandles.current.get(d.id)?.setTarget(x, y);
    };

    const onUp = (e: MouseEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      draggingRef.current = null;
      setDraggingId(null);

      if (dist < 5) {
        const handle = cardHandles.current.get(d.id);
        if (handle?.el) setExpandedTask({ id: d.id, rect: handle.el.getBoundingClientRect() });
      } else {
        const x = Math.max(0, e.clientX - d.dx);
        const y = Math.max(64, e.clientY - d.dy);
        setPositions((prev) => ({ ...prev, [d.id]: { x, y } }));
        fetch(`/api/tasks/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x, y }),
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []); // empty deps — all state accessed via refs

  // Stable mousedown handler — reads current spring position from card handle
  const onCardMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const handle = cardHandles.current.get(id);
    const pos = handle?.getPosition() ?? positions[id];
    if (!pos) return;
    draggingRef.current = {
      id,
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      startX: e.clientX,
      startY: e.clientY,
    };
    setDraggingId(id);
  }, [positions]);

  // ── Task operations ──────────────────────────────────────────
  async function signOut() {
    await getBrowserClient().auth.signOut();
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
    const newTask = parseTask(await res.json());
    setTasks((prev) => [...prev, newTask]);
    // Use the position the server assigned, so the card sits where it will
    // reappear on reload instead of jumping to a different spot.
    setPositions((prev) => ({
      ...prev,
      [newTask.id]: { x: newTask.x ?? 600, y: newTask.y ?? 300 },
    }));
  }

  function toggleDone(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const done = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setPositions((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setExpandedTask(null);
    fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  const expandedTaskData = expandedTask ? tasks.find((t) => t.id === expandedTask.id) : null;

  // Closing the overlay is the moment breakdown progress may have changed —
  // refetch so the canvas cards and header count stay truthful.
  function closeExpanded() {
    setExpandedTask(null);
    loadTasks();
  }

  const summary = tasks.reduce(
    (acc, t) => t.progress
      ? { done: acc.done + t.progress.done, total: acc.total + t.progress.total }
      : acc,
    { done: 0, total: 0 }
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: `
          radial-gradient(800px circle at 15% 5%, oklch(0.88 0.12 85 / 0.25), transparent 60%),
          radial-gradient(900px circle at 95% 30%, oklch(0.78 0.14 300 / 0.18), transparent 55%),
          radial-gradient(700px circle at 50% 100%, oklch(0.82 0.13 155 / 0.18), transparent 60%),
          oklch(0.97 0.018 92)
        `,
        color: "oklch(0.20 0.025 285)",
        fontFamily: "var(--font-geist-sans), ui-sans-serif, sans-serif",
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, oklch(0.20 0.025 285 / 0.07) 1px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Floating header pill */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3"
        style={{
          padding: "10px 10px 10px 18px",
          background: "oklch(0.99 0 0 / 0.8)",
          backdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid oklch(0.20 0.025 285 / 0.1)",
          borderRadius: 999,
          boxShadow: "0 10px 30px -10px oklch(0.20 0.025 285 / 0.15)",
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2"
          style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 9, flexShrink: 0,
            background: "linear-gradient(135deg, oklch(0.85 0.16 85), oklch(0.72 0.18 72))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "oklch(0.20 0.025 285)", fontWeight: 700, fontSize: 13,
            fontFamily: "var(--font-geist-sans), sans-serif",
          }}>Z</div>
          Zeno
        </div>

        {/* Live count of completed subtasks across every broken-down task */}
        {summary.total > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 13px", borderRadius: 999,
            background: "oklch(0.95 0.08 85)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11, color: "oklch(0.35 0.12 72)",
            fontWeight: 500, letterSpacing: "0.04em", whiteSpace: "nowrap",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.72 0.18 72)", display: "inline-block" }} />
            {summary.done}/{summary.total} steps done
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            padding: "8px 14px", borderRadius: 999, border: "none",
            background: "transparent", cursor: "pointer",
            fontSize: 13, color: "oklch(0.42 0.02 285)", whiteSpace: "nowrap",
          }}
        >
          Sign out
        </button>
      </div>

      {/* Task cards */}
      {!loading && tasks.map((task) => {
        const pos = positions[task.id];
        if (!pos) return null;
        return (
          <TaskCard
            key={task.id}
            task={task}
            initialX={pos.x}
            initialY={pos.y}
            isDragging={draggingId === task.id}
            isExpanded={expandedTask?.id === task.id}
            onMouseDown={(e) => onCardMouseDown(task.id, e)}
            registerCard={(handle) =>
              handle
                ? cardHandles.current.set(task.id, handle)
                : cardHandles.current.delete(task.id)
            }
          />
        );
      })}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p style={{ fontSize: 13, color: "oklch(0.42 0.02 285)" }}>Loading…</p>
        </div>
      )}

      {/* Empty desktop — point at the one thing there is to do */}
      {!loading && tasks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          <div style={{
            width: 52, height: 52, borderRadius: 16, marginBottom: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "oklch(0.30 0.14 72)",
            background: "linear-gradient(135deg, oklch(0.90 0.14 85), oklch(0.72 0.18 72))",
            boxShadow: "0 10px 30px -10px oklch(0.72 0.18 72 / 0.5)",
          }}>●</div>
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif",
            fontVariationSettings: '"SOFT" 60, "opsz" 48',
            fontSize: 26, fontWeight: 450, letterSpacing: "-0.02em",
            marginBottom: 8, color: "oklch(0.20 0.025 285)",
          }}>
            Your desktop is empty.
          </h2>
          <p style={{ fontSize: 14, maxWidth: 340, lineHeight: 1.5, color: "oklch(0.48 0.02 285)" }}>
            Drop a task below — even a vague one. Zeno will break it into a shape
            you can start from.
          </p>
        </div>
      )}

      {/* Task expanded overlay */}
      <AnimatePresence>
        {expandedTask && expandedTaskData && (
          <TaskExpandedView
            key={expandedTask.id}
            task={expandedTaskData}
            originRect={expandedTask.rect}
            onClose={closeExpanded}
            onToggleDone={() => toggleDone(expandedTask.id)}
            onDelete={() => deleteTask(expandedTask.id)}
          />
        )}
      </AnimatePresence>

      {/* Floating input bar */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
          expandedTask ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100"
        }`}
      >
        <div
          className="flex items-center gap-3"
          style={{
            background: "oklch(0.99 0 0 / 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid oklch(0.20 0.025 285 / 0.12)",
            borderRadius: 999,
            padding: "10px 10px 10px 20px",
            boxShadow: "0 20px 40px -10px oklch(0.20 0.025 285 / 0.2)",
            width: 360,
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
            placeholder="Drop a task on your desktop…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "oklch(0.20 0.025 285)",
              fontFamily: "var(--font-geist-sans), sans-serif",
            }}
          />
          <button
            onClick={addTask}
            style={{
              padding: "9px 18px", borderRadius: 999, border: "none",
              background: "oklch(0.20 0.025 285)", color: "oklch(0.97 0.018 92)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-geist-sans), sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 6px 16px -4px oklch(0.20 0.025 285 / 0.4)",
            }}
          >
            + Drop it
          </button>
        </div>
      </div>
    </div>
  );
}
