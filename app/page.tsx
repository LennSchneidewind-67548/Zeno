"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --bg: oklch(0.97 0.018 92);
  --bg-2: oklch(0.99 0.01 92);
  --ink: oklch(0.20 0.025 285);
  --ink-2: oklch(0.42 0.02 285);
  --ink-3: oklch(0.62 0.015 285);
  --line: oklch(0.20 0.025 285 / 0.1);
  --line-strong: oklch(0.20 0.025 285 / 0.2);
  --yellow: oklch(0.85 0.16 85);
  --yellow-deep: oklch(0.72 0.18 72);
  --purple: oklch(0.62 0.19 300);
  --purple-soft: oklch(0.92 0.06 300);
  --green: oklch(0.72 0.17 155);
  --green-soft: oklch(0.93 0.08 155);
  --pink: oklch(0.72 0.18 8);
  --pink-soft: oklch(0.94 0.05 15);
}

*, *::before, *::after { box-sizing: border-box; }
body {
  background:
    radial-gradient(800px circle at 15% 5%, oklch(0.88 0.12 85 / 0.25), transparent 60%),
    radial-gradient(900px circle at 95% 30%, oklch(0.78 0.14 300 / 0.18), transparent 55%),
    radial-gradient(700px circle at 50% 100%, oklch(0.82 0.13 155 / 0.18), transparent 60%),
    var(--bg) !important;
  background-attachment: fixed !important;
  color: var(--ink) !important;
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
h1, h2, h3 { margin: 0; font-weight: 400; letter-spacing: -0.02em; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; }
input { font-family: inherit; }

.display {
  font-family: var(--font-fraunces), serif;
  font-optical-sizing: auto;
  font-variation-settings: "SOFT" 50, "opsz" 144;
  font-weight: 450;
  letter-spacing: -0.035em;
}
.display em { font-style: italic; font-weight: 400; font-variation-settings: "SOFT" 100, "opsz" 144; }
.fraunces {
  font-family: var(--font-fraunces), serif;
  font-variation-settings: "SOFT" 80;
  font-weight: 420;
  font-optical-sizing: auto;
  letter-spacing: -0.03em;
}
.fraunces em { font-style: italic; }
.mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }

/* ── NAV ── */
.l-nav {
  position: fixed; top: 16px; left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: flex; align-items: center; gap: 20px;
  padding: 10px 10px 10px 18px;
  background: oklch(0.99 0 0 / 0.75);
  backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 10px 30px -10px oklch(0.20 0.025 285 / 0.15);
  max-width: calc(100vw - 32px);
}
.l-nav-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 500; }
.l-z-mark {
  width: 28px; height: 28px; border-radius: 10px;
  background: linear-gradient(135deg, var(--yellow) 0%, var(--yellow-deep) 100%);
  display: flex; align-items: center; justify-content: center;
  color: oklch(0.20 0.025 285);
  font-weight: 700; font-size: 14px;
  box-shadow: 0 2px 6px oklch(0.72 0.18 72 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.5);
  font-family: var(--font-geist-sans), sans-serif;
}
.l-nav-xp {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 14px; border-radius: 999px;
  background: oklch(0.95 0.08 85);
  font-family: var(--font-geist-mono), monospace; font-size: 11px;
  color: oklch(0.35 0.12 72);
  font-weight: 500; letter-spacing: 0.04em;
  min-width: 150px; justify-content: center;
  white-space: nowrap;
}
.l-nav-xp .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--yellow-deep); animation: lpulse 2s ease-in-out infinite; }
@keyframes lpulse { 0%,100%{opacity:.7} 50%{opacity:1} }

.l-nav-links { display: flex; gap: 4px; align-items: center; font-size: 13px; white-space: nowrap; }
.l-nav-links a { white-space: nowrap; }
.l-nav-links a:not(.l-nav-cta) { padding: 8px 12px; border-radius: 999px; color: var(--ink-2); transition: all 160ms; }
.l-nav-links a:not(.l-nav-cta):hover { background: oklch(0.20 0.025 285 / 0.05); color: var(--ink); }
.l-nav-cta {
  padding: 9px 18px; border-radius: 999px;
  background: var(--ink); color: var(--bg-2);
  font-size: 13px; font-weight: 500;
  transition: transform 160ms, box-shadow 200ms;
}
.l-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px -6px var(--ink); }

/* ── HERO ── */
.l-hero { position: relative; padding: 110px 36px 80px; overflow: hidden; }
.l-hero-wrap { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.15fr 1fr; gap: 60px; align-items: center; }
.l-hero h1 { font-size: clamp(52px, 7.2vw, 104px); line-height: 0.94; margin-bottom: 28px; text-wrap: balance; }
.l-hero h1 .hl { position: relative; display: inline-block; }
.l-hero h1 .hl::after {
  content: ''; position: absolute; left: -6px; right: -6px; bottom: 6px; height: 22%;
  background: var(--yellow); z-index: -1; border-radius: 4px; transform: rotate(-0.5deg);
}
.l-hero .sub { font-size: 19px; color: var(--ink-2); max-width: 480px; line-height: 1.55; margin-bottom: 32px; text-wrap: pretty; }
.l-hero-stats { display: flex; gap: 24px; margin-bottom: 36px; font-size: 13px; color: var(--ink-2); }
.l-hero-stat { display: flex; align-items: center; gap: 8px; }
.l-hero-stat .chip { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; }

.l-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
.l-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 22px; border-radius: 999px;
  font-size: 15px; font-weight: 500;
  transition: transform 160ms, box-shadow 240ms;
  border: 1px solid transparent; position: relative;
}
.l-btn-primary {
  background: var(--ink); color: var(--bg-2);
  box-shadow: 0 1px 0 oklch(1 0 0 / 0.2) inset, 0 12px 30px -10px var(--ink);
}
.l-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 1px 0 oklch(1 0 0 / 0.2) inset, 0 20px 40px -10px var(--ink); }
.l-btn-ghost {
  background: oklch(1 0 0 / 0.6); color: var(--ink);
  border-color: var(--line-strong); backdrop-filter: blur(8px);
}
.l-btn-ghost:hover { background: oklch(1 0 0 / 0.9); transform: translateY(-1px); }


/* hero visual */
.l-hero-visual { position: relative; aspect-ratio: 1 / 1.05; }
.l-badge-stack { position: relative; width: 100%; height: 100%; }
.l-level-card {
  position: absolute; width: 76%;
  background: var(--bg-2); border-radius: 22px; padding: 22px;
  border: 1px solid var(--line);
  box-shadow: 0 1px 0 oklch(1 0 0 / 0.7) inset, 0 20px 50px -20px oklch(0.20 0.025 285 / 0.3);
  transition: transform 500ms cubic-bezier(.2,.8,.2,1);
}
.l-level-card.primary { left: 10%; top: 10%; z-index: 3; animation: lfloat 6s ease-in-out infinite; }
.l-level-card.secondary { left: 3%; top: 48%; z-index: 2; width: 60%; animation: lfloat 7s ease-in-out infinite 0.4s; }
.l-level-card.tertiary { right: 2%; top: 58%; z-index: 2; width: 52%; animation: lfloat 6.5s ease-in-out infinite 0.8s; }
@keyframes lfloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(0.3deg)} }

.l-level-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.l-level-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.li-yellow { background: linear-gradient(135deg, var(--yellow), var(--yellow-deep)); color: oklch(0.28 0.1 72); box-shadow: 0 4px 12px -4px var(--yellow-deep); }
.li-purple { background: linear-gradient(135deg, oklch(0.78 0.16 300), var(--purple)); color: oklch(0.99 0 0); box-shadow: 0 4px 12px -4px var(--purple); }
.li-green { background: linear-gradient(135deg, oklch(0.85 0.15 155), var(--green)); color: oklch(0.25 0.1 155); box-shadow: 0 4px 12px -4px var(--green); }
.l-level-title { font-weight: 500; font-size: 15px; }
.l-level-sub { font-size: 11px; color: var(--ink-3); font-family: var(--font-geist-mono), monospace; letter-spacing: 0.06em; margin-top: 2px; }

.l-xp-track { height: 10px; background: oklch(0.20 0.025 285 / 0.08); border-radius: 999px; overflow: hidden; margin-bottom: 8px; position: relative; }
.l-xp-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--yellow), var(--yellow-deep));
  box-shadow: 0 0 10px var(--yellow); position: relative; overflow: hidden;
}
.l-xp-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.5), transparent);
  animation: lshine 2.4s ease-in-out infinite;
}
@keyframes lshine { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
.l-xp-meta { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-geist-mono), monospace; font-size: 11px; color: var(--ink-2); letter-spacing: 0.04em; }
.l-subtasks { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.l-subtask { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: oklch(0.20 0.025 285 / 0.035); font-size: 13px; }
.l-subtask.done { color: var(--ink-3); text-decoration: line-through; }
.l-sub-check { width: 16px; height: 16px; border-radius: 5px; border: 1.5px solid var(--line-strong); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.l-subtask.done .l-sub-check { background: var(--green); border-color: var(--green); color: oklch(0.22 0.08 155); }
.l-streak-pill { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 999px; background: var(--pink-soft); color: oklch(0.36 0.14 10); font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
.l-achievement { display: flex; align-items: center; gap: 10px; }
.l-ach-medal { width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, oklch(0.92 0.14 85), var(--yellow-deep)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px -2px var(--yellow-deep), inset 0 1px 0 oklch(1 0 0 / 0.6); color: oklch(0.3 0.12 72); font-weight: 700; font-size: 14px; }

.l-floater { position: absolute; font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 999px; box-shadow: 0 4px 12px -4px oklch(0.20 0.025 285 / 0.25); animation: lbob 5s ease-in-out infinite; }
.l-floater.one { top: 5%; right: 5%; background: var(--yellow); color: oklch(0.30 0.14 72); animation-delay: 0s; }
.l-floater.two { top: 42%; right: -2%; background: var(--purple); color: oklch(0.99 0 0); animation-delay: 1s; }
.l-floater.three { bottom: 22%; left: 5%; background: var(--green); color: oklch(0.22 0.08 155); animation-delay: 2s; }
@keyframes lbob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

/* ── MARQUEE ── */
.l-marquee { overflow: hidden; padding: 28px 0; border-top: 1px dashed var(--line-strong); border-bottom: 1px dashed var(--line-strong); background: oklch(0.99 0.01 92); }
.l-marquee-track { display: flex; gap: 60px; animation: lscroll 35s linear infinite; white-space: nowrap; font-family: var(--font-fraunces), serif; font-size: 28px; font-weight: 400; color: var(--ink); }
.l-marquee-track em { font-style: italic; }
.l-marquee-sep { color: var(--yellow-deep); }
@keyframes lscroll { to{transform:translateX(-50%)} }

/* ── SECTION COMMON ── */
.l-wrap { max-width: 1200px; margin: 0 auto; padding: 0 36px; }
.l-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 999px; background: oklch(0.20 0.025 285 / 0.05); font-family: var(--font-geist-mono), monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-2); }
.l-eyebrow .e-dot { width: 6px; height: 6px; border-radius: 50%; }
.l-section-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; margin-bottom: 48px; }
.l-section-head h2 { font-size: clamp(36px, 4.6vw, 60px); line-height: 1.02; max-width: 640px; font-family: var(--font-fraunces), serif; font-variation-settings: "SOFT" 80; font-weight: 420; letter-spacing: -0.03em; }
.l-section-head h2 em { font-style: italic; }
.l-h-side { max-width: 340px; color: var(--ink-2); line-height: 1.55; }

/* ── HOW ── */
.l-how { padding: 80px 0 120px; }
.l-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; }
.l-how-step { position: relative; padding: 32px 28px; background: var(--bg-2); border-radius: 20px; border: 1px solid var(--line); }
.l-how-num { position: absolute; top: -18px; left: 24px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-fraunces), serif; font-size: 22px; font-weight: 500; border: 1px solid var(--line); background: var(--bg-2); }
.l-how-step:nth-child(1) .l-how-num { background: var(--yellow); color: oklch(0.30 0.14 72); border-color: var(--yellow-deep); }
.l-how-step:nth-child(2) .l-how-num { background: var(--purple); color: oklch(0.99 0 0); border-color: var(--purple); }
.l-how-step:nth-child(3) .l-how-num { background: var(--green); color: oklch(0.22 0.08 155); border-color: var(--green); }
.l-how-step h3 { font-family: var(--font-fraunces), serif; font-size: 26px; margin-top: 14px; margin-bottom: 10px; font-variation-settings: "SOFT" 80; font-weight: 440; letter-spacing:-0.02em; }
.l-how-step p { color: var(--ink-2); line-height: 1.5; font-size: 14px; }

/* ── STRUCTURES ── */
.l-structures { padding: 120px 0; position: relative; }
.l-structures-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.l-struct-card { position: relative; background: var(--bg-2); border: 1px solid var(--line); border-radius: 24px; padding: 28px; overflow: hidden; transition: transform 300ms, box-shadow 300ms; display: flex; flex-direction: column; aspect-ratio: 1 / 1.1; }
.l-struct-card:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -30px oklch(0.20 0.025 285 / 0.25); }
.l-struct-card.c-yellow { background: linear-gradient(180deg, oklch(0.97 0.05 85) 0%, var(--bg-2) 60%); }
.l-struct-card.c-purple { background: linear-gradient(180deg, var(--purple-soft) 0%, var(--bg-2) 60%); }
.l-struct-card.c-green { background: linear-gradient(180deg, var(--green-soft) 0%, var(--bg-2) 60%); }
.l-struct-card.c-pink { background: linear-gradient(180deg, var(--pink-soft) 0%, var(--bg-2) 60%); }
.l-struct-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; align-self: flex-start; }
.l-struct-card.c-yellow .l-struct-tag { background: var(--yellow); color: oklch(0.30 0.14 72); }
.l-struct-card.c-purple .l-struct-tag { background: var(--purple); color: oklch(0.99 0 0); }
.l-struct-card.c-green .l-struct-tag { background: var(--green); color: oklch(0.22 0.08 155); }
.l-struct-card.c-pink .l-struct-tag { background: var(--pink); color: oklch(0.30 0.14 10); }
.l-struct-card-viz { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; margin: 10px 0 20px; }
.l-struct-label { display: flex; justify-content: space-between; align-items: flex-end; }
.l-struct-name { font-family: var(--font-fraunces), serif; font-size: 36px; line-height: 1; font-variation-settings: "SOFT" 80; font-weight: 450; letter-spacing: -0.03em; }
.l-struct-desc { font-size: 12px; color: var(--ink-2); max-width: 180px; text-align: right; line-height: 1.4; }

/* ── DEMO ── */
.l-demo { padding: 80px 0 120px; }
.l-demo-surface {
  position: relative; height: 540px;
  background: radial-gradient(circle at 30% 20%, oklch(0.92 0.12 85 / 0.4), transparent 50%), radial-gradient(circle at 70% 80%, oklch(0.90 0.1 300 / 0.3), transparent 50%), radial-gradient(circle at 50% 50%, oklch(0.92 0.1 155 / 0.15), transparent 60%), var(--bg-2);
  border: 1px solid var(--line); border-radius: 28px; overflow: hidden; margin-top: 24px;
  box-shadow: 0 40px 80px -40px oklch(0.20 0.025 285 / 0.25);
}
.l-demo-surface::before {
  content: ''; position: absolute; inset: 0;
  background-image: radial-gradient(circle at center, oklch(0.20 0.025 285 / 0.08) 1px, transparent 1.2px);
  background-size: 28px 28px; pointer-events: none;
}
.l-demo-header { position: absolute; top: 16px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center; z-index: 5; pointer-events: none; }
.l-demo-chip { display: flex; align-items: center; gap: 8px; background: var(--bg-2); padding: 7px 12px; border-radius: 999px; font-family: var(--font-geist-mono), monospace; font-size: 11px; color: var(--ink-2); border: 1px solid var(--line); letter-spacing: 0.06em; box-shadow: 0 4px 10px -4px oklch(0.20 0.025 285 / 0.15); }
.l-demo-chip .lvl { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 999px; background: var(--yellow); color: oklch(0.30 0.14 72); font-size: 10px; font-weight: 700; }
.l-demo-add { pointer-events: auto; padding: 9px 16px; border-radius: 999px; background: var(--ink); color: var(--bg-2); font-size: 13px; font-weight: 500; border: none; display: flex; align-items: center; gap: 6px; transition: transform 160ms; box-shadow: 0 8px 20px -6px var(--ink); }
.l-demo-add:hover { transform: scale(1.04); }
.l-item-card { position: absolute; background: var(--bg-2); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px 12px 12px; display: flex; align-items: center; gap: 10px; cursor: grab; user-select: none; box-shadow: 0 6px 20px -8px oklch(0.20 0.025 285 / 0.25); transition: box-shadow 220ms, border-color 200ms; font-size: 13px; color: var(--ink); min-width: 150px; }
.l-item-card:hover { border-color: var(--line-strong); box-shadow: 0 14px 30px -8px oklch(0.20 0.025 285 / 0.35); }
.l-item-card.dragging { cursor: grabbing; transform: rotate(-1deg) scale(1.03); box-shadow: 0 24px 50px -10px oklch(0.20 0.025 285 / 0.45); z-index: 10; }
.l-item-icon { width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 12px; font-weight: 600; }
.l-item-card.project .l-item-icon { background: linear-gradient(135deg, oklch(0.85 0.14 300), var(--purple)); color: oklch(0.99 0 0); }
.l-item-card.task .l-item-icon { background: linear-gradient(135deg, oklch(0.90 0.14 85), var(--yellow-deep)); color: oklch(0.30 0.14 72); }
.l-item-card.quest .l-item-icon { background: linear-gradient(135deg, oklch(0.85 0.14 155), var(--green)); color: oklch(0.22 0.08 155); }
.l-item-type { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--ink-3); text-transform: uppercase; margin-top: 2px; }
.l-item-title { line-height: 1.2; font-weight: 500; }
.l-item-xp { position: absolute; top: -6px; right: -6px; padding: 2px 6px; border-radius: 999px; background: var(--green); color: oklch(0.22 0.08 155); font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 700; border: 2px solid var(--bg-2); }

/* ── SIGN IN ── */
.l-signin { padding: 80px 0 120px; }
.l-signin-inner { max-width: 980px; margin: 0 auto; padding: 0 36px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; }
.l-signin-left h2 { font-family: var(--font-fraunces), serif; font-size: clamp(40px, 5.2vw, 68px); line-height: 1; font-variation-settings: "SOFT" 90; font-weight: 430; letter-spacing: -0.03em; }
.l-signin-left h2 em { font-style: italic; color: var(--purple); }
.l-signin-left p { color: var(--ink-2); line-height: 1.55; font-size: 17px; margin-top: 18px; max-width: 420px; }
.l-signin-perks { margin-top: 28px; display: flex; flex-direction: column; gap: 12px; }
.l-perk { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--ink-2); }
.l-perk-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.l-auth-card { background: var(--bg-2); border: 1px solid var(--line); border-radius: 24px; padding: 30px; box-shadow: 0 30px 60px -30px oklch(0.20 0.025 285 / 0.25); position: relative; }
.l-auth-card::before { content: ''; position: absolute; top: -2px; left: 30px; right: 30px; height: 3px; background: linear-gradient(90deg, var(--yellow), var(--pink), var(--purple), var(--green)); border-radius: 999px; opacity: 0.8; }
.l-form-tabs { display: flex; gap: 4px; padding: 4px; background: oklch(0.20 0.025 285 / 0.05); border-radius: 12px; margin-bottom: 22px; }
.l-form-tab { flex: 1; padding: 10px; border-radius: 8px; background: transparent; border: none; color: var(--ink-2); font-size: 13px; font-weight: 500; transition: all 180ms; }
.l-form-tab.active { background: var(--bg-2); color: var(--ink); box-shadow: 0 2px 6px -2px oklch(0.20 0.025 285 / 0.2); }
.l-field { margin-bottom: 14px; }
.l-field label { display: block; font-size: 11px; color: var(--ink-3); margin-bottom: 6px; font-family: var(--font-geist-mono), monospace; letter-spacing: 0.08em; text-transform: uppercase; }
.l-field input { width: 100%; padding: 13px 14px; background: oklch(0.20 0.025 285 / 0.03); border: 1.5px solid var(--line); border-radius: 11px; color: var(--ink); font-family: inherit; font-size: 14px; transition: all 180ms; }
.l-field input::placeholder { color: var(--ink-3); }
.l-field input:focus { outline: none; border-color: var(--yellow-deep); background: var(--bg-2); box-shadow: 0 0 0 4px oklch(0.85 0.16 85 / 0.3); }
.l-form-submit { width: 100%; padding: 14px; border-radius: 12px; border: none; background: var(--ink); color: var(--bg-2); font-weight: 500; font-size: 14px; margin-top: 6px; transition: transform 160ms, box-shadow 200ms; display: flex; align-items: center; justify-content: center; gap: 8px; }
.l-form-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 28px -10px var(--ink); }

/* ── FOOTER ── */
.l-footer { padding: 40px 36px 32px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; color: var(--ink-3); font-size: 13px; max-width: 1200px; margin: 0 auto; }
.l-footer .links { display: flex; gap: 24px; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .l-hero-wrap { grid-template-columns: 1fr; gap: 40px; }
  .l-hero-visual { max-width: 460px; margin: 0 auto; }
  .l-structures-grid, .l-how-grid { grid-template-columns: 1fr; }
  .l-signin-inner { grid-template-columns: 1fr; gap: 40px; }
  .l-nav { gap: 10px; padding: 8px 8px 8px 14px; }
  .l-nav-links a:not(.l-nav-cta) { display: none; }
  .l-nav-xp { display: none; }
  .l-footer { flex-direction: column; gap: 16px; text-align: center; }
}
`;

// ─── Structure Visualizations ─────────────────────────────────────────────────

function LinearViz() {
  const [done, setDone] = useState([false, false, false, false]);
  useEffect(() => {
    const id = setInterval(() => setDone(d => {
      const i = d.findIndex(x => !x);
      if (i === -1) return [false, false, false, false];
      const n = [...d]; n[i] = true; return n;
    }), 1300);
    return () => clearInterval(id);
  }, []);
  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 210 }}>
      <line x1="40" y1="25" x2="40" y2="215" stroke="oklch(0.30 0.14 72 / 0.25)" strokeWidth="2" strokeDasharray="4 4"/>
      {[0,1,2,3].map(i => {
        const y = 25 + i * 63;
        const d = done[i];
        return (
          <g key={i}>
            <circle cx="40" cy={y} r="13"
              fill={d ? 'oklch(0.72 0.18 72)' : 'oklch(0.99 0.01 92)'}
              stroke={d ? 'oklch(0.72 0.18 72)' : 'oklch(0.30 0.14 72 / 0.4)'}
              strokeWidth="2" style={{ transition: 'all 400ms' }}/>
            {d && <path d={`M${35} ${y} l4 4 l7 -7`} stroke="oklch(0.30 0.14 72)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
            <text x="62" y={y + 1} fontSize="12"
              fill={d ? 'oklch(0.62 0.015 285)' : 'oklch(0.20 0.025 285)'}
              dominantBaseline="middle"
              style={{ textDecoration: d ? 'line-through' : 'none', transition: 'all 400ms' }}>
              {['Draft outline','Write intro','Edit body','Send it'][i]}
            </text>
            {d && <text x="150" y={y + 1} fontSize="10" fill="oklch(0.30 0.12 155)" dominantBaseline="middle" fontWeight="600">+15 XP</text>}
          </g>
        );
      })}
    </svg>
  );
}

function TreeViz() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const id = setInterval(() => setPulse(p => (p + 1) % 7), 850); return () => clearInterval(id); }, []);
  const nodes = [
    { id: 0, x: 110, y: 28, root: true },
    { id: 1, x: 40,  y: 110 }, { id: 2, x: 180, y: 110 },
    { id: 3, x: 20,  y: 200 }, { id: 4, x: 80,  y: 200 }, { id: 5, x: 160, y: 200 }, { id: 6, x: 210, y: 200 },
  ];
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
  return (
    <svg viewBox="0 0 240 230" width="100%" style={{ maxWidth: 230 }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="oklch(0.62 0.19 300 / 0.35)" strokeWidth="1.5"/>
      ))}
      {nodes.map((n, i) => {
        const active = pulse === i;
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.root ? 13 : 9}
              fill={n.root ? 'oklch(0.62 0.19 300)' : active ? 'oklch(0.78 0.16 300)' : 'oklch(0.99 0.01 92)'}
              stroke={n.root ? 'oklch(0.62 0.19 300)' : active ? 'oklch(0.62 0.19 300)' : 'oklch(0.62 0.19 300 / 0.5)'}
              strokeWidth="2" style={{ transition: 'all 500ms' }}/>
            {active && !n.root && (
              <circle cx={n.x} cy={n.y} r="12" fill="none" stroke="oklch(0.62 0.19 300)" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" from="9" to="22" dur="0.9s" fill="freeze"/>
                <animate attributeName="opacity" from="0.7" to="0" dur="0.9s" fill="freeze"/>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PipelineViz() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => (t + 1) % 10), 900); return () => clearInterval(id); }, []);
  const phases = [{ n: 'Scope', tasks: 3 }, { n: 'Build', tasks: 3 }, { n: 'Ship', tasks: 2 }];
  const done = tick <= 8 ? tick : 0;
  let cursor = 0;
  const phaseState = phases.map(p => { const start = cursor; cursor += p.tasks; return { ...p, completed: Math.max(0, Math.min(p.tasks, done - start)), _start: start }; });
  const activeIdx = phaseState.findIndex(p => p.completed < p.tasks) === -1 ? phases.length - 1 : phaseState.findIndex(p => p.completed < p.tasks);
  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 220 }}>
      {phases.map((p, pi) => {
        const y = 30 + pi * 64;
        const phase = phaseState[pi];
        const isDone = phase.completed >= p.tasks;
        const isActive = pi === activeIdx && !isDone;
        const isLocked = pi > activeIdx;
        return (
          <g key={pi}>
            <rect x="14" y={y - 12} width="50" height="24" rx="7"
              fill={isDone ? 'oklch(0.72 0.18 8)' : isActive ? 'oklch(0.88 0.12 10)' : 'oklch(0.94 0.02 10)'}
              stroke={isLocked ? 'oklch(0.72 0.18 8 / 0.25)' : 'oklch(0.72 0.18 8)'}
              strokeWidth="1.5" style={{ transition: 'all 400ms' }}/>
            <text x="39" y={y + 1} fontSize="10" fontWeight="600"
              fill={isLocked ? 'oklch(0.62 0.015 285)' : 'oklch(0.30 0.14 10)'}
              textAnchor="middle" dominantBaseline="middle">
              {isDone ? '✓' : isActive ? '●' : '○'} {p.n}
            </text>
            {pi < phases.length - 1 && (
              <line x1="39" y1={y + 14} x2="39" y2={y + 50}
                stroke={isDone ? 'oklch(0.72 0.18 8)' : 'oklch(0.72 0.18 8 / 0.2)'}
                strokeWidth="1.5" strokeDasharray={isDone ? '0' : '3 3'}
                style={{ transition: 'all 400ms' }}/>
            )}
            {Array.from({ length: p.tasks }).map((_, ti) => {
              const taskDone = ti < phase.completed;
              const taskActive = !isLocked && ti === phase.completed && isActive;
              const cx = 88 + ti * 42;
              return (
                <g key={ti}>
                  <line x1="64" y1={y} x2={cx - 10} y2={y}
                    stroke={taskDone ? 'oklch(0.72 0.18 8 / 0.5)' : 'oklch(0.72 0.18 8 / 0.15)'}
                    strokeWidth="1" strokeDasharray={taskDone ? '0' : '2 2'}/>
                  <circle cx={cx} cy={y} r="8"
                    fill={taskDone ? 'oklch(0.72 0.18 8)' : taskActive ? 'oklch(0.94 0.05 15)' : 'oklch(0.99 0.01 92)'}
                    stroke={isLocked ? 'oklch(0.72 0.18 8 / 0.2)' : 'oklch(0.72 0.18 8 / 0.6)'}
                    strokeWidth="1.5" style={{ transition: 'all 300ms', opacity: isLocked ? 0.5 : 1 }}/>
                  {taskDone && <path d={`M${cx - 3.5} ${y} l2.5 2.5 l4.5 -4.5`} stroke="oklch(0.99 0.01 92)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                  {taskActive && (
                    <circle cx={cx} cy={y} r="10" fill="none" stroke="oklch(0.72 0.18 8)" strokeWidth="1.5" opacity="0.6">
                      <animate attributeName="r" values="8;14;8" dur="1.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.7;0;0.7" dur="1.2s" repeatCount="indefinite"/>
                    </circle>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function StarViz() {
  const [active, setActive] = useState(0);
  useEffect(() => { const id = setInterval(() => setActive(a => (a + 1) % 6), 700); return () => clearInterval(id); }, []);
  const center = { x: 120, y: 120 };
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { id: i, x: center.x + Math.cos(a) * 78, y: center.y + Math.sin(a) * 78 };
  });
  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 220 }}>
      {nodes.map((n, i) => (
        <line key={i} x1={center.x} y1={center.y} x2={n.x} y2={n.y}
          stroke={active === i ? 'oklch(0.72 0.17 155 / 0.8)' : 'oklch(0.72 0.17 155 / 0.25)'}
          strokeWidth={active === i ? 2 : 1.5} style={{ transition: 'all 300ms' }}/>
      ))}
      <circle cx={center.x} cy={center.y} r="16" fill="oklch(0.72 0.17 155)"/>
      <circle cx={center.x} cy={center.y} r="24" fill="none" stroke="oklch(0.72 0.17 155 / 0.4)" strokeWidth="1.5">
        <animate attributeName="r" values="16;30;16" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0;0.7" dur="3s" repeatCount="indefinite"/>
      </circle>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={active === i ? 11 : 9}
          fill={active === i ? 'oklch(0.85 0.15 155)' : 'oklch(0.99 0.01 92)'}
          stroke="oklch(0.72 0.17 155)" strokeWidth="2" style={{ transition: 'all 300ms' }}/>
      ))}
    </svg>
  );
}

// ─── Desktop Demo ─────────────────────────────────────────────────────────────

type DemoItem = { id: number; type: 'project' | 'task' | 'quest'; icon: string; title: string; xp: number; x: number; y: number };

const INITIAL_ITEMS: DemoItem[] = [
  { id: 1, type: 'project', icon: '◆', title: 'Portfolio redesign', xp: 120, x: 60,  y: 96  },
  { id: 2, type: 'task',    icon: '●', title: 'Call the dentist',   xp: 15,  x: 430, y: 78  },
  { id: 3, type: 'project', icon: '◆', title: 'Q2 planning',        xp: 260, x: 250, y: 238 },
  { id: 4, type: 'quest',   icon: '✦', title: 'Reply to Maya',      xp: 25,  x: 620, y: 166 },
  { id: 5, type: 'task',    icon: '●', title: 'Book flight',        xp: 40,  x: 760, y: 330 },
  { id: 6, type: 'project', icon: '◆', title: 'Newsletter draft',   xp: 90,  x: 100, y: 390 },
  { id: 7, type: 'quest',   icon: '✦', title: 'Walk 30 min',        xp: 20,  x: 510, y: 410 },
];

function DesktopDemo() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [dragging, setDragging] = useState<{ id: number; dx: number; dy: number } | null>(null);
  const [nextId, setNextId] = useState(8);

  function addItem() {
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const titles = ['Untitled task','Rough idea','Follow up','Remember','New thing','Quick win'];
    const types: DemoItem['type'][] = ['task','project','quest'];
    const icons = { task: '●', project: '◆', quest: '✦' };
    const type = types[Math.floor(Math.random() * types.length)];
    setItems(its => [...its, {
      id: nextId, type, icon: icons[type],
      title: titles[Math.floor(Math.random() * titles.length)],
      xp: [10,15,20,25,40,80][Math.floor(Math.random() * 6)],
      x: 60 + Math.random() * Math.max(100, rect.width - 260),
      y: 80 + Math.random() * Math.max(100, rect.height - 180),
    }]);
    setNextId(n => n + 1);
  }

  function onMouseDown(e: React.MouseEvent, id: number) {
    e.preventDefault();
    const surface = surfaceRef.current;
    if (!surface) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    const rect = surface.getBoundingClientRect();
    setDragging({ id, dx: e.clientX - rect.left - item.x, dy: e.clientY - rect.top - item.y });
  }

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragging.dx));
      const y = Math.max(60, Math.min(rect.height - 50, e.clientY - rect.top - dragging.dy));
      setItems(its => its.map(i => i.id === dragging.id ? { ...i, x, y } : i));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  return (
    <div className="l-demo-surface" ref={surfaceRef}>
      <div className="l-demo-header">
        <div className="l-demo-chip"><span className="lvl">LV.7</span> Your desktop</div>
        <button className="l-demo-add" onClick={addItem}>+ New item</button>
      </div>
      {items.map(item => (
        <div
          key={item.id}
          className={`l-item-card ${item.type}${dragging?.id === item.id ? ' dragging' : ''}`}
          style={{ left: item.x, top: item.y }}
          onMouseDown={(e) => onMouseDown(e, item.id)}
        >
          <div className="l-item-icon">{item.icon}</div>
          <div>
            <div className="l-item-type">{item.type}</div>
            <div className="l-item-title">{item.title}</div>
          </div>
          <div className="l-item-xp">+{item.xp} xp</div>
        </div>
      ))}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authed
  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/tasks');
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getBrowserClient();
    const { error: authError } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push('/tasks');
  }

  const structures = [
    { viz: <LinearViz />, name: 'Linear', desc: 'Steps that happen in order.', klass: 'c-yellow', tag: 'SEQUENCE' },
    { viz: <TreeViz />,   name: 'Tree',   desc: 'A big job split into branches.', klass: 'c-purple', tag: 'BRANCHES' },
    { viz: <StarViz />,   name: 'Star',   desc: 'A goal with independent pieces.', klass: 'c-green', tag: 'PARALLEL' },
    { viz: <PipelineViz />, name: 'Pipeline', desc: 'Phases that unlock as you finish each one.', klass: 'c-pink', tag: 'PHASES' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* NAV */}
      <nav className="l-nav">
        <a href="#" className="l-nav-logo">
          <div className="l-z-mark">Z</div>
          <span>Zeno</span>
        </a>
        <div className="l-nav-xp">
          <span className="dot" />
          <span>v0.1</span>
          <span style={{ color: 'var(--ink-3)' }}>·</span>
          <span>in progress</span>
        </div>
        <div className="l-nav-links">
          <a href="#how">How it works</a>
          <a href="#structures">Structures</a>
          <a href="#signin">Log in</a>
          <a href="#signin" className="l-nav-cta">Sign up →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-wrap">
          <div>
            <h1 className="display">
              Finally, a task app<br />your brain <span className="hl"><em>can start.</em></span>
            </h1>
            <p className="sub">Drop a big scary task on your desktop. Zeno breaks it down into a shape you can actually see — a line, a tree, a star, or a pipeline — so the next thing to do is always obvious.</p>
            <div className="l-hero-stats">
              <div className="l-hero-stat">
                <div className="chip" style={{ background: 'var(--yellow)' }}>⚡</div>
                <span>XP per subtask</span>
              </div>
              <div className="l-hero-stat">
                <div className="chip" style={{ background: 'var(--pink-soft)' }}>🔥</div>
                <span>Streaks</span>
              </div>
              <div className="l-hero-stat">
                <div className="chip" style={{ background: 'var(--purple-soft)' }}>◆</div>
                <span>Unlocks as you level</span>
              </div>
            </div>
            <div className="l-cta-row">
              <a href="#signin" className="l-btn l-btn-primary">
                Create your desktop →
              </a>
              <a href="#how" className="l-btn l-btn-ghost">See how it works</a>
            </div>
          </div>

          <div className="l-hero-visual">
            <div className="l-floater one">⚡ LV. UP</div>
            <div className="l-floater two">+250 XP</div>
            <div className="l-floater three">🔥 streak</div>
            <div className="l-badge-stack">
              <div className="l-level-card primary">
                <div className="l-level-head">
                  <div className="l-level-icon li-purple">◆</div>
                  <div style={{ flex: 1 }}>
                    <div className="l-level-title">Ship Q2 launch</div>
                    <div className="l-level-sub">TREE · 6 subtasks</div>
                  </div>
                  <div className="l-streak-pill">🔥 12</div>
                </div>
                <div className="l-xp-track"><div className="l-xp-fill" style={{ width: '68%' }} /></div>
                <div className="l-xp-meta"><span>Level 3</span><span>540 / 800 XP</span></div>
                <div className="l-subtasks">
                  <div className="l-subtask done"><div className="l-sub-check">✓</div><span>Design hero page</span></div>
                  <div className="l-subtask done"><div className="l-sub-check">✓</div><span>Draft announcement</span></div>
                  <div className="l-subtask"><div className="l-sub-check" /><span>Record product demo</span></div>
                </div>
              </div>
              <div className="l-level-card secondary" style={{ padding: 16 }}>
                <div className="l-achievement">
                  <div className="l-ach-medal">★</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>First star broken!</div>
                    <div className="l-level-sub" style={{ marginTop: 2 }}>+100 XP</div>
                  </div>
                </div>
              </div>
              <div className="l-level-card tertiary" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="l-level-icon li-yellow" style={{ width: 32, height: 32, fontSize: 14 }}>●</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Call the dentist</div>
                    <div className="l-level-sub" style={{ marginTop: 2 }}>+15 XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="l-marquee" aria-hidden="true">
        <div className="l-marquee-track">
          <span>Break it down. <em>Start it.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Every check is <em>confetti.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Your desktop, <em>not an inbox.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Drag, drop, <em>dopamine.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Break it down. <em>Start it.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Every check is <em>confetti.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Your desktop, <em>not an inbox.</em></span>
          <span className="l-marquee-sep">✦</span>
          <span>Drag, drop, <em>dopamine.</em></span>
          <span className="l-marquee-sep">✦</span>
        </div>
      </div>

      {/* HOW */}
      <section className="l-how" id="how">
        <div className="l-wrap">
          <div className="l-section-head">
            <div>
              <div className="l-eyebrow" style={{ marginBottom: 16 }}>
                <span className="e-dot" style={{ background: 'var(--purple)' }} /> How it works
              </div>
              <h2 className="fraunces">Three clicks from <em>overwhelmed</em> to <em>on it</em>.</h2>
            </div>
            <p className="l-h-side">Zeno is the opposite of a to-do list. It doesn&apos;t want your tasks to pile up — it wants them gone, with a satisfying little pop each time.</p>
          </div>
          <div className="l-how-grid">
            <div className="l-how-step">
              <div className="l-how-num">1</div>
              <h3>Drop it on the desk</h3>
              <p>Give it a name, even a vague one. Your desktop is spatial — the thing lives where you put it.</p>
            </div>
            <div className="l-how-step">
              <div className="l-how-num">2</div>
              <h3>Let Zeno split it</h3>
              <p>The AI picks a shape (line, tree, star, or pipeline) and fills in the subtasks. No blank page, no paralysis.</p>
            </div>
            <div className="l-how-step">
              <div className="l-how-num">3</div>
              <h3>Check things off, one at a time</h3>
              <p>Tick the active node and the next one unlocks. One small win at a time, never the whole mountain at once.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STRUCTURES */}
      <section className="l-structures" id="structures">
        <div className="l-wrap">
          <div className="l-section-head">
            <div>
              <div className="l-eyebrow" style={{ marginBottom: 16 }}>
                <span className="e-dot" style={{ background: 'var(--yellow-deep)' }} /> The breakdown
              </div>
              <h2 className="fraunces">Every task gets the <em>shape it needs.</em></h2>
            </div>
            <p className="l-h-side">Linear for sequences. Tree for branches. Star for independent pieces. Pipeline for work that moves through phases. Zeno picks; you start.</p>
          </div>
          <div className="l-structures-grid">
            {structures.map((s, i) => (
              <div key={i} className={`l-struct-card ${s.klass}`}>
                {s.tag && <div className="l-struct-tag">{s.tag}</div>}
                <div className="l-struct-card-viz">{s.viz}</div>
                <div className="l-struct-label">
                  <div className="l-struct-name">{s.name}</div>
                  {s.desc && <div className="l-struct-desc">{s.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESKTOP DEMO */}
      <section className="l-demo" id="desktop">
        <div className="l-wrap">
          <div className="l-section-head">
            <div>
              <div className="l-eyebrow" style={{ marginBottom: 16 }}>
                <span className="e-dot" style={{ background: 'var(--green)' }} /> The desktop
              </div>
              <h2 className="fraunces" style={{ whiteSpace: 'nowrap' }}>A space for things, <em>not a list.</em></h2>
            </div>
            <p className="l-h-side mono" style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Try it — drag the cards around</p>
          </div>
          <DesktopDemo />
        </div>
      </section>

      {/* SIGN IN */}
      <section className="l-signin" id="signin">
        <div className="l-signin-inner">
          <div className="l-signin-left">
            <div className="l-eyebrow" style={{ marginBottom: 20 }}>
              <span className="e-dot" style={{ background: 'var(--pink)' }} /> Come on in
            </div>
            <h2>Light up your <em>desktop.</em></h2>
            <p>Your cards and your progress — all waiting exactly where you left them.</p>
            <div className="l-signin-perks">
              <div className="l-perk"><div className="l-perk-icon" style={{ background: 'var(--yellow)' }}>⚡</div> Free — this is a personal side project</div>
              <div className="l-perk"><div className="l-perk-icon" style={{ background: 'var(--green-soft)', color: 'oklch(0.22 0.08 155)' }}>✓</div> Runs in the browser, no install</div>
              <div className="l-perk"><div className="l-perk-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>◆</div> Your tasks are private to your account</div>
            </div>
          </div>

          <form className="l-auth-card" onSubmit={handleSubmit}>
            <div className="l-form-tabs">
              <button type="button" className={`l-form-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
              <button type="button" className={`l-form-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Sign up</button>
            </div>
            <div className="l-field">
              <label>Email</label>
              <input type="email" placeholder="you@somewhere.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="l-field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p style={{ fontSize: 13, color: 'oklch(0.65 0.2 15)', marginBottom: 10 }}>{error}</p>}
            <button className="l-form-submit" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Enter your desktop' : 'Create your desktop'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="l-z-mark" style={{ width: 24, height: 24, fontSize: 12, borderRadius: 8 }}>Z</div>
          Zeno
        </div>
        <div className="links">
          <a href="#">Privacy</a>
          <a href="#">Changelog</a>
          <a href="#">Contact</a>
          <a href="#">© 2026</a>
        </div>
      </footer>
    </>
  );
}
