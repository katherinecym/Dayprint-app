---
doc: spec
status: approved
---

# Dayprint (今日印迹) — Technical Spec

## How This Works, In Plain Language
Dayprint runs completely inside the user's browser as a Local-First Next.js application. When the user types a micro-thought, it instantly writes to local storage and mounts onto a tactile thermal paper card on the screen. In the background, a lightweight API route communicates directly with GitHub's REST API using the user's Personal Access Token (PAT), archiving all slips into human-readable Markdown files and a JSON snapshot in a private repository. A cognitive pipeline aggregates these slips into weekly summaries and memory digests that can be edited and searched at any time.

## The Core Journey Through the System
1. **User input submitted**: `QuickInput` handles keyboard/touch event → calls `useMemory().addSlip()`.
2. **Local state update**: `MemoryContext` updates React state, saves snapshot to `localStorage['dayprint_archive']`, and plays mechanical printer audio.
3. **Optimistic Rendering**: `JournalCanvas` renders the newly stamped `ThermalReceipt` card with CSS tear-off keyframes.
4. **Auto-Sync Trigger**: `useEffect` in `MemoryContext` detects state change → debounces 2000ms → calls `POST /api/github/sync`.
5. **Remote Archiving**: `/api/github/sync` converts slips into dated Markdown slips (`journals/YYYY-MM-DD.md`) and updates `archive.json` via GitHub API with SHA conflict resolution.
6. **Window Unload Protection**: If the browser tab is closed while a sync is pending, a `beforeunload` listener fires `navigator.sendBeacon` / `fetch(..., { keepalive: true })` to guarantee the commit finishes.

## Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS with custom editorial Swiss serif typography and tactile receipt utility classes.
- **Icons & Motion**: Lucide React + custom CSS `@keyframes` receipt feed animation.
- **Storage & State**: React Context + Web Storage API (`localStorage`) + Next.js Serverless API Route.
- **Version Control Integration**: GitHub REST API v3 (Octokit-compatible fetch) using Fine-Grained Personal Access Tokens.

## Where It Runs and How Someone Tries It
- **Local Dev / Testing**:
  ```bash
  pnpm install
  pnpm dev
  # Open http://localhost:3000
  ```
- **Live Cloud Deployment**:
  - Deployable on Vercel or Cloudflare Pages with zero configuration.
  - Can be run completely offline in the browser without setting up GitHub sync (all data persists safely in LocalStorage).

## Look and Feel
- **Visual Tone**: Warm oatmeal linen background (`#FAF7F2`), high-contrast ink charcoal (`#1F1E1D`), tactile washi paper textures.
- **Accents**:
  - Terracotta (`#D97A60`) for Mood / Life highlights
  - Prussian Slate (`#3E5C76`) for Thinking & Insights
  - Matcha Green (`#5E7A68`) for Sparks & Nature
  - Bronze Umber (`#8C6D58`) for Work & Execution
- **Paper Aesthetics**: Serrated jagged tear-off edge via SVG mask / CSS clip-path, delicate receipt stamp typography, and realistic washi tape pins.

## Components
- **`src/components/layout/Header.tsx`**: Top brand banner, search bar trigger, week memory digest trigger, and sync status badge.
- **`src/components/journal/QuickInput.tsx`**: Floating bottom input dock with tag selector, character counter, keyboard listeners (`Cmd+Enter`), and image upload.
- **`src/components/journal/ThermalReceipt.tsx`**: The physical paper card component with serrated edges, timestamp stamp, Morandi tag badge, and tear animation.
- **`src/components/journal/JournalCanvas.tsx`**: Responsive editorial masonry feed organizing slips chronologically with daily date headers.
- **`src/components/memory/WeeklyReviewModal.tsx`**: Modal presenting cognitive distillation of recent slips with interactive CRUD editing for weekly memory points.
- **`src/components/sync/GitHubSyncSettings.tsx`**: Secure drawer to input repo name, PAT token, and toggle automatic silent syncing.

## Data Model
```typescript
export type TagCategory = 'insight' | 'mood' | 'work' | 'life';

export interface JournalSlip {
  id: string;
  content: string;
  category: TagCategory;
  timestamp: number;
  imageUrl?: string;
  weather?: string;
  pinned?: boolean;
}

export interface WeeklyMemorySummary {
  weekId: string; // e.g. "2026-W42"
  title: string;
  keyInsights: string[];
  emotionalTheme: string;
  actionItems: string[];
  updatedAt: number;
}

export interface DayprintArchive {
  version: '3.1';
  lastSyncedAt: number;
  slips: JournalSlip[];
  weeklyMemories: WeeklyMemorySummary[];
}
```

## File Structure
```
build-with-AI-basics/
├── scope.md                     # Devpost Learn: Project scope & kernel
├── prd.md                       # Devpost Learn: Product requirements
├── spec.md                      # Devpost Learn: Technical specification
├── README.md                    # Project overview & quickstart
├── package.json                 # Dependencies & scripts
├── next.config.ts               # Next.js configuration
├── public/                      # Static assets, logos, and icons
└── src/
    ├── app/
    │   ├── api/github/sync/     # Next.js API route for GitHub sync
    │   ├── globals.css          # Editorial styles & paper animations
    │   ├── layout.tsx           # Deterministic root layout
    │   └── page.tsx             # Main Dayprint canvas page
    ├── components/
    │   ├── journal/             # ThermalReceipt, QuickInput, Canvas
    │   ├── memory/              # WeeklyReviewModal & Cognitive digest
    │   ├── sync/                # GitHubSyncSettings modal
    │   └── layout/              # Header & Navigation
    ├── lib/
    │   ├── memory-context.tsx   # Core Local-First reactive store
    │   └── github.ts            # GitHub REST API client
    └── types/
        └── index.ts             # TypeScript schemas & contracts
```

## External Services and Dependencies
- **GitHub REST API (`api.github.com`)**:
  - `GET /repos/{owner}/{repo}/contents/{path}`: Check file SHA and read existing archive.
  - `PUT /repos/{owner}/{repo}/contents/{path}`: Create or update Markdown files and `archive.json`.
  - Rate limits: 5,000 requests/hour with authenticated PAT (more than sufficient for journaling).
  - Cost: Free.

## Important Failure Modes
- **Offline / Network Loss** → App seamlessly operates locally with zero errors; sync marks status as "pending" and retries when network restores.
- **GitHub Token Invalid or Expired** → Sync badge turns amber with a gentle warning toast; local slips are preserved and never lost.
- **Remote SHA Conflict** → Two-way merge merges new remote slips into local state before pushing the unified archive.

## What Was Simplified and Why
- **GitHub as Backend instead of Supabase/Firebase** — Eliminates server maintenance, accounts, and privacy concerns. The user maintains 100% data ownership in plain Markdown.
- **Client-side Cognitive Heuristic Distillation instead of mandatory paid LLM API keys** — Allows the app to work out-of-the-box for any user with zero API key configuration, while supporting plug-and-play AI summaries.
