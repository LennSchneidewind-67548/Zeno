"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ContextPanel } from "@/components/ContextPanel";
import { StructureView } from "@/components/StructureView";
import type { ClientTask, Structure, ClientSubtask } from "@/lib/task-types";

// ── TaskExpandedView ──────────────────────────────────────────────────────────

type Props = {
  task: ClientTask;
  originRect: DOMRect;
  onClose: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
};

export function TaskExpandedView({ task, originRect, onClose, onToggleDone, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);
  const [subtasks, setSubtasks] = useState<ClientSubtask[] | null>(null);
  const [structure, setStructure] = useState<Structure | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // No reset effects for task.id: the page renders this with key={task.id}, so a
  // different task remounts the component and every useState initialiser reruns.
  useEffect(() => {
    fetch(`/api/tasks/${task.id}/subtasks`)
      .then((r) => r.json())
      .then((data: { structure: Structure; subtasks: ClientSubtask[] } | null) => {
        if (data?.subtasks) { setSubtasks(data.subtasks); setStructure(data.structure); }
      })
      .finally(() => setLoadingSubtasks(false));
  }, [task.id]);

  function handleComplete(result: { structure: Structure; subtasks: ClientSubtask[] }) {
    setSubtasks(result.subtasks);
    setStructure(result.structure);
  }

  async function handleReset() {
    await fetch(`/api/tasks/${task.id}/subtasks`, { method: "DELETE" });
    setSubtasks(null);
    setStructure(null);
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "oklch(0.20 0.025 285 / 0.25)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />

      {/* Expanding card */}
      <motion.div
        className="fixed z-50 overflow-hidden flex flex-col"
        style={{
          background: `
            radial-gradient(500px circle at 15% 10%, oklch(0.88 0.12 85 / 0.2), transparent 60%),
            radial-gradient(500px circle at 85% 90%, oklch(0.78 0.14 300 / 0.15), transparent 55%),
            oklch(0.97 0.018 92)
          `,
          border: "1px solid oklch(0.20 0.025 285 / 0.12)",
          boxShadow: "0 40px 80px -20px oklch(0.20 0.025 285 / 0.3)",
          color: "oklch(0.20 0.025 285)",
          fontFamily: "var(--font-geist-sans), ui-sans-serif, sans-serif",
        }}
        initial={{ x: originRect.left, y: originRect.top, width: originRect.width, height: originRect.height, borderRadius: 14, opacity: 0.6 }}
        animate={{ x: "5vw", y: "5vh", width: "90vw", height: "90vh", borderRadius: 22, opacity: 1 }}
        exit={{ x: originRect.left, y: originRect.top, width: originRect.width, height: originRect.height, borderRadius: 14, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-8 pt-7 pb-5 shrink-0">

          {/* Top row: close + delete */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onClose}
              aria-label="Close"
              className="transition-colors p-1 -ml-1 rounded-lg"
              style={{ color: "oklch(0.62 0.015 285)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.20 0.025 285)")}
              onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.62 0.015 285)")}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>

            <button
              onClick={() => { if (confirmDelete) onDelete(); else setConfirmDelete(true); }}
              onBlur={() => setConfirmDelete(false)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all"
              style={confirmDelete
                ? { background: "oklch(0.72 0.18 8 / 0.08)", border: "1px solid oklch(0.72 0.18 8 / 0.4)", color: "oklch(0.45 0.18 8)" }
                : { background: "transparent", border: "1px solid oklch(0.20 0.025 285 / 0.15)", color: "oklch(0.62 0.015 285)" }
              }
            >
              {confirmDelete ? "Confirm delete?" : "Delete"}
            </button>
          </div>

          {/* Icon + title + done toggle */}
          <div className="flex items-start gap-4">
            {/* Yellow icon matching task card */}
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, oklch(0.90 0.14 85), oklch(0.72 0.18 72))",
              color: "oklch(0.30 0.14 72)", fontSize: 16, marginTop: 2,
            }}>●</div>

            <div style={{ flex: 1 }}>
              {/* TASK label */}
              <div style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10, letterSpacing: "0.14em",
                color: "oklch(0.62 0.015 285)", textTransform: "uppercase", marginBottom: 6,
              }}>TASK</div>

              {/* Title + done toggle */}
              <div className="flex items-start gap-3">
                <button
                  onClick={onToggleDone}
                  aria-label={task.done ? "Mark undone" : "Mark done"}
                  className="mt-1.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={task.done
                    ? { background: "oklch(0.72 0.17 155)", borderColor: "oklch(0.72 0.17 155)" }
                    : { background: "transparent", borderColor: "oklch(0.20 0.025 285 / 0.25)" }
                  }
                >
                  {task.done && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="oklch(0.22 0.08 155)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 5l2.5 2.5 4.5-5" />
                    </svg>
                  )}
                </button>

                <h1
                  className="leading-snug"
                  style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontVariationSettings: '"SOFT" 60, "opsz" 72',
                    fontSize: "clamp(22px, 3vw, 36px)",
                    fontWeight: 450,
                    letterSpacing: "-0.025em",
                    color: task.done ? "oklch(0.62 0.015 285)" : "oklch(0.20 0.025 285)",
                    textDecoration: task.done ? "line-through" : "none",
                  }}
                >
                  {task.text}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-8 shrink-0" style={{ height: 1, background: "oklch(0.20 0.025 285 / 0.1)" }} />

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loadingSubtasks ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.62 0.015 285)" }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
              </svg>
              Loading…
            </div>
          ) : subtasks && structure ? (
            <StructureView structure={structure} subtasks={subtasks} taskTitle={task.text} onReset={handleReset} />
          ) : (
            <ContextPanel taskId={task.id} taskTitle={task.text} onComplete={handleComplete} />
          )}
        </div>
      </motion.div>
    </>
  );
}
