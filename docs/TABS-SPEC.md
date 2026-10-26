# Dayprint — Workspace Tabs & Panel Specifications

> Derived from static code analysis of `src/`. Documents interactive panels, modal contracts, and view modes.  
> Date: 2026-10-25

---

## 0. Executive Summary

The application comprises **15 interactive surfaces** across three distinct functional tiers:

| Layer | Count | Interaction Behavior | Affects `viewMode` |
|---|---|---|---|
| Primary Workspace Tabs | 3 | Fullscreen mutually exclusive views | Yes (`daily` / `memory_os` / `graph`) |
| Secondary Modals & Overlays | 4 | Contextual overlays with Escape / backdrop dismissal | No |
| System & Configuration Drawers | 8 | Persistent forms and search tools | No |

---

## 1. Global Shell & Navigation

- **Sidebar (`AppSidebar.tsx`)**:
  - Brand header displaying Dayprint seal and tagline.
  - View mode switchers: `daily` (Daily Canvas), `memory_os` (Cognitive Ledger), and `graph` (Knowledge Graph).
  - Quick action buttons: Daily Receipt Modal, Weekly Digest, Career Studio, and GitHub Sync Settings.
- **Top Bar (`HeaderBar.tsx`)**:
  - Live calendar indicator and total memory item counter.
  - Global OmniSearch shortcut (`Cmd+K`).
  - Right companion panel toggle button (`PanelRightClose` / `PanelRight`).
- **Context Panel (`ContextPanel.tsx`)**:
  - Collapsible side companion showing cognitive distribution and daily heatmaps.

---

## 2. Primary Tabs

### 2.1 Tab 1: Daily Canvas (`daily`)
- **Main View**: Masonry stream organizing memory cards chronologically with washi-tape decorations.
- **Progressive Editor (`TodayEditor.tsx`)**: Compact 44px typewriter line expanding to full drafting workbench upon focus.
- **Micro-Interactions**: Real-time mechanical typing audio and tactile thermal receipt tear keyframe animations.

### 2.2 Tab 2: Cognitive Ledger (`memory_os`)
- **Cognitive Matrix**: Five-tier classification view (L0 Raw Stream, L1 Daily Clusters, L2 Habits, L3 Mental Models, L4 Core Values).
- **STAR Distillation Studio**: Turns raw work thoughts into structured Situation, Task, Action, and Result achievements.

### 2.3 Tab 3: Knowledge Graph (`graph`)
- **Force-Directed Graph (`ForceGraphCanvas.tsx`)**: Physics-based graph rendering bidirectional `[[wiki-links]]` between thoughts.
- **Neighborhood Highlighting**: Hovering over a memory node isolates its connected cluster and displays cross-domain resonance.

---

## 3. Modals & Archival Services

- **Daily Receipt Modal (`DailyReceiptModal.tsx`)**: Generates an aesthetic, printable thermal receipt summarizing an entire day's reflections.
- **Weekly Digest Modal (`WeeklyDigestModal.tsx`)**: Synthesizes natural-week learnings with inline CRUD editing and Markdown export.
- **GitHub Sync Drawer (`GitHubSettingsModal.tsx`)**: Manages repository credentials, auto-sync debounce triggers, and manual commit pushes.
