"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useVelocity,
  useTransform,
  useSpring,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import type { Priority } from "@/lib/task-types";

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

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
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
              className={`text-xs rounded-lg py-1.5 transition-colors ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 font-medium"
                  : isToday
                  ? "text-cyan-400 font-semibold hover:bg-slate-800"
                  : "text-slate-400 hover:bg-slate-800"
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

const PRIORITIES: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "low",    label: "Low",    color: "text-emerald-400", dot: "bg-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-400",   dot: "bg-amber-400"   },
  { value: "high",   label: "High",   color: "text-red-400",     dot: "bg-red-400"     },
];

function PriorityButton({
  priority,
  onSelect,
}: {
  priority?: Priority;
  onSelect: (p: Priority) => void;
}) {
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
          <svg
            width="14" height="14" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
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
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800 transition-colors ${
                priority === p.value ? "font-medium" : "text-slate-400"
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

// ─── DateButton ───────────────────────────────────────────────────────────────

function DateButton({
  dueDate,
  onSelect,
}: {
  dueDate?: Date;
  onSelect: (d: Date) => void;
}) {
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
          <svg
            width="14" height="14" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
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

// ─── TaskCard ─────────────────────────────────────────────────────────────────

export type TaskCardTask = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: Date;
  priority?: Priority;
};

type TaskCardProps = {
  task: TaskCardTask;
  x: MotionValue<number>;
  y: MotionValue<number>;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  registerHeight: (id: string, h: number) => void;
  onSetDueDate: (id: string, date: Date) => void;
  onSetPriority: (id: string, p: Priority) => void;
};

export function TaskCard({
  task,
  x,
  y,
  isDragging,
  onPointerDown,
  registerHeight,
  onSetDueDate,
  onSetPriority,
}: TaskCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // Jelly tilt: same as before, derived from horizontal velocity
  const xVelocity = useVelocity(x);
  const tilt = useTransform(xVelocity, [-1200, 0, 1200], [-18, 0, 18]);
  const smoothTilt = useSpring(tilt, { stiffness: 180, damping: 18, mass: 0.4 });

  // Measure card height and report to physics hook
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      registerHeight(task.id, el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [task.id, registerHeight]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        x,
        y,
        rotate: smoothTilt,
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: isDragging ? 50 : "auto",
      }}
      animate={
        isDragging
          ? { scale: 1.06, boxShadow: "0 0 0 1px rgba(6,182,212,0.4), 0 28px 50px rgba(0,0,0,0.7)" }
          : { scale: 1, boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }
      }
      whileHover={
        !isDragging
          ? { scale: 1.03, boxShadow: "0 0 0 1px rgba(6,182,212,0.25), 0 20px 40px rgba(0,0,0,0.6)" }
          : undefined
      }
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onPointerDown={onPointerDown}
      className="w-56 bg-slate-900 border border-slate-700/50 rounded-xl p-4 shadow-lg shadow-black/40 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <p className="text-sm text-white mb-4 leading-snug">{task.text}</p>

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
          <svg
            width="14" height="14" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M4 8h8M9 5l3 3-3 3" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
