# Project: Zeno

## What is this?

Zeno is an ADHD-friendly to-do list web app. The core problem it solves: people with ADHD struggle to start large tasks because they feel overwhelming. Zeno breaks tasks down automatically using AI and wraps the whole experience in light gamification to keep the user engaged.

## Core Features

### AI Task Splitting
- User adds a task (e.g. "Write my essay")
- User selects the task and triggers an AI breakdown
- The AI (Claude API) splits the task into small, concrete, actionable subtasks
- User works through subtasks one by one — each is a single, focused action

### Gamification (XP System)
- Completing a subtask awards XP
- Completing a full parent task awards a bonus XP multiplier
- XP accumulates toward levels or milestones to keep the user engaged
- Visual feedback on completion (animation, sound, etc.) to reward dopamine hits

## Design Philosophy
- Minimize cognitive load — the UI should never feel cluttered or overwhelming
- One thing at a time — the focused subtask view is the core interaction loop
- Reward small wins — every checkbox completion should feel satisfying
- Mobile-first — ADHD users may be on their phone

## Status
Early scaffold. No features implemented yet. Stack is chosen; product design is still being finalized.
