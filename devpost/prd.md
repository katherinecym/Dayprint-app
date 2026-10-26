---
doc: prd
status: approved
---

# Dayprint (今日印迹) — Product Requirements

Dayprint is a zero-friction, tactile personal micro-journal and cognitive memory hub for deep thinkers, writers, and learners who want effortless daily journaling without organizational burden or cloud privacy risks.  
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
1. **Arrival & Zero-Config Load**: The user opens Dayprint in any modern browser. The application instantly hydrates existing slips and cognitive summaries directly from `localStorage` with deterministic SSR guards — no login gate, no cloud loading spinners, and zero hydration flicker.
2. **Instant Micro-Capture**: The user presses `Cmd/Ctrl+K` or focuses the floating bottom input dock, types a short reflection (up to 500 characters), optionally selects a Morandi category tag (Insight, Mood, Work, Life) or attaches an image, and hits Enter.
3. **Tactile Paper Receipt**: A thermal paper receipt animates down the screen with authentic tear-off motion and Web Audio mechanical feedback, landing smoothly into today's masonry scrapbook stream.
4. **Scrapbook Browsing & Reflection**: The user browses their daily journal canvas organized by chronological date headers, filters entries by category tag pills, searches entries in real-time, or manages individual slips (pin/delete).
5. **Weekly Memory Synthesis & Management**: The user opens the Weekly Digest modal to review auto-distilled cognitive summaries categorized into Key Insights, Emotional Themes, and Action Milestones, with inline CRUD editing controls and one-click Markdown export.
6. **Silent Sovereignty (GitHub Sync)**: In the background, Dayprint debounces local mutations and quietly pushes clean Markdown files (`journals/YYYY-MM-DD.md`) and a snapshot (`archive.json`) to the user's private GitHub repository, with `beforeunload` keepalive guarantees.

## Screens and Layout
- **Header Dock**: Minimalist top navigation bar displaying the Dayprint brand seal, active calendar date, total slip counter, memory vault indicator, Weekly Digest button, Search trigger, and GitHub sync status indicator.
- **Editorial Scrapbook Canvas (`Main`)**: An aesthetic, responsive masonry stream presenting thermal slips with staggered heights, washi tape pin aesthetics, and clean daily date dividers.
- **Bottom Capture Bar**: Floating, accessible bottom dock with Morandi tag selector (Insight, Mood, Work, Life), single image attachment trigger, character counter, and instant print button.
- **Weekly Memory Modal**: Centered modal overlay featuring natural-week cognitive synthesis, tag distribution visualization, and an inline CRUD manager for distilled memory bullet points.
- **GitHub Sync Drawer**: Sliding side panel for configuring GitHub username, repository name, Personal Access Token (PAT, masked), branch selection, and manual "Sync Now" triggers.

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **Color Palette**:
  - Background: Warm Oatmeal Linen (`#FAF7F2` light / `#161413` dark canvas)
  - Thermal Slip: Pure Washi Cream (`#FFFFFF` with `#F4EFE6` aged edges)
  - Morandi Category Accents:
    - Insight / Thinking: Deep Prussian Slate (`#3E5C76`)
    - Mood / Emotion: Warm Terracotta Ochre (`#D97A60`)
    - Work / Execution: Earth Bronze (`#8C6D58`)
    - Life / Spark: Sage Matcha (`#5E7A68`)
- **Typography**: Editorial Swiss Serif (`Playfair Display`, `Newsreader`) paired with clean monospace numerals (`JetBrains Mono`).
- **Tactile Details**: Jagged micro-serrated receipt tear edges rendered via SVG mask / CSS clip-path, subtle washi tape texture overlays, and delicate card hover physics.
- **Tone of Voice**: Understated, quiet, craftsman-like. "Your life, in prints."

## Features and Behavior

### 1. Instant Micro-Slip Capture
- User can enter freeform Unicode text up to 500 characters per slip; visual character counter warns as input nears limit.
- Auto-detects URLs and formats clean inline link preview chips.
- Supports single image attachment via file picker or paste (stored locally as Base64 data URI).
- Keyboard shortcuts: `Cmd/Ctrl+Enter` triggers immediate printing; `Cmd/Ctrl+K` focuses input dock.
- Tag selection defaults to last used or general category with one-click Morandi pill toggling.
- Source: `scope.md > The Core Loop`.

### 2. Physical Thermal Receipt Animation & Audio
- CSS `@keyframes` simulate paper feeding out from top and tearing along a jagged serrated bottom edge (200ms ease-out).
- Web Audio API synthesizes a tactile mechanical printer click and subtle paper-tear sound upon submission without external audio asset downloads.
- Source: `scope.md > The Unique Kernel`.

### 3. Multi-Tier Cognitive Memory Engine (L0–L4)
- **L0 (Slips)**: Ephemeral raw micro-notes captured throughout the day.
- **L1 (Daily Digest)**: Automatic chronological clustering per calendar day with date dividers.
- **L2 (Weekly Synthesis)**: Natural-week cognitive distillation summarizing key learnings, recurring emotions, and completed milestones.
- **L3 (Horizon Mindscape)**: Long-term trends and persistent habits tracked across months.
- **L4 (Values & North Star)**: Core personal principles distilled from historical reflections.
- Source: `scope.md > The POC Boundary`.

### 4. Scrapbook Masonry Canvas & Filtering
- Responsive multi-column masonry layout (1 column mobile, 2–3 columns desktop).
- Chronological grouping by day with subtle date dividers.
- Real-time client-side keyword search across all slips.
- Category filter pills ("All", "Insight", "Mood", "Work", "Life") with instantaneous state filtering.
- Card context actions: Pin slip to top, Delete slip with confirmation.

### 5. Weekly Memory Digest & Management
- Modal opens scoped to current ISO week (Mon–Sun) with previous/next week navigation.
- Automatically generates initial structured synthesis: **Key Insights**, **Emotional Theme**, and **Action Milestones** via client heuristic extraction.
- Full inline CRUD capability: users can edit text directly, remove outdated summaries, or add custom manual bullet points.
- One-click "Export as Markdown" downloads a clean `week-YYYY-WNN.md` summary file.
- Source: `scope.md > The POC Boundary`.

### 6. Local-First Architecture & GitHub Silent Sync
- All state resides primarily in browser `localStorage` for sub-second, 100% offline-ready access.
- Changes trigger a debounced (2000ms) background push to `/api/github/sync`.
- API route commits updated `archive.json` snapshot and individual `journals/YYYY-MM-DD.md` files to the user's private repository.
- Handles remote SHA conflict resolution by fetching remote state, union-merging slips by unique `id`, and pushing unified history.
- Window `beforeunload` event fires `fetch(..., { keepalive: true })` or `navigator.sendBeacon` to guarantee in-flight syncs complete upon tab closing.
- Header sync badge displays live status: Synced (green), Pending (amber), or Disconnected (gray).

## States and Boundaries
- **First-Time User (Empty State)**: Canvas displays helpful welcome prompt cards demonstrating the 4 Morandi tags and keyboard shortcuts; Sync Drawer is easily accessible.
- **Offline / Disconnected**: Complete normal operation. Slips save to `localStorage` immediately. Sync status gracefully marks changes as "pending" until network recovers.
- **Invalid / Expired Token**: Sync badge switches to amber with a non-intrusive warning toast; local slips are preserved and never lost.
- **Remote SHA Conflict**: Automatically resolved silently by fetching remote archive, performing two-way union merge, and re-committing.

## Product Decisions
- **Local-First over Centralized Database**: User privacy is paramount. Personal journaling data must not pass through third-party servers.
- **GitHub as the Personal Cloud Backend**: Technical users and writers already trust GitHub. Markdown files in their own repo guarantee lifetime accessibility, versioning, and zero vendor lock-in.
- **Heuristic Client Distillation over Mandatory Paid LLM Keys**: Ensures the app works instantly out-of-the-box for any user with zero configuration or API fees.
- **500-Character Constraint**: Eliminates blank-page paralysis and preserves rapid micro-journaling rhythm.

## What We're Building
A complete, standalone Next.js 16 Web Application containing:
1. Interactive tactile thermal paper capture & scrapbook stream.
2. 5-Tier cognitive memory synthesis system with Weekly Review UI.
3. Bidirectional GitHub sync engine with keepalive guarantees.
4. Comprehensive search, tag filtering, and date navigation.

## Deferred From the POC
- **Hardware Bluetooth Thermal Printer Bridge**: Physical ESC/POS receipt printer streaming deferred to post-hackathon phase.
- **WebRTC Peer-to-Peer Sync**: Multi-device direct mesh syncing deferred to avoid unnecessary protocol complexity during POC.

## Possible Later Enhancements
- User-supplied Gemini / OpenAI API key integration for deeper personalized memory chat.
- Mobile PWA packaging with offline service workers.

## Non-Goals
- No multi-user social feed or public publishing platform (Dayprint is an intimate, private sanctuary).
- No complex relational database management or proprietary file formats.

## Open Questions
- *How should weekly review boundaries be determined?* → Resolved: Standard ISO calendar weeks (Monday to Sunday) to match commit chronology.
- *Should deleting a slip locally remove it from the GitHub archive?* → Resolved: Yes, the latest local archive snapshot represents authoritative state, and the git commit history retains the revision record.
