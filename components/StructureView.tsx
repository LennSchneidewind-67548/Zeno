"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ClientSubtask, Structure } from "@/lib/task-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type NodeState = "done" | "active" | "locked" | "todo";

type SharedProps = {
  subtasks: ClientSubtask[];
  onToggle: (id: string) => void;
};

// ── Color helpers ─────────────────────────────────────────────────────────────

function nodeStyles(state: NodeState): React.CSSProperties {
  switch (state) {
    case "done":
      return {
        background: "oklch(0.72 0.17 155 / 0.12)",
        border: "1px solid oklch(0.72 0.17 155 / 0.4)",
        color: "oklch(0.30 0.12 155)",
      };
    case "active":
      return {
        background: "oklch(0.62 0.19 300 / 0.1)",
        border: "1px solid oklch(0.62 0.19 300 / 0.4)",
        color: "oklch(0.28 0.15 300)",
        boxShadow: "0 0 0 3px oklch(0.62 0.19 300 / 0.15)",
      };
    case "locked":
      return {
        background: "oklch(0.20 0.025 285 / 0.04)",
        border: "1px solid oklch(0.20 0.025 285 / 0.08)",
        color: "oklch(0.62 0.015 285)",
        cursor: "default",
      };
    case "todo":
      return {
        background: "oklch(0.99 0 0 / 0.7)",
        border: "1px solid oklch(0.20 0.025 285 / 0.15)",
        color: "oklch(0.35 0.02 285)",
      };
  }
}

function stateLabel(state: NodeState): string {
  switch (state) {
    case "done":
      return "✓ Done";
    case "active":
      return "● Active";
    case "locked":
      return "○ Locked";
    case "todo":
      return "○ To do";
  }
}

function stateLabelColor(state: NodeState): string {
  switch (state) {
    case "done":
      return "oklch(0.50 0.14 155)";
    case "active":
      return "oklch(0.50 0.16 300)";
    case "locked":
      return "oklch(0.72 0.015 285)";
    case "todo":
      return "oklch(0.62 0.015 285)";
  }
}

// ── State computation helpers ─────────────────────────────────────────────────

function linearStates(subtasks: ClientSubtask[]): Map<string, NodeState> {
  const sorted = [...subtasks].sort((a, b) => a.position - b.position);
  let activeFound = false;
  const map = new Map<string, NodeState>();

  for (const s of sorted) {
    if (s.done) {
      map.set(s.id, "done");
    } else if (!activeFound) {
      activeFound = true;
      map.set(s.id, "active");
    } else {
      map.set(s.id, "locked");
    }
  }

  return map;
}

function groupedStates(
  roots: ClientSubtask[],
  children: ClientSubtask[],
  childrenByRoot: Map<string, ClientSubtask[]>
): { rootStates: Map<string, NodeState>; childStates: Map<string, NodeState> } {
  const rootStates = new Map<string, NodeState>();
  const childStates = new Map<string, NodeState>();
  let activeRootFound = false;

  for (const root of roots) {
    const kids = childrenByRoot.get(root.id) ?? [];
    const allDone = kids.length > 0 && kids.every((k) => k.done);

    let rootState: NodeState;
    if (allDone) {
      rootState = "done";
    } else if (!activeRootFound) {
      activeRootFound = true;
      rootState = "active";
    } else {
      rootState = "locked";
    }
    rootStates.set(root.id, rootState);

    const sortedKids = [...kids].sort((a, b) => a.position - b.position);

    if (rootState === "locked") {
      for (const k of sortedKids) childStates.set(k.id, "locked");
    } else if (rootState === "done") {
      for (const k of sortedKids) childStates.set(k.id, "done");
    } else {
      let activeKidFound = false;
      for (const k of sortedKids) {
        if (k.done) {
          childStates.set(k.id, "done");
        } else if (!activeKidFound) {
          activeKidFound = true;
          childStates.set(k.id, "active");
        } else {
          childStates.set(k.id, "locked");
        }
      }
    }
  }

  void children;
  return { rootStates, childStates };
}

// ── Structure badge ───────────────────────────────────────────────────────────

const STRUCTURE_META: Record<Structure, { icon: string; label: string }> = {
  linear: { icon: "→", label: "Linear" },
  star: { icon: "✦", label: "Star" },
  tree: { icon: "⌥", label: "Tree" },
  pipeline: { icon: "⟹", label: "Pipeline" },
};

function StructureBadge({ structure }: { structure: Structure }) {
  const { icon, label } = STRUCTURE_META[structure];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 500,
        alignSelf: "flex-start",
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.1em",
        color: "oklch(0.42 0.02 285)",
        background: "oklch(0.20 0.025 285 / 0.06)",
        border: "1px solid oklch(0.20 0.025 285 / 0.1)",
        borderRadius: 8,
        padding: "5px 12px",
      }}
    >
      <span>{icon}</span>
      <span style={{ textTransform: "uppercase" }}>{label}</span>
    </span>
  );
}

// ── Node card shared style ────────────────────────────────────────────────────

const nodeBase: React.CSSProperties = {
  borderRadius: 12,
  padding: "14px 14px 10px",
  textAlign: "left",
  transition: "all 0.15s",
  fontFamily: "var(--font-geist-sans), sans-serif",
};

// ── LinearView ────────────────────────────────────────────────────────────────

function LinearView({ subtasks, onToggle }: SharedProps) {
  const sorted = [...subtasks].sort((a, b) => a.position - b.position);
  const states = linearStates(subtasks);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 16, margin: "0 -4px", padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, width: "max-content" }}>
        {sorted.map((task, i) => {
          const state = states.get(task.id) ?? "locked";
          const isLocked = state === "locked";
          return (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button
                onClick={() => !isLocked && onToggle(task.id)}
                style={{
                  ...nodeBase,
                  ...nodeStyles(state),
                  width: 176,
                  flexShrink: 0,
                  cursor: isLocked ? "default" : "pointer",
                }}
              >
                <p style={{ fontSize: 13, lineHeight: 1.4, marginBottom: 10 }}>{task.text}</p>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: stateLabelColor(state),
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}
                >
                  {stateLabel(state)}
                </p>
              </button>
              {i < sorted.length - 1 && (
                <span
                  style={{
                    color: "oklch(0.62 0.015 285)",
                    fontSize: 18,
                    padding: "0 12px",
                    flexShrink: 0,
                    alignSelf: "center",
                  }}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StarView ──────────────────────────────────────────────────────────────────

function StarView({ subtasks, onToggle, taskTitle }: SharedProps & { taskTitle: string }) {
  const sorted = [...subtasks].sort((a, b) => a.position - b.position);

  function card(task: ClientSubtask) {
    const state: NodeState = task.done ? "done" : "todo";
    return (
      <button
        key={task.id}
        onClick={() => onToggle(task.id)}
        style={{ ...nodeBase, ...nodeStyles(state), width: 144, cursor: "pointer" }}
      >
        <p style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 8 }}>{task.text}</p>
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: stateLabelColor(state),
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {stateLabel(state)}
        </p>
      </button>
    );
  }

  const half = Math.ceil(sorted.length / 2);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "16px 0",
      }}
    >
      {sorted.slice(0, half).map(card)}
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 16,
          background: "linear-gradient(135deg, oklch(0.90 0.14 85), oklch(0.72 0.18 72))",
          border: "2px solid oklch(0.72 0.18 72 / 0.4)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            color: "oklch(0.25 0.14 72)",
            fontFamily: "var(--font-fraunces), serif",
            fontVariationSettings: '"SOFT" 50, "opsz" 36',
          }}
        >
          {taskTitle}
        </span>
      </div>
      {sorted.slice(half).map(card)}
    </div>
  );
}

// ── TreeView ──────────────────────────────────────────────────────────────────

type Line = { x1: number; y1: number; x2: number; y2: number; state: NodeState };

function TreeView({ subtasks, onToggle }: SharedProps) {
  const roots = subtasks
    .filter((s) => s.parentId === null)
    .sort((a, b) => a.position - b.position);

  const childrenByRoot = new Map<string, ClientSubtask[]>();
  for (const root of roots) {
    childrenByRoot.set(
      root.id,
      subtasks.filter((s) => s.parentId === root.id).sort((a, b) => a.position - b.position)
    );
  }

  const { rootStates, childStates } = groupedStates(
    roots,
    subtasks.filter((s) => s.parentId !== null),
    childrenByRoot
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const branchRefs = useRef(new Map<string, HTMLDivElement>());
  const childRefs = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const rootEl = rootRef.current;
    if (!container || !rootEl) return;

    const cRect = container.getBoundingClientRect();
    function center(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      return { x: r.left - cRect.left + r.width / 2, y: r.top - cRect.top + r.height / 2 };
    }

    const rootC = center(rootEl);
    const newLines: Line[] = [];

    for (const root of roots) {
      const branchEl = branchRefs.current.get(root.id);
      if (!branchEl) continue;
      const branchC = center(branchEl);
      newLines.push({
        x1: rootC.x,
        y1: rootC.y,
        x2: branchC.x,
        y2: branchC.y,
        state: rootStates.get(root.id) ?? "locked",
      });

      for (const child of childrenByRoot.get(root.id) ?? []) {
        const childEl = childRefs.current.get(child.id);
        if (!childEl) continue;
        const childC = center(childEl);
        newLines.push({
          x1: branchC.x,
          y1: branchC.y,
          x2: childC.x,
          y2: childC.y,
          state: childStates.get(child.id) ?? "locked",
        });
      }
    }

    setLines(newLines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtasks]);

  function lineStyle(state: NodeState): {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  } {
    switch (state) {
      case "done":
        return { stroke: "oklch(0.72 0.17 155)", strokeWidth: 1.5 };
      case "active":
        return { stroke: "oklch(0.62 0.19 300)", strokeWidth: 1.5 };
      case "locked":
        return {
          stroke: "oklch(0.20 0.025 285 / 0.15)",
          strokeWidth: 1,
          strokeDasharray: "4 4",
        };
      case "todo":
        return { stroke: "oklch(0.20 0.025 285 / 0.25)", strokeWidth: 1 };
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        padding: "16px 0",
        overflowX: "auto",
      }}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {lines.map((l, i) => {
          const s = lineStyle(l.state);
          return (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={s.stroke}
              strokeWidth={s.strokeWidth}
              strokeDasharray={s.strokeDasharray}
            />
          );
        })}
      </svg>

      <div
        ref={rootRef}
        style={{
          position: "relative",
          zIndex: 10,
          width: 192,
          borderRadius: 12,
          padding: "12px 16px",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 500,
          background: "oklch(0.95 0.08 85)",
          border: "1px solid oklch(0.72 0.18 72 / 0.3)",
          color: "oklch(0.30 0.14 72)",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
      >
        {roots[0]?.text ?? "Root"}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          gap: 24,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {roots.map((root) => {
          const branchState = rootStates.get(root.id) ?? "locked";
          const children = childrenByRoot.get(root.id) ?? [];
          return (
            <div
              key={root.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              <div
                ref={(el) => {
                  if (el) branchRefs.current.set(root.id, el);
                  else branchRefs.current.delete(root.id);
                }}
                style={{
                  ...nodeStyles(branchState),
                  width: 160,
                  borderRadius: 12,
                  padding: "10px 12px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-geist-mono), monospace",
                  transition: "all 0.15s",
                }}
              >
                {root.text}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 160 }}>
                {children.map((child) => {
                  const childState = childStates.get(child.id) ?? "locked";
                  const isLocked = childState === "locked";
                  return (
                    <button
                      key={child.id}
                      ref={(el) => {
                        if (el) childRefs.current.set(child.id, el);
                        else childRefs.current.delete(child.id);
                      }}
                      onClick={() => !isLocked && onToggle(child.id)}
                      style={{
                        ...nodeBase,
                        ...nodeStyles(childState),
                        width: "100%",
                        cursor: isLocked ? "default" : "pointer",
                      }}
                    >
                      <p style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 6 }}>{child.text}</p>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: stateLabelColor(childState),
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}
                      >
                        {stateLabel(childState)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PipelineView ──────────────────────────────────────────────────────────────

function PipelineView({ subtasks, onToggle }: SharedProps) {
  const phases = subtasks
    .filter((s) => s.parentId === null)
    .sort((a, b) => a.position - b.position);

  const tasksByPhase = new Map<string, ClientSubtask[]>();
  for (const phase of phases) {
    tasksByPhase.set(
      phase.id,
      subtasks.filter((s) => s.parentId === phase.id).sort((a, b) => a.position - b.position)
    );
  }

  const { rootStates: phaseStates, childStates: taskStates } = groupedStates(
    phases,
    subtasks.filter((s) => s.parentId !== null),
    tasksByPhase
  );

  return (
    <div style={{ overflowX: "auto", paddingBottom: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "max-content" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {phases.map((phase, i) => {
            const state = phaseStates.get(phase.id) ?? "locked";
            return (
              <div key={phase.id} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    ...nodeStyles(state),
                    width: 176,
                    borderRadius: 12,
                    padding: "12px 14px",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 2,
                      color: stateLabelColor(state),
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    {stateLabel(state)}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{phase.text}</p>
                </div>
                {i < phases.length - 1 && (
                  <span
                    style={{
                      color: "oklch(0.62 0.015 285)",
                      fontSize: 18,
                      padding: "0 12px",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex" }}>
          {phases.map((phase, i) => {
            const tasks = tasksByPhase.get(phase.id) ?? [];
            return (
              <div key={phase.id} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ width: 176, display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.map((task) => {
                    const state = taskStates.get(task.id) ?? "locked";
                    const isLocked = state === "locked";
                    return (
                      <button
                        key={task.id}
                        onClick={() => !isLocked && onToggle(task.id)}
                        style={{
                          ...nodeBase,
                          ...nodeStyles(state),
                          width: "100%",
                          cursor: isLocked ? "default" : "pointer",
                        }}
                      >
                        <p style={{ fontSize: 12, lineHeight: 1.4 }}>{task.text}</p>
                      </button>
                    );
                  })}
                </div>
                {i < phases.length - 1 && <div style={{ width: 48 }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StructureView (dispatcher) ────────────────────────────────────────────────

type Props = {
  structure: Structure;
  subtasks: ClientSubtask[];
  taskTitle: string;
  onReset: () => void;
};

export function StructureView({
  structure,
  subtasks: initialSubtasks,
  taskTitle,
  onReset,
}: Props) {
  const [items, setItems] = useState<ClientSubtask[]>(initialSubtasks);

  // Optimistic toggle — flip locally for instant feedback, then persist.
  // If the write fails, roll the node back so the UI never lies about what is saved.
  async function toggle(id: string) {
    const target = items.find((s) => s.id === id);
    if (!target) return;
    const done = !target.done;

    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, done } : s)));

    try {
      const res = await fetch(`/api/subtasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, done: !done } : s)));
    }
  }

  const shared: SharedProps = { subtasks: items, onToggle: toggle };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      <StructureBadge structure={structure} />

      {structure === "linear" && <LinearView {...shared} />}
      {structure === "star" && <StarView {...shared} taskTitle={taskTitle} />}
      {structure === "tree" && <TreeView {...shared} />}
      {structure === "pipeline" && <PipelineView {...shared} />}

      <button
        onClick={onReset}
        style={{
          alignSelf: "flex-start",
          fontSize: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          marginTop: 8,
          color: "oklch(0.62 0.015 285)",
          fontFamily: "var(--font-geist-sans), sans-serif",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.35 0.02 285)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.62 0.015 285)")}
      >
        Start over
      </button>
    </div>
  );
}
