"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motionValue, animate, useAnimationFrame } from "framer-motion";
import type { MotionValue } from "framer-motion";

export const CARD_W = 224; // w-56
const FALLBACK_H = 130;

// Spring configs
const SPRING_DRAG  = { type: "spring" as const, stiffness: 180, damping: 22, mass: 1.1 };
const SPRING_PUSH  = { type: "spring" as const, stiffness: 380, damping: 32 };
const SPRING_CLAMP = { type: "spring" as const, stiffness: 500, damping: 40 };

export type CardMotionValues = { x: MotionValue<number>; y: MotionValue<number> };
export type PositionUpdate = { id: string; x: number; y: number };

export function useCanvasPhysics(
  onSavePositions: (updates: PositionUpdate[]) => void
) {
  const entries    = useRef<Map<string, CardMotionValues>>(new Map());
  const heights    = useRef<Map<string, number>>(new Map());
  const targets    = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragging   = useRef<{ id: string; grabX: number; grabY: number } | null>(null);
  const displaced  = useRef<Set<string>>(new Set());
  const lastPush   = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Single useState — only for z-index re-render on drag start/end
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ── Registration ──────────────────────────────────────────────

  const initCard = useCallback((id: string, x: number, y: number) => {
    if (!entries.current.has(id)) {
      entries.current.set(id, { x: motionValue(x), y: motionValue(y) });
      targets.current.set(id, { x, y });
    }
  }, []);

  const pruneCards = useCallback((activeIds: ReadonlySet<string>) => {
    for (const id of [...entries.current.keys()]) {
      if (!activeIds.has(id)) {
        entries.current.delete(id);
        heights.current.delete(id);
        targets.current.delete(id);
        lastPush.current.delete(id);
      }
    }
  }, []);

  const getMotionValues = useCallback((id: string): CardMotionValues => {
    return entries.current.get(id)!;
  }, []);

  const registerHeight = useCallback((id: string, h: number) => {
    heights.current.set(id, h);
  }, []);

  // ── Drag ──────────────────────────────────────────────────────

  const handlePointerDown = useCallback((id: string, e: React.PointerEvent) => {
    const entry = entries.current.get(id);
    if (!entry) return;

    dragging.current = {
      id,
      grabX: e.clientX - entry.x.get(),
      grabY: e.clientY - entry.y.get(),
    };
    displaced.current.clear();
    lastPush.current.clear();
    setDraggingId(id);
  }, []);

  // Window-level move/up registered when drag starts, cleaned up on end
  const onSaveRef = useRef(onSavePositions);
  useEffect(() => { onSaveRef.current = onSavePositions; });

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const { id, grabX, grabY } = dragging.current;
      const entry = entries.current.get(id);
      if (!entry) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dh = heights.current.get(id) ?? FALLBACK_H;
      const tx = Math.max(0, Math.min(vw - CARD_W, e.clientX - grabX));
      const ty = Math.max(0, Math.min(vh - dh, e.clientY - grabY));
      animate(entry.x, tx, SPRING_DRAG);
      animate(entry.y, ty, SPRING_DRAG);
      targets.current.set(id, { x: tx, y: ty });
    }

    function onPointerUp() {
      if (!dragging.current) return;
      const { id } = dragging.current;
      dragging.current = null;
      setDraggingId(null);

      const updates: PositionUpdate[] = [];
      const t = targets.current.get(id);
      if (t) updates.push({ id, x: t.x, y: t.y });
      for (const displacedId of displaced.current) {
        const dt = targets.current.get(displacedId);
        if (dt) updates.push({ id: displacedId, x: dt.x, y: dt.y });
      }
      displaced.current.clear();
      onSaveRef.current(updates);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // ── Per-frame collision loop ──────────────────────────────────

  useAnimationFrame(() => {
    if (!dragging.current) return;
    const { id: dragId } = dragging.current;
    const dragEntry = entries.current.get(dragId);
    if (!dragEntry) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dh = heights.current.get(dragId) ?? FALLBACK_H;

    // Clamp dragged card to viewport
    const dx = dragEntry.x.get();
    const dy = dragEntry.y.get();
    const cdx = Math.max(0, Math.min(vw - CARD_W, dx));
    const cdy = Math.max(0, Math.min(vh - dh, dy));
    if (cdx !== dx || cdy !== dy) {
      animate(dragEntry.x, cdx, SPRING_CLAMP);
      animate(dragEntry.y, cdy, SPRING_CLAMP);
    }
    const adx = cdx;
    const ady = cdy;

    // Check each card for AABB overlap with the dragged card
    for (const [id, entry] of entries.current) {
      if (id === dragId) continue;

      const oh = heights.current.get(id) ?? FALLBACK_H;
      const ox = entry.x.get();
      const oy = entry.y.get();

      const overlapX = Math.min(adx + CARD_W, ox + CARD_W) - Math.max(adx, ox);
      const overlapY = Math.min(ady + dh, oy + oh) - Math.max(ady, oy);

      if (overlapX > 0 && overlapY > 0) {
        // Minimum translation vector: push along the axis of least overlap
        const dCx = adx + CARD_W / 2;
        const dCy = ady + dh / 2;
        const oCx = ox + CARD_W / 2;
        const oCy = oy + oh / 2;

        let newOx = ox;
        let newOy = oy;

        if (overlapX < overlapY) {
          const sign = Math.sign(oCx - dCx) || 1;
          newOx = Math.max(0, Math.min(vw - CARD_W, ox + overlapX * sign));
        } else {
          const sign = Math.sign(oCy - dCy) || 1;
          newOy = Math.max(0, Math.min(vh - oh, oy + overlapY * sign));
        }

        // Only fire animate() if the resolved position meaningfully changed
        const last = lastPush.current.get(id);
        if (!last || Math.abs(last.x - newOx) > 0.5 || Math.abs(last.y - newOy) > 0.5) {
          animate(entry.x, newOx, SPRING_PUSH);
          animate(entry.y, newOy, SPRING_PUSH);
          lastPush.current.set(id, { x: newOx, y: newOy });
          targets.current.set(id, { x: newOx, y: newOy });
          displaced.current.add(id);
        }
      } else {
        // No longer colliding — clear push cache so a future re-entry fires a fresh animate
        lastPush.current.delete(id);
      }
    }
  });

  return {
    initCard,
    pruneCards,
    getMotionValues,
    registerHeight,
    handlePointerDown,
    draggingId,
  };
}
