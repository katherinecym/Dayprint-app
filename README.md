# Dayprint

> **Your life, in prints. Frictionless capture, living editorial scrapbook, and silent lifelong sovereignty.**

Dayprint is a **tactile living memory workspace and micro-journal** built for knowledge workers, independent creators, and deep thinkers. Engineered with a Local-First architecture, it transforms fleeting thoughts into authentic thermal receipt slips and an editorial scrapbook stream. Recent entries are distilled into weekly cognitive summaries and silently mirrored as clean Markdown files and JSON snapshots directly to the user's private GitHub repository, delivering 100% data sovereignty without external server dependencies.

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Run local development server
pnpm dev

# 3. Production build verification
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Devpost Learn Hackathon Specifications

This project strictly follows the **Devpost "Build With AI: Basics"** planning and engineering workflow:

- 🎯 **[Project Scope (Scope)](./scope.md)**: Unique kernel, target user, core loop, inspiration, learner rationale, and POC boundary.
- 📋 **[Product Requirements Document (PRD)](./prd.md)**: End-to-end user journey, screen architecture, functional behavior, states, and explicit product decisions.
- 🛠️ **[Technical Specification (Spec)](./spec.md)**: Plain-language architecture, data models, component mappings, failure modes, and background GitHub sync flow.
- 🏆 **[Devpost Submission Package](./docs/DEVPOST-SUBMISSION.md)**: Product story, technical challenges, and learning takeaways.
- 🎬 **[Demo Video Script](./docs/VIDEO-DEMO-SCRIPT.md)**: Concise demonstration script and audio narration guide.
- 📖 **[Extended Documentation & Architecture](./docs/)**: Comprehensive architectural specs, user manual, and design documentation.

---

## Core Features

1. **Tactile Thermal Slip & Mechanical Audio**: Realistic serrated tear-off animation powered by custom CSS `@keyframes` and Web Audio API synthesized mechanical printer clicks.
2. **Editorial Scrapbook Stream**: Morandi category palette (Insight, Mood, Work, Life), washi-tape aesthetics, and fluid responsive masonry layouts.
3. **Multi-Tier Cognitive Evolution (L0–L4)**: Ephemeral slips (L0) ➔ Daily clusters (L1) ➔ Weekly synthesis (L2) ➔ Horizon mindscapes (L3) ➔ Core north-star values (L4).
4. **Weekly Memory Digest & Management**: Natural-week cognitive distillation, visual category distribution, full inline CRUD editing, and one-click Markdown export.
5. **Local-First & Silent GitHub Archival**: Zero centralized database setup; instantaneous client-side persistence in browser `localStorage`, debounced background push to private GitHub repositories, and `beforeunload` keepalive safeguards upon tab close.

---

## License

MIT License. Open-source submission for Devpost Build With AI: Basics Hackathon.
