# Dayprint · Developer Handoff Guide

> **Single entry point for incoming contributors and engineering agents.**

Last Updated: 2026-10-25

---

## 1. Product Overview

Dayprint is a **local-first personal living memory sanctuary and cognitive workspace**. Users write ephemeral daily logs (L0 raw stream), which the system distills across cognitive tiers (L1 Facts → L2 Habits/SOPs → L3 Mental Models → L4 Core Values) and condenses into a tactile Daily Thermal Receipt.

Three distinct perspectives illuminate the same underlying data store:

| viewMode | View Name | Core Question Answered |
|---|---|---|
| `daily` | Editorial Scrapbook (T1) | "What did I write and experience today?" |
| `memory_os` | Cognitive Ledger (T2) | "How validated is this mental model, and where did it originate?" |
| `graph` | Knowledge Topology / Graph (T3) | "How do my career and life epiphanies interconnect?" |

**These three view modes serve intentional, distinct cognitive roles — do not merge their presentation components.**

---

## 2. Technical Architecture Facts

- **Framework**: Next.js 16.4 App Router + Turbopack + React 19 + TypeScript + Tailwind CSS v4.
- **Zero Hosted Server Database**: All primary state is persisted in the browser Web Storage API (`localStorage`), organized across 14 dedicated `dayprint_` keys:
  `memories`, `relationships`, `collections`, `settings`, `custom_positions`, `vault_index`, etc.
- **Remote Cloud Archival**: GitHub REST API v3 using user-supplied Personal Access Tokens (PAT). Background sync commits human-readable Markdown files and a consolidated `archive.json` directly to the user's private repository.
- **Reliability Safeguards**: Window `beforeunload` event handler dispatches in-flight state via `fetch(..., { keepalive: true })` and `navigator.sendBeacon` to prevent data loss on sudden browser exit.
- **Deterministic SSR Hydration**: Date formatting relies on deterministic string-slicing utilities with `suppressHydrationWarning` to eliminate server-client rendering discrepancies.
- **Audio Synthesizer Engine**: Programmatic mechanical typewriter clicks and serrated paper-tearing audio rendered dynamically via native Web Audio API oscillators and white noise buffers (zero external media downloads).

---

## 3. Directory Structure

- `src/app/`: Next.js App Router root layout, static routes, and serverless API handlers (`/api/github/sync`, `/api/memory/*`).
- `src/components/`:
  - `canvas/`: Editorial scrapbook masonry, progressive input dock (`TodayEditor`), and tactile cards (`MemoryCard`).
  - `memory-os/`: Five-tier cognitive ledger matrix and STAR achievement distiller.
  - `graph/`: Interactive force-directed knowledge constellation canvas.
  - `navigation/`: Lightweight header, sidebar configurations, and sync drawers.
- `src/lib/`: Unified memory context, GitHub API integration, audio synthesizer, and date helpers.
- `src/types/`: Strict TypeScript interfaces defining `CanonicalMemory`, `DayprintArchive`, and cognitive schemas.
