---
doc: spec
status: approved
---

# Dayprint — Technical Spec

## How This Works, In Plain Language
Dayprint runs completely inside your web browser as a privacy-first Next.js application — there is no hosted centralized database to manage, no user account server, and no third-party tracking. When you type a thought and hit Enter, it instantly writes to your browser storage and animates onto the screen as a tactile thermal paper card. In the background, a lightweight API route communicates directly with GitHub's REST API using your personal access token, archiving all slips into human-readable Markdown files and a JSON snapshot in your private repository. A cognitive memory pipeline aggregates these slips into weekly summaries that you can review, edit, or export anytime.

PRD ref: `prd.md > The Core Journey`.

## The Core Journey Through the System
1. **User Input Submitted**: User enters text in `QuickInput` → triggers `onSubmit` → calls `useMemory().addSlip(text, category, imageUrl)`.
2. **Local State & Audio**: `MemoryContext` writes to React state, persists snapshot to `localStorage['dayprint_archive']`, and invokes Web Audio synthesizer for the tactile printer click.
3. **Optimistic Rendering**: `JournalCanvas` renders the new `ThermalReceipt` card with CSS `@keyframes` feed-out and tear-off animation.
4. **Debounced Sync**: `useEffect` in `MemoryContext` detects data mutation → resets a 2000ms debounce timer.
5. **Remote Archiving**: Timer fires `POST /api/github/sync` → API route queries GitHub REST API for file SHA, base64-encodes payload, and commits `archive.json` plus `journals/YYYY-MM-DD.md`.
6. **Conflict Resolution**: If GitHub returns a SHA conflict (409), the route fetches remote state, performs a two-way union merge by slip `id`, and re-pushes.
7. **Window Unload Guard**: If the browser tab is closed while a sync is pending, a `beforeunload` listener invokes `fetch(..., { keepalive: true })` / `navigator.sendBeacon` to ensure the commit reaches GitHub.

PRD ref: `prd.md > Features and Behavior > 6. Direct GitHub Synchronization`.

## Stack
- **Framework**: Next.js 16.4.3 (App Router, Turbopack) + React 19 + TypeScript 5.
  - *Rationale*: Deterministic SSR hydration guards, file-based routing, and built-in serverless API route handlers without needing an external Express/Node backend.
  - *Doc*: [Next.js Documentation](https://nextjs.org/docs)
- **Styling**: Tailwind CSS + custom CSS `@keyframes`.
  - *Rationale*: Rapid utility styling with bespoke keyframes for physical receipt tear animations and serrated clip-paths.
  - *Doc*: [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- **Icons & Visuals**: Lucide React.
  - *Doc*: [Lucide React](https://lucide.dev)
- **Storage & State**: React Context (`MemoryContext`) + Browser Web Storage API (`localStorage`).
  - *Rationale*: True zero-latency architecture with zero external database dependencies.
- **Remote Archival**: GitHub REST API v3 (Octokit-compatible fetch).
  - *Rationale*: Direct user-to-GitHub synchronization; user retains 100% data custody.
  - *Doc*: [GitHub REST API Documentation](https://docs.github.com/en/rest)
- **Audio Engine**: Web Audio API (native browser).
  - *Rationale*: Zero asset overhead; generates subtle mechanical click and tear sounds dynamically via oscillators and white noise buffers.

## Where It Runs and How Someone Tries It
Runs entirely in the browser, verified locally on Node.js 18+.

```bash
# 1. Clone repository
git clone <repo-url>
cd build-with-AI-basics

# 2. Install dependencies
pnpm install

# 3. Launch local development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in the browser.

For GitHub Sync: Click the Settings icon in the header, input GitHub username, private repository name, and a GitHub Personal Access Token (PAT with `repo` or fine-grained `Contents: Read and Write` permissions). Click "Sync Now" to verify remote commit creation.

PRD ref: `prd.md > Screens and Layout > GitHub Sync Drawer`.

## Look and Feel
Carried forward from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`:
- **Canvas Base**: `#FAF7F2` warm oatmeal linen.
- **Card Base**: `#FFFFFF` washi paper with `#F4EFE6` aged edge shading.
- **Morandi Category Accents**:
  - Insight / Thinking: Deep Prussian Slate (`#3E5C76`)
  - Mood / Emotion: Warm Terracotta Ochre (`#D97A60`)
  - Work / Execution: Earth Bronze (`#8C6D58`)
  - Life / Spark: Sage Matcha (`#5E7A68`)
- **Typography**: Editorial Swiss Serif (`Playfair Display`, `Newsreader`) + monospace numerals (`JetBrains Mono`).
- **Tactile Elements**: SVG `clip-path` serrated receipt edge, washi tape texture pins, and smooth paper tear-off keyframe motion.

## Components

### `Header` (`src/components/layout/Header.tsx`)
Top bar navigation displaying Dayprint brand seal, current calendar date, slip counter, sync status dot, and buttons to open Weekly Digest modal, Search overlay, and GitHub Sync drawer.  
PRD ref: `prd.md > Screens and Layout > Header Dock`.

### `QuickInput` (`src/components/journal/QuickInput.tsx`)
Floating bottom dock supporting text input (up to 500 chars), Morandi category selector pills, image attachment (file picker/paste), character counter, and instant print submission button (`Cmd/Ctrl+Enter`).  
PRD ref: `prd.md > Features and Behavior > 1. Instant Micro-Slip Capture`.

### `ThermalReceipt` (`src/components/journal/ThermalReceipt.tsx`)
Tactile journal slip card with jagged serrated bottom edge, Morandi category indicator, timestamp, plain text/image content, link preview chip, and action menu (Pin / Delete).  
PRD ref: `prd.md > Features and Behavior > 2. Physical Thermal Receipt Animation & Audio`.

### `JournalCanvas` (`src/components/journal/JournalCanvas.tsx`)
Responsive masonry feed organizing slips chronologically with daily date headers, keyword filter matching, and category filtering.  
PRD ref: `prd.md > Features and Behavior > 4. Scrapbook Masonry Canvas & Filtering`.

### `WeeklyReviewModal` (`src/components/memory/WeeklyReviewModal.tsx`)
Centered modal overlay rendering the natural-week memory digest (Key Insights, Emotional Theme, Action Milestones) with inline CRUD editing and Markdown export capability.  
PRD ref: `prd.md > Features and Behavior > 5. Weekly Memory Digest & Management`.

### `GitHubSyncSettings` (`src/components/sync/GitHubSyncSettings.tsx`)
Sliding drawer managing GitHub credentials (stored exclusively in `localStorage['dayprint_sync_config']`), auto-sync toggle, manual trigger button, and sync health readout.  
PRD ref: `prd.md > Screens and Layout > GitHub Sync Drawer`.

### `MemoryContext` (`src/lib/memory-context.tsx`)
Unified state container providing reactive CRUD methods (`addSlip`, `deleteSlip`, `pinSlip`, `updateWeeklyMemory`), localStorage synchronization, and debounced GitHub sync dispatching.

### `/api/github/sync` (`src/app/api/github/sync/route.ts`)
Serverless Next.js API route accepting archive payload, resolving file SHAs, writing `archive.json` snapshot, generating daily Markdown files (`journals/YYYY-MM-DD.md`), and gracefully handling concurrent conflicts.

## Data Model

```typescript
export type TagCategory = 'insight' | 'mood' | 'work' | 'life';

export interface JournalSlip {
  id: string;              // Unique identifier (nanoid / timestamp)
  content: string;         // Plaintext content (max 500 chars)
  category: TagCategory;   // Morandi category
  timestamp: number;       // Unix timestamp in ms
  imageUrl?: string;       // Base64 data URI
  weather?: string;
  pinned?: boolean;
}

export interface WeeklyMemorySummary {
  weekId: string;          // ISO week format, e.g., "2026-W43"
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
├── public/                      # Static assets, branding, and icons
└── src/
    ├── app/
    │   ├── api/github/sync/     # Serverless GitHub sync API route
    │   │   └── route.ts
    │   ├── globals.css          # Tailwind base & tactile keyframe styles
    │   ├── layout.tsx           # Deterministic root layout
    │   └── page.tsx             # Main Dayprint canvas surface
    ├── components/
    │   ├── journal/             # ThermalReceipt, QuickInput, JournalCanvas
    │   ├── memory/              # WeeklyReviewModal & cognitive summaries
    │   ├── sync/                # GitHubSyncSettings drawer
    │   └── layout/              # Header & top navigation
    ├── lib/
    │   ├── memory-context.tsx   # Reactive context & state store
    │   └── github.ts            # GitHub REST API client & conflict resolver
    └── types/
        └── index.ts             # TypeScript definitions & data contracts
```

## External Services and Dependencies
- **GitHub REST API (`api.github.com`)**:
  - `GET /repos/{owner}/{repo}/contents/{path}`: Check existing file SHA and read remote archive.
  - `PUT /repos/{owner}/{repo}/contents/{path}`: Create or update `archive.json` and daily Markdown files.
  - Authentication: User-supplied Personal Access Token (PAT) sent via `Authorization: Bearer <PAT>` header.
  - Rate Limits: 5,000 requests/hour for authenticated users.
  - Cost: Free.

## Important Failure Modes
- **Offline / Network Interruption** → App functions with 100% normal capability using browser `localStorage`; sync marks status as "pending" and automatically recovers upon network restoration.
- **Invalid / Revoked GitHub Token** → Sync indicator displays amber warning; non-intrusive toast notification prompts user to update PAT; data remains strictly intact.
- **Concurrent Remote SHA Conflict** → Two-way union merge combines remote slips with local slips by unique `id` and re-commits the merged archive automatically.

## What Was Simplified and Why
- **GitHub as the Personal Cloud instead of Hosted Supabase/Firebase**: Eliminates server maintenance, subscription costs, and user authentication infrastructure while giving the user absolute custody of their raw Markdown data.
- **Client-Side Heuristic Cognitive Distillation instead of Mandatory LLM API**: Enables out-of-the-box operation for any user without demanding paid API keys, while keeping an extensible structure for future plug-and-play LLM models.
- **Base64 Inline Image Storage instead of S3/Cloud Storage**: Keeps the application completely self-contained without requiring third-party storage buckets for the POC.

## Decisions and Open Issues
- **Standard ISO Calendar Weeks for Digests**: Selected over rolling 7-day windows to align neatly with weekly work rhythms and GitHub commit folders.
- **Keepalive Sync via `beforeunload`**: Handled via `fetch(..., { keepalive: true })` ensuring in-flight saves complete even on abrupt tab closure.
- **Learner Uncertainty Clarified**: Addressed how the GitHub API handles initial commit versus updates — omission of `sha` parameter creates the file on first push, while subsequent updates require the retrieved SHA.
