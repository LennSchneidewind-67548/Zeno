"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useVelocity, useTransform, useSpring } from "framer-motion";
import { getBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";
import type { Priority, ClientTask } from "@/lib/task-types";

type Task = ClientTask;

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "low",    label: "Low",    color: "text-emerald-400", dot: "bg-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-400",   dot: "bg-amber-400"   },
  { value: "high",   label: "High",   color: "text-red-400",     dot: "bg-red-400"     },
];

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

// ─── CalendarPopover ──────────────────────────────────────────────────────────

function CalendarPopover({
  selected,
  onSelect,
  onClose,
}: {
  selected?: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div
      ref={ref}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-20 top-full mt-1 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 w-64 select-none"
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-slate-500 hover:text-slate-300 px-1 transition-colors">‹</button>
        <span className="text-xs font-medium text-slate-400">{monthName}</span>
        <button onClick={nextMonth} className="text-slate-500 hover:text-slate-300 px-1 transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[10px] text-slate-600 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(viewYear, viewMonth, day);
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const isSelected = selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();
          return (
            <button
              key={i}
              onClick={() => { onSelect(date); onClose(); }}
              className={`text-xs rounded-lg py-1.5 transition-colors ${
                isSelected ? "bg-cyan-500 text-slate-950 font-medium" :
                isToday ? "text-cyan-400 font-semibold hover:bg-slate-800" :
                "text-slate-400 hover:bg-slate-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PriorityButton ───────────────────────────────────────────────────────────

function PriorityButton({ priority, onSelect }: { priority?: Priority; onSelect: (p: Priority) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = PRIORITIES.find((p) => p.value === priority);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center transition-colors"
        aria-label="Set priority"
      >
        {active ? (
          <span className={`text-xs font-medium ${active.color}`}>{active.label}</span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 hover:text-slate-400 transition-colors">
            <path d="M3 2v12" /><path d="M3 2h8l-2 3.5 2 3.5H3" />
          </svg>
        )}
      </button>
      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute z-20 top-full mt-1 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 w-32 select-none"
        >
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => { onSelect(p.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800 transition-colors ${priority === p.value ? "font-medium" : "text-slate-400"}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
              <span className={priority === p.value ? p.color : ""}>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DateButton ───────────────────────────────────────────────────────────────

function DateButton({ dueDate, onSelect }: { dueDate?: Date; onSelect: (d: Date) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className="text-slate-600 hover:text-slate-400 transition-colors flex items-center"
        aria-label="Set due date"
      >
        {dueDate ? (
          <span className="text-xs text-slate-400 tabular-nums">
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="14" height="12" rx="2" /><path d="M1 7h14" /><path d="M5 1v4M11 1v4" />
          </svg>
        )}
      </button>
      {open && (
        <CalendarPopover selected={dueDate} onSelect={onSelect} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

type TaskCardProps = {
  task: Task;
  initialX: number;
  initialY: number;
  onSetDueDate: (id: string, date: Date) => void;
  onSetPriority: (id: string, p: Priority) => void;
  onPositionSave: (id: string, x: number, y: number) => void;
};

function TaskCard({ task, initialX, initialY, onSetDueDate, onSetPriority, onPositionSave }: TaskCardProps) {
  const router = useRouter();
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  // Jelly effect: tilt based on horizontal drag velocity, spring back on release
  const xVelocity = useVelocity(x);
  const tilt = useTransform(xVelocity, [-1200, 0, 1200], [-18, 0, 18]);
  const smoothTilt = useSpring(tilt, { stiffness: 180, damping: 18, mass: 0.4 });

  function handleDragEnd() {
    onPositionSave(task.id, x.get(), y.get());
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, rotate: smoothTilt, position: "absolute", top: 0, left: 0 }}
      whileHover={{ scale: 1.03, boxShadow: "0 0 0 1px rgba(6,182,212,0.25), 0 20px 40px rgba(0,0,0,0.6)" }}
      whileDrag={{ scale: 1.06, boxShadow: "0 0 0 1px rgba(6,182,212,0.4), 0 28px 50px rgba(0,0,0,0.7)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onDragEnd={handleDragEnd}
      className="w-56 bg-slate-900 border border-slate-700/50 rounded-xl p-4 shadow-lg shadow-black/40 cursor-grab active:cursor-grabbing select-none"
    >
      <p className="text-sm text-white mb-4 leading-snug">
        {task.text}
      </p>

      <div className="flex items-center gap-2">
        <DateButton dueDate={task.dueDate} onSelect={(d) => onSetDueDate(task.id, d)} />
        <PriorityButton priority={task.priority} onSelect={(p) => onSetPriority(task.id, p)} />
        <div className="flex-1" />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="text-slate-600 hover:text-slate-300 transition-colors"
          aria-label="Open task"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h8M9 5l3 3-3 3" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─── TasksPage ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

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

  function toggleTask(id: string) {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !current.done }),
    });
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

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  function savePosition(id: string, x: number, y: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
  }

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
      {!loading && tasks.map((task, index) => {
        const pos = resolvedPosition(task, index);
        return (
          <TaskCard
            key={task.id}
            task={task}
            initialX={pos.x}
            initialY={pos.y}
            onSetDueDate={setDueDate}
            onSetPriority={setPriority}
            onPositionSave={savePosition}
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
