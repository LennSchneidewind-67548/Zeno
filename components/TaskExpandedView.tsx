"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { TaskCardTask } from "@/components/TaskCard";

const PRIORITIES = {
  low:    { label: "Low",    color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  medium: { label: "Medium", color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/30"     },
  high:   { label: "High",   color: "text-red-400",     bg: "bg-red-400/10 border-red-400/30"         },
};

type Props = {
  task: TaskCardTask;
  originRect: DOMRect;
  onClose: () => void;
};

export function TaskExpandedView({ task, originRect, onClose }: Props) {
  // Escape key closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const priority = task.priority ? PRIORITIES[task.priority] : null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Expanding card */}
      <motion.div
        className="fixed z-50 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
        initial={{
          x: originRect.left,
          y: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: 12,
          opacity: 0.5,
        }}
        animate={{
          x: "5vw",
          y: "5vh",
          width: "90vw",
          height: "90vh",
          borderRadius: 20,
          opacity: 1,
        }}
        exit={{
          x: originRect.left,
          y: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: 12,
          opacity: 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-6 shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-600 hover:text-slate-300 transition-colors p-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white leading-snug pr-8 mb-5">
            {task.text}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {task.dueDate && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="14" height="12" rx="2" /><path d="M1 7h14" /><path d="M5 1v4M11 1v4" />
                </svg>
                {task.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            {priority && (
              <span className={`flex items-center gap-1.5 text-xs font-medium ${priority.color} ${priority.bg} border rounded-lg px-3 py-1.5`}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v12" /><path d="M3 2h8l-2 3.5 2 3.5H3" />
                </svg>
                {priority.label}
              </span>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-slate-700/50 mx-8 shrink-0" />

        {/* ── Subtask section ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center mb-1">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">Break it down</p>
          <p className="text-slate-600 text-xs max-w-xs leading-relaxed">
            Subtasks will appear here once you generate a breakdown for this task.
          </p>
        </div>
      </motion.div>
    </>
  );
}
