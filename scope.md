---
doc: scope
status: approved
---

# Dayprint (今日印迹) — NextGen Personal Micro-Journal & Cognitive Memory Hub

A zero-friction, tactile micro-journal that turns ephemeral thoughts into thermal paper slips, automatically organizing daily life into an editorial scrapbook while silently archiving raw Markdown to the user's private GitHub repository.

## The Unique Kernel
The convergence of physical-digital tactile micro-journaling with zero cloud lock-in: instant thermal paper receipts that tear off with authentic tactile motion, auto-classified into an editorial scrapbook stream, and distilled into a 5-tier cognitive memory hierarchy (L0–L4) synced silently to the user's personal GitHub repository.

## Who It's For
Deep thinkers, creative writers, builders, and learners who suffer from "blank-page paralysis" and note-taking fatigue in heavyweight tools like Notion or Obsidian, yet worry about privacy leaks and data lock-in with closed commercial SaaS apps.

## The Core Loop
1. **Capture (秒级倾倒)**: Open Dayprint, press `Cmd+K` or type a quick thought/photo/link in the bottom bar, and press Enter.
2. **Tactile Print (实体仪式感)**: Hear the printer click and watch an authentic thermal slip with jagged serrated edges print and tear off into today's editorial canvas.
3. **Cognitive Distillation (记忆蒸馏)**: Watch slips automatically synthesize into daily timeline threads, weekly digests, and horizon-level mindscapes.
4. **Zero-Friction Peace of Mind (数据自主)**: Every slip and weekly review is auto-saved locally and mirrored seamlessly as clean, open Markdown to the user's private GitHub repository.

## Inspiration & Identity
- **Tactile & Editorial**: Washi tape, jagged thermal receipt edges, warm oatmeal canvas background (`#FAF7F2`), typewriter and Swiss serif typography (`Playfair Display`, `Newsreader`, `JetBrains Mono`).
- **Morandi Color Code**:
  - Insight / Thinking: Deep Prussian Slate (`#3E5C76`)
  - Mood / Emotion: Warm Terracotta Ochre (`#D97A60`)
  - Work / Execution: Earth Bronze (`#8C6D58`)
  - Life / Spark: Sage Matcha (`#5E7A68`)
- **Tone**: Quiet, tactile, reflective, craftsman-like.

## Why This Matters to the Learner
To reclaim the pure joy of daily journaling without organizational overhead, while ensuring 100% personal data sovereignty through Local-First architecture and GitHub markdown backup.

## What "Working" Looks Like
A user types a quick note, attaches an optional image, hits Enter, and immediately watches a realistic thermal slip animate down the screen with tactile paper sound, settling into a staggered masonry scrapbook canvas. Opening the "Weekly Review" synthesizes recent entries into high-level cognitive reflections, and checking their GitHub repository reveals an automatically committed `archive.json` and dated Markdown slips.

## The POC Boundary
- **In-Scope**:
  - Instant micro-slip capture with auto-classification (Insight, Mood, Work, Life).
  - Tactile thermal receipt rendering with jagged serrated tear-off animations.
  - Editorial scrapbook canvas with masonry layout and Morandi tag filtering.
  - Weekly Memory Digest modal with AI memory synthesis and CRUD editing.
  - Local-first persistence (`localStorage`) + automatic debounced background sync to GitHub via personal access token (PAT).
  - Keepalive sync on browser tab close.
- **Later (Post-Hackathon)**:
  - Native Bluetooth thermal receipt printer hardware bridge (ESC/POS protocol).
  - Peer-to-peer end-to-end encrypted device sync (WebRTC / CRDTs).
  - Multi-agent cognitive dialogue querying personal memory graphs.

## Explicitly Cut
- **Centralized User Account / Auth Server**: Cut to uphold absolute privacy and zero-backend simplicity. The user owns their GitHub token and storage directly.
- **Heavy Rich-Text WYSIWYG Editor**: Cut to preserve frictionless sub-second micro-journaling and eliminate blank-page paralysis.
