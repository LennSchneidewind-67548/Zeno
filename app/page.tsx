"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: Date;
  priority?: Priority;
};

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "low",    label: "Low",    color: "text-emerald-500", dot: "bg-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-500",   dot: "bg-amber-400"   },
  { value: "high",   label: "High",   color: "text-red-500",     dot: "bg-red-400"     },
];

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

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // day-of-week the 1st falls on (0=Sun), shift to Mon-start
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDow + 6) % 7; // Mon=0 … Sun=6
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
      className="absolute z-10 top-full mt-1 right-0 bg-white border border-zinc-200 rounded-xl shadow-md p-4 w-64 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-700 px-1">‹</button>
        <span className="text-xs font-medium text-zinc-600">{monthName}</span>
        <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-700 px-1">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[10px] text-zinc-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(viewYear, viewMonth, day);
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear();
          const isSelected =
            selected &&
            day === selected.getDate() &&
            viewMonth === selected.getMonth() &&
            viewYear === selected.getFullYear();

          return (
            <button
              key={i}
              onClick={() => { onSelect(date); onClose(); }}
              className={`text-xs rounded-lg py-1.5 transition-colors
                ${isSelected ? "bg-zinc-800 text-white" :
                  isToday ? "text-zinc-800 font-semibold hover:bg-zinc-100" :
                  "text-zinc-600 hover:bg-zinc-100"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
        onClick={() => setOpen((v) => !v)}
        className="flex items-center transition-colors"
        aria-label="Set priority"
      >
        {active ? (
          <span className={`text-xs font-medium ${active.color}`}>{active.label}</span>
        ) : (
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            <path d="M3 2v12" />
            <path d="M3 2h8l-2 3.5 2 3.5H3" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute z-10 top-full mt-1 right-0 bg-white border border-zinc-200 rounded-xl shadow-md py-1 w-32 select-none">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => { onSelect(p.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 transition-colors ${
                priority === p.value ? "font-medium" : "text-zinc-600"
              }`}
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

function DateButton({ dueDate, onSelect }: { dueDate?: Date; onSelect: (d: Date) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-zinc-300 hover:text-zinc-500 transition-colors flex items-center"
        aria-label="Set due date"
      >
        {dueDate ? (
          <span className="text-xs text-zinc-400 tabular-nums">
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="14" height="12" rx="2" />
            <path d="M1 7h14" />
            <path d="M5 1v4M11 1v4" />
          </svg>
        )}
      </button>
      {open && (
        <CalendarPopover
          selected={dueDate}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// Parse a raw API response task, converting dueDate string → Date
function parseTask(raw: Task & { dueDate?: string | Date }): Task {
  return {
    ...raw,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
  };
}

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch tasks from the API on mount
  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: Task[]) => setTasks(data.map(parseTask)))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
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

  return (
    <div className="min-h-screen bg-white flex justify-center px-6 py-20">
      <main className="w-full max-w-md">

        {/* Sign out */}
        <div className="flex justify-end mb-8">
          <button
            onClick={signOut}
            className="text-xs text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
          placeholder="New task — press Enter to add"
          className="w-full bg-transparent text-zinc-800 placeholder:text-zinc-300 text-base outline-none pb-4"
        />

        {/* Divider */}
        <div className="w-full h-px bg-zinc-200 mb-6" />

        {/* Task list */}
        {loading ? (
          <p className="text-sm text-zinc-300">Loading…</p>
        ) : (
        <ul className="flex flex-col">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 py-3 border-b border-zinc-100"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 cursor-pointer accent-zinc-400 shrink-0"
              />
              <span
                className={`flex-1 text-sm ${
                  task.done ? "line-through text-zinc-300" : "text-zinc-700"
                }`}
              >
                {task.text}
              </span>

              <DateButton
                dueDate={task.dueDate}
                onSelect={(d) => setDueDate(task.id, d)}
              />
              <PriorityButton
                priority={task.priority}
                onSelect={(p) => setPriority(task.id, p)}
              />

              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-500 transition-opacity text-base leading-none"
                aria-label="Delete task"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        )}

      </main>
    </div>
  );
}
