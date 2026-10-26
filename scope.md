---
doc: scope
status: approved
---

# Dayprint (今日印迹)

A tactile micro-journal that turns quick thoughts into thermal paper slips, auto-organizing them into an editorial scrapbook while silently archiving raw Markdown to the user's private GitHub repository.

## The Unique Kernel
The physical-digital ritual: you type a thought, hear the printer click, and watch an authentic thermal slip with jagged serrated edges tear off and land on your scrapbook canvas — then it quietly archives itself as plain Markdown in your own GitHub repository. No cloud account. No lock-in. The tactile slip-tearing moment and zero-backend sovereignty are what make this distinctly personal rather than just another generic note-taking app.

## Who It's For
A knowledge worker, creative writer, builder, or deep thinker who journals in bursts throughout the day but suffers from "blank-page paralysis" and organizing fatigue in heavyweight tools like Notion or Obsidian, and doesn't trust closed SaaS platforms with intimate thoughts. Today, they scatter notes across sticky notes, random `.txt` files, or messaging draft boxes where thoughts get lost and never reviewed.

## The Core Loop
They open Dayprint (it loads instantly from local storage — zero login screen, zero lag). They press `Cmd+K` or click the dock, type a quick reflection, select an optional Morandi tag, and hit Enter. A thermal receipt animates down the screen with authentic paper-tear audio, settling onto the staggered masonry canvas. Later, they open the Weekly Digest to review their thoughts synthesized across L0–L4 cognitive dimensions. In the background, their private GitHub repository already has a clean, dated commit containing their Markdown slip and JSON snapshot.

## Inspiration & Identity
- **Feel**: Warm, quiet, tactile, craftsman-like. Like a Japanese stationery shop crossed with a developer's terminal.
- **Aesthetic References**: Thermal paper receipts, washi tape strips, hand-bound notebooks, editorial magazines.
- **Morandi Palette**: Warm oatmeal linen canvas (`#FAF7F2`), Prussian Slate (`#3E5C76` for Insight), Terracotta Ochre (`#D97A60` for Mood), Earth Bronze (`#8C6D58` for Work), and Sage Matcha (`#5E7A68` for Life).
- **Typography**: Editorial Swiss serif (`Playfair Display`, `Newsreader`) paired with clean monospace numerals (`JetBrains Mono`).
- **Tone**: Understated, reflective, calm. No artificial gamification, no streak-shaming.

## Why This Matters to the Learner
To master building a true Local-First web application with AI coding agents: understanding how to keep user data 100% private in client storage, eliminating centralized database dependencies, and orchestrating silent background synchronization to user-owned storage (GitHub REST API) using clean, plan-first agentic discipline.

## What "Working" Looks Like
A user types a quick note, attaches an optional image, hits Enter, and immediately watches a realistic thermal receipt slide down the screen with mechanical paper sound, dropping naturally into a staggered masonry canvas. Opening the "Weekly Digest" modal synthesizes recent entries into high-level cognitive reflections (Insights, Shifts, Milestones) with CRUD controls. Checking their GitHub repository reveals an automatically committed `archive.json` and dated Markdown file (`journals/YYYY-MM-DD.md`) with zero manual effort.

## The POC Boundary
- **Instant Micro-Slip Capture**: Quick text input (up to 500 chars), Morandi tag categorization (Insight, Mood, Work, Life), and single image attachment (Base64).
- **Tactile Thermal Receipt Experience**: CSS `@keyframes` receipt feed-out and tear-off animation with Web Audio API mechanical sound synthesis.
- **Editorial Scrapbook Canvas**: Responsive masonry stream with date dividers, washi-tape pins, keyword search, and Morandi tag filtering.
- **Weekly Memory Digest Modal**: Heuristic multi-tier cognitive distillation of weekly slips with interactive CRUD editing and Markdown export.
- **Local-First & Silent Git Sync**: Instant browser `localStorage` persistence paired with debounced (2s) background push to GitHub REST API with `beforeunload` keepalive protection.

## Later
- Native Bluetooth thermal receipt printer hardware bridge (ESC/POS protocol).
- Peer-to-peer end-to-end encrypted device sync (WebRTC / CRDTs).
- Direct user LLM API key integration for deeper personalized memory chat.

## Explicitly Cut
- **Centralized User Account / Auth Server**: Cut to uphold absolute privacy and zero-backend simplicity. The user owns their GitHub token and storage directly.
- **Heavy Rich-Text WYSIWYG Editor**: Cut to preserve frictionless sub-second micro-journaling and eliminate blank-page paralysis.
- **Multi-Device Real-Time Sync Bus**: Cut because WebSocket / cloud sync servers violate the lightweight, zero-maintenance local-first scope of this POC.
