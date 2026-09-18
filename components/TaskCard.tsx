"use client";

import { useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
} from "framer-motion";

import type { TaskProgress } from "@/lib/task-types";

type Task = { id: string; text: string; done: boolean; progress: TaskProgress | null };

export type CardHandle = {
  el: HTMLDivElement | null;
  setTarget: (x: number, y: number) => void;
  getPosition: () => { x: number; y: number };
};

type Props = {
  task: Task;
  initialX: number;
  initialY: number;
  isDragging: boolean;
  isExpanded: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  registerCard: (handle: CardHandle | null) => void;
};

export function TaskCard({
  task,
  initialX,
  initialY,
  isDragging,
  isExpanded,
  onMouseDown,
  registerCard,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const progress = task.progress;
  const complete = progress !== null && progress.done === progress.total;

  // Raw target — set directly by parent drag handler, no React state involved
  const targetX = useMotionValue(initialX);
  const targetY = useMotionValue(initialY);

  // Spring lag — card chases the target with inertia, feels like a physical object
  const x = useSpring(targetX, { stiffness: 180, damping: 22, mass: 0.9 });
  const y = useSpring(targetY, { stiffness: 180, damping: 22, mass: 0.9 });

  // Tilt driven by the spring's own velocity (card movement, not raw cursor speed)
  const xVel = useVelocity(x);
  const tiltRaw = useTransform(xVel, [-2000, 0, 2000], [-20, 0, 20]);
  const tilt = useSpring(tiltRaw, { stiffness: 220, damping: 24, mass: 0.35 });

  // Expose setTarget + getPosition to the page via registerCard callback
  const stableRegister = useRef(registerCard);
  useEffect(() => { stableRegister.current = registerCard; });
  useEffect(() => {
    stableRegister.current({
      el: cardRef.current,
      setTarget: (nx, ny) => { targetX.set(nx); targetY.set(ny); },
      getPosition: () => ({ x: x.get(), y: y.get() }),
    });
    return () => { stableRegister.current(null); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      ref={cardRef}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        x,
        y,
        rotate: tilt,
        zIndex: isDragging ? 50 : "auto",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        // Card visual — matching landing page l-item-card
        background: "oklch(0.99 0.01 92)",
        border: "1px solid oklch(0.20 0.025 285 / 0.12)",
        borderRadius: 14,
        padding: "12px 14px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 180,
        maxWidth: 220,
        fontSize: 13,
        color: "oklch(0.20 0.025 285)",
        fontFamily: "var(--font-geist-sans), ui-sans-serif, sans-serif",
      }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        opacity: isExpanded ? 0 : task.done ? 0.4 : 1,
        boxShadow: isDragging
          ? "0 28px 55px -10px oklch(0.20 0.025 285 / 0.45)"
          : complete
          ? "0 6px 20px -8px oklch(0.72 0.18 72 / 0.45)"
          : "0 6px 20px -8px oklch(0.20 0.025 285 / 0.25)",
      }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13,
          background: "linear-gradient(135deg, oklch(0.90 0.14 85), oklch(0.72 0.18 72))",
          color: "oklch(0.30 0.14 72)",
        }}>●</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9, letterSpacing: "0.14em",
            color: "oklch(0.62 0.015 285)", textTransform: "uppercase", marginBottom: 3,
          }}>TASK</div>
          <div style={{
            fontWeight: 500, lineHeight: 1.25,
            textDecoration: task.done ? "line-through" : "none",
            color: task.done ? "oklch(0.62 0.015 285)" : "oklch(0.20 0.025 285)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>{task.text}</div>
        </div>
      </div>

      {/* Breakdown progress — only once the task actually has subtasks */}
      {progress && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 999, overflow: "hidden",
            background: "oklch(0.20 0.025 285 / 0.08)",
          }}>
            <div style={{
              width: `${(progress.done / progress.total) * 100}%`,
              height: "100%", borderRadius: 999,
              transition: "width 0.3s ease",
              background: complete
                ? "linear-gradient(90deg, oklch(0.90 0.14 85), oklch(0.72 0.18 72))"
                : "oklch(0.72 0.17 155)",
            }} />
          </div>
          <span style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9, letterSpacing: "0.04em", flexShrink: 0,
            color: complete ? "oklch(0.45 0.14 72)" : "oklch(0.62 0.015 285)",
          }}>
            {progress.done}/{progress.total}
          </span>
        </div>
      )}
    </motion.div>
  );
}
