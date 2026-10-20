---
doc: prd
status: approved
---

# Dayprint (今日印迹) — Product Requirements Document

Dayprint is a zero-friction, tactile personal micro-journal and cognitive memory hub for deep thinkers, writers, and learners who want effortless daily journaling without organizational burden or cloud privacy risks.

## The Core Journey
1. **Arrival & Zero-Config Load**: The user opens Dayprint; the app instantly hydrates previous slips and memory state from local storage with deterministic SSR guards (no hydration flicker or lag).
2. **Instant Micro-Capture**: The user presses `Cmd+K` or focuses on the bottom input dock, types a short reflection, picks an optional tag or image, and hits Enter.
3. **Tactile Paper Receipt**: A thermal paper receipt animates into view with authentic tear-off motion and paper audio feedback, dropping naturally onto the editorial canvas.
4. **Scrapbook Browsing & Reflection**: The user scrolls through their daily journal canvas, toggles Morandi category filters, searches entries, or views the contribution heatmap.
5. **Weekly Memory Synthesis & Management**: The user opens the Weekly Digest to review auto-distilled cognitive insights, with full ability to add, edit, or prune memory items.
6. **Silent Sovereignty (GitHub Sync)**: As the user logs thoughts, Dayprint quietly packages the day's records and pushes clean Markdown files and JSON archives to the user's private GitHub repository with keepalive guarantees on window unload.

## Screens and Layout
- **Header Dock**: Minimalist top navigation displaying the Dayprint brand seal, active date, total slip counter, memory vault indicator, and quick action buttons (Weekly Digest, Search, Sync Settings).
- **Editorial Scrapbook Canvas (`Main`)**: An aesthetic, responsive masonry stream presenting thermal slips with staggered heights, washi tape pins, and date dividers.
- **Bottom Capture Bar**: Floating, accessible bottom bar with tag pills (Insight, Mood, Work, Life), image attachment trigger, keyboard shortcut hints, and instant print button.
- **Weekly Memory Modal**: Centered modal overlay featuring week-over-week cognitive synthesis, tag breakdown charts, and a CRUD manager for distilled memory items.
- **GitHub Sync Drawer**: Sliding modal for configuring personal GitHub repository, Personal Access Token (PAT), target branch, and one-click manual/auto sync toggles.

## Look and Feel
- **Color Palette**:
  - Background: Warm Oatmeal Linen (`#FAF7F2` light / `#161413` dark)
  - Thermal Slip: Pure Washi Cream (`#FFFFFF` with `#F4EFE6` aged edges)
  - Accents: Terracotta Ochre (`#D97A60`), Prussian Slate (`#3E5C76`), Matcha Sage (`#5E7A68`), Raw Umber (`#8C6D58`)
- **Typography**: Editorial Swiss Serif (`Playfair Display`, `Newsreader`) paired with clean mono numerals (`JetBrains Mono`).
- **Tactile Elements**: Jagged micro-serrated receipt tear edges, washi tape texture overlays, subtle drop shadows, and delicate card hover physics.

## Features and Behavior

### 1. Instant Micro-Slip Capture
- User can enter freeform text up to 500 characters per slip.
- Auto-detects URLs and formats previews. Supports single image attachments via Base64.
- Keyboard shortcut `Cmd/Ctrl + Enter` triggers instant printing.

### 2. Physical Thermal Receipt Animation & Sound
- CSS `@keyframes` simulate receipt paper feeding out and tearing along a serrated bottom edge.
- Audio synthesis triggers a soft mechanical click upon submission.

### 3. Multi-Tier Cognitive Memory Engine (L0–L4)
- **L0 (Slips)**: Ephemeral raw micro-notes captured throughout the day.
- **L1 (Daily Digest)**: Automatic chronological clustering per calendar day.
- **L2 (Weekly Synthesis)**: Weekly cognitive distillation summarizing key learnings, recurring emotions, and completed milestones.
- **L3 (Horizon Mindscape)**: Long-term trends and persistent habits tracked across months.
- **L4 (Values & North Star)**: Core personal principles distilled from historical reflections.

### 4. Local-First & GitHub Silent Sync
- All state lives primary in browser `localStorage` for instant offline-ready access.
- Changes trigger a debounced (2s) background push to `/api/github/sync`.
- Window `beforeunload` event utilizes `fetch(..., { keepalive: true })` to guarantee inflight syncs complete even if the user abruptly closes the tab.

### 5. Weekly Memory Digest & Management
- Structured breakdown of the current week's memories categorized into "Key Insights", "Emotional Shifts", and "Milestones".
- Users can manually add, edit, or delete distilled memory notes directly in the modal.

## States and Boundaries
- **First-Time User (Empty State)**: Welcomed with 3 pre-seeded sample tactile slips illustrating the four Morandi categories and prompt ideas.
- **Normal Operation**: Full offline capability; instant optimistic UI updates on capture.
- **Unsynced State**: Discreet status dot indicating pending local changes until GitHub sync completes.
- **GitHub Error / Disconnected**: Graceful toast notification; local data remains 100% safe and accessible without interruption.

## Product Decisions
- **Local-First over Centralized Database**: User privacy is paramount. Personal journaling data must not pass through third-party servers.
- **GitHub as the Personal Cloud Backend**: Technical users and writers already trust GitHub. Markdown files in their own repo guarantee lifetime accessibility and portability.
- **Micro-Slips over Long Documents**: Eliminates the cognitive burden of formatting and structured note-taking.

## What We're Building
A complete, standalone Next.js 16 Web Application with:
1. Interactive tactile thermal paper capture & scrapbook stream.
2. 5-Tier cognitive memory synthesis system with Weekly Review UI.
3. Bidirectional GitHub sync engine with keepalive guarantees.
4. Comprehensive search, tag filtering, and date navigation.

## Deferred From the POC
- ESC/POS hardware Bluetooth thermal printer direct output.
- End-to-end encrypted WebRTC peer-to-peer sync between mobile and desktop.

## Non-Goals
- No multi-user social feed or public publishing platform (Dayprint is an intimate, private sanctuary).
- No complex relational database management or proprietary file formats.
