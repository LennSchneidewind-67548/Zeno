"use client";

import { useState } from "react";
import type { Structure, ClientSubtask } from "@/lib/task-types";

const CHIPS = [
  "Is there a deadline?",
  "Do I need to do research first?",
  "Are there any blockers or dependencies?",
  "What tools or resources will I use?",
  "Does anyone else need to be involved?",
];

const DETAIL_LEVELS = [
  { value: "low",    label: "Low",    hint: "3–5 subtasks"  },
  { value: "medium", label: "Medium", hint: "7–9 subtasks"  },
  { value: "high",   label: "High",   hint: "12–15 subtasks" },
] as const;

type DetailLevel = typeof DETAIL_LEVELS[number]["value"];
type Mode = "guided" | "dump";

type Props = {
  taskId: string;
  taskTitle: string;
  onComplete: (result: { structure: Structure; subtasks: ClientSubtask[] }) => void;
};

export function ContextPanel({ taskId, onComplete }: Props) {
  const [mode, setMode] = useState<Mode>("guided");
  const [description, setDescription] = useState("");
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [dumpText, setDumpText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleChip(chip: string) {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  }

  const hasInput = description.length > 0 || dumpText.length > 0 || selectedChips.size > 0;

  async function handleSubmit() {
    if (!hasInput || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          selectedChips: [...selectedChips],
          detailLevel,
          dumpText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong");
      }
      const data = await res.json() as { structure: Structure; subtasks: ClientSubtask[] };
      onComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-geist-mono), monospace",
    fontSize: 10, letterSpacing: "0.14em",
    color: "oklch(0.62 0.015 285)", textTransform: "uppercase", marginBottom: 8,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%", background: "oklch(0.99 0 0 / 0.6)",
    border: "1px solid oklch(0.20 0.025 285 / 0.12)",
    borderRadius: 12, padding: "12px 16px",
    fontSize: 13, color: "oklch(0.20 0.025 285)",
    fontFamily: "var(--font-geist-sans), sans-serif",
    outline: "none", resize: "none" as const,
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, height: "100%", maxWidth: 620 }}>

      {/* Mode toggle */}
      <div style={{
        display: "flex", gap: 4, alignSelf: "flex-start",
        background: "oklch(0.20 0.025 285 / 0.06)",
        borderRadius: 10, padding: 4,
        border: "1px solid oklch(0.20 0.025 285 / 0.08)",
      }}>
        {(["guided", "dump"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 16px", borderRadius: 7,
              fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
              transition: "all 0.15s",
              background: mode === m ? "oklch(0.99 0 0)" : "transparent",
              color: mode === m ? "oklch(0.20 0.025 285)" : "oklch(0.55 0.015 285)",
              boxShadow: mode === m ? "0 1px 4px oklch(0.20 0.025 285 / 0.08)" : "none",
              fontFamily: "var(--font-geist-sans), sans-serif",
            }}
          >
            {m === "guided" ? "Guided" : "Document dump"}
          </button>
        ))}
      </div>

      {mode === "guided" ? (
        <>
          {/* Workflow description */}
          <div>
            <div style={labelStyle}>Workflow</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How do you usually approach this kind of thing? Any tools, constraints, or habits…"
              rows={4}
              style={textareaStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(0.20 0.025 285 / 0.3)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.20 0.025 285 / 0.12)")}
            />
          </div>

          {/* Clarifying question chips */}
          <div>
            <div style={labelStyle}>Quick context</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CHIPS.map((chip) => {
                const active = selectedChips.has(chip);
                return (
                  <button
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    style={{
                      fontSize: 12, padding: "6px 14px", borderRadius: 999,
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: "var(--font-geist-sans), sans-serif",
                      border: active
                        ? "1px solid oklch(0.72 0.18 72 / 0.6)"
                        : "1px solid oklch(0.20 0.025 285 / 0.12)",
                      background: active
                        ? "oklch(0.95 0.08 85)"
                        : "oklch(0.99 0 0 / 0.6)",
                      color: active
                        ? "oklch(0.35 0.12 72)"
                        : "oklch(0.42 0.02 285)",
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail level */}
          <div>
            <div style={labelStyle}>Detail level</div>
            <div style={{
              display: "flex", gap: 4, alignSelf: "flex-start",
              background: "oklch(0.20 0.025 285 / 0.06)",
              borderRadius: 10, padding: 4,
              border: "1px solid oklch(0.20 0.025 285 / 0.08)",
            }}>
              {DETAIL_LEVELS.map(({ value, label, hint }) => (
                <button
                  key={value}
                  onClick={() => setDetailLevel(value)}
                  title={hint}
                  style={{
                    padding: "6px 16px", borderRadius: 7,
                    fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                    transition: "all 0.15s",
                    background: detailLevel === value ? "oklch(0.99 0 0)" : "transparent",
                    color: detailLevel === value ? "oklch(0.20 0.025 285)" : "oklch(0.55 0.015 285)",
                    boxShadow: detailLevel === value ? "0 1px 4px oklch(0.20 0.025 285 / 0.08)" : "none",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "oklch(0.62 0.015 285)", marginTop: 6 }}>
              {DETAIL_LEVELS.find((d) => d.value === detailLevel)?.hint}
            </p>
          </div>
        </>
      ) : (
        /* Document dump */
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={labelStyle}>Paste content</div>
          <textarea
            value={dumpText}
            onChange={(e) => setDumpText(e.target.value)}
            placeholder="Paste a conversation, meeting notes, a brainstorm doc, or a voice transcript…"
            style={{ ...textareaStyle, flex: 1, minHeight: 192 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(0.20 0.025 285 / 0.3)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.20 0.025 285 / 0.12)")}
          />
        </div>
      )}

      {/* Submit */}
      <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={!hasInput || loading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "none",
            fontSize: 13, fontWeight: 500, cursor: hasInput && !loading ? "pointer" : "not-allowed",
            fontFamily: "var(--font-geist-sans), sans-serif",
            alignSelf: "flex-start",
            transition: "all 0.15s",
            background: loading
              ? "oklch(0.20 0.025 285 / 0.08)"
              : hasInput
              ? "oklch(0.20 0.025 285)"
              : "oklch(0.20 0.025 285 / 0.08)",
            color: loading || !hasInput
              ? "oklch(0.62 0.015 285)"
              : "oklch(0.97 0.018 92)",
            boxShadow: hasInput && !loading
              ? "0 6px 16px -4px oklch(0.20 0.025 285 / 0.4)"
              : "none",
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
              </svg>
              Breaking it down…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.8 }}>
                <path d="M8 1l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-1.5L8 1z"/>
              </svg>
              Break it down
            </>
          )}
        </button>
        {error && (
          <p style={{ fontSize: 12, color: "oklch(0.55 0.18 8)" }}>{error}</p>
        )}
      </div>

    </div>
  );
}
