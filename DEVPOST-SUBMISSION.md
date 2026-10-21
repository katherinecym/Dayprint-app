# Dayprint (今日印迹) — Devpost Hackathon 提交说明书 (Submission Package)

> **Hackathon:** [Build With AI: Basics (Devpost Learn)](https://learn-ai-basics.devpost.com/)  
> **Project Name:** Dayprint (今日印迹)  
> **Tagline:** Your life, in prints. A tactile, local-first micro-journal that turns ephemeral moments into thermal paper slips and distilled cognitive assets.  
> **Repository:** Public Git Repository with `scope.md`, `prd.md`, `spec.md`  

---

## 1. Devpost 提交表单标准填写内容 (Devpost Submission Form Content)

### 1.1 Project Overview (项目概览)
* **Title:** Dayprint (今日印迹)
* **Tagline (一句话介绍):**
  > A tactile, local-first micro-journal that turns fleeting thoughts into thermal slips, automatically organizing life into an editorial scrapbook while silently archiving Markdown to your private GitHub.
* **Try it out / Demo Link:** `http://localhost:3000` (Local Dev) / Vercel Live Preview Link
* **Repository Link:** Public GitHub repository link

---

### 1.2 Inspiration (灵感与起心动念)
In an era dominated by heavyweight productivity apps like Notion, Obsidian, and Roam, millions of thinkers and builders suffer from **"blank-page paralysis"** and **"note-taking fatigue"**. We open a blank page intending to write a quick reflection, only to be overwhelmed by databases, templates, and formatting decisions. Worse, proprietary cloud apps trap our intimate life reflections inside closed servers with recurring subscriptions and privacy risks.

We asked ourselves:  
*What if journaling felt as simple and rewarding as getting an espresso receipt at an old bookstore cafe?*  
*What if a digital note had the tactile warmth of torn paper, the sound of a typewriter, the colors of an editorial magazine, and the ironclad privacy of local-first Markdown in your own private GitHub?*

That is why we built **Dayprint**.

---

### 1.3 What it does (产品功能与用户旅程)
Dayprint is a zero-friction personal micro-journal and living memory workspace:

1. **Sub-Second Micro-Capture**: Press `⌘K` or type in the bottom dock. No titles required, no mandatory folders. Just capture a fleeting thought, milestone, or photo.
2. **Tactile Thermal Slip Ritual**: The moment you press `⌘+Enter`, Dayprint synthesizes a real-time mechanical typewriter audio effect and prints an authentic serrated-edge thermal paper receipt that tears off and drops into your daily scrapbook canvas.
3. **Editorial Scrapbook Stream**: Daily entries naturally layout into a dynamic, responsive masonry stream with tactile Morandi paper stocks (Warm Almond, Fjord Grid, Sunlit Kraft, Twilight Lavender, Sage Herbarium).
4. **Autonomous Cognitive Evolution (L0–L4)**: Dayprint automatically distills raw daily stream (L0) into key milestones (L1), recurring habits & SOPs (L2), mental models (L3), and core principles (L4).
5. **AI Accomplishment Polishing & STAR Extraction**: One click converts rough fragmented notes into professional accomplishment bullets with Situation, Task, Action, and Result (STAR) breakdowns.
6. **Weekly Reflection & Memory Maintenance Hub**: At the end of each week, Dayprint automatically synthesizes a structured weekly digest with full CRUD editing and one-click Markdown weekly report export.
7. **Local-First & Silent GitHub Archival**: 100% of data is stored locally in browser storage. Changes are debounced and silently synchronized as human-readable Markdown files and a clean `archive.json` to the user's private GitHub repository, backed by `keepalive` window-unload guarantees.

---

### 1.4 How we built it (技术实现与架构亮点)

Dayprint was built from the ground up as a modern, high-performance, local-first web application:
* **Core Framework**: Next.js 16.4 (App Router, Turbopack) + React 19 + TypeScript 5.
* **Aesthetic & Layout**: Tailwind CSS v4, custom Morandi physical paper textures, and responsive multi-column masonry with CSS subpixel anti-jitter guards (`transform-gpu backface-hidden`).
* **Micro-interactions & Audio**: Web Audio API programmatic mechanical typewriter keystroke synthesis (zero external audio asset latency) + Framer Motion spring physics.
* **Cognitive Engine & Multi-Model AI**: Multi-provider LLM gateway supporting Google Gemini 2.5/Flash, OpenAI, and Claude for autonomous STAR extraction and cognitive distillation.
* **Storage & GitHub REST Protocol**: LocalStorage with optimistic UI updates paired with background debounced commits via GitHub REST API v3 using Personal Access Tokens (PAT). Uses `fetch(..., { keepalive: true })` on `beforeunload` to prevent data loss on tab close.

---

### 1.5 How we used the Devpost Learn Skill Pack (技能包学习复盘)

The **Devpost Learn Skill Pack** (`challengepost/learn-ai-basics`) completely transformed our development process through a disciplined 6-stage lifecycle:

1. **`1-start`**: Established clear constraints: build a complete, cohesive proof-of-concept from a blank directory, prioritizing core problem-solution fit over feature bloat.
2. **`2-scope` (`scope.md`)**: Enforced radical pruning. We explicitly cut heavy cloud database servers and complex WYSIWYG editors, zeroing in on the "Tactile Thermal Slip + Local-First GitHub Sync" kernel.
3. **`3-prd` (`prd.md`)**: Defined the end-to-end user journey, deterministic SSR hydration protocols, and the 5-tier (L0-L4) cognitive memory hierarchy before writing a single line of component code.
4. **`4-spec` (`spec.md`)**: Locked in the data schema (`CanonicalMemory`, `DayprintArchive`), browser unload `keepalive` safeguards, and UI component hierarchy.
5. **`5-build`**: Guided iterative, test-verified implementation of the Next.js 16 app with Turbopack, maintaining documentation-code parity throughout.
6. **`6-ship`**: Validated production build (`pnpm build`), guaranteed zero hydration errors, and ensured the repository has all mandatory planning markdown artifacts.

---

### 1.6 Challenges we ran into (攻坚难点与工程解决方案)

* **Next.js 16 SSR Timezone & Hydration Mismatch**: Dynamic date formatters like `toLocaleDateString` render differently on Node.js servers versus user client browsers, triggering hydration errors. We solved this by implementing deterministic string-slice date utilities (`YYYY-MM-DD` and `HH:mm`) with `suppressHydrationWarning` guards.
* **Masonry Layout Jitter & Subpixel Font Blurring**: Applying CSS rotations to cards in dynamic masonry columns caused slight subpixel font rendering blur in WebKit/Blink. We applied `transform-gpu backface-hidden will-change-transform` and isolated height computations to ensure razor-sharp typography.
* **Browser Tab Close Data Loss**: Traditional web apps lose pending syncs when a user abruptly closes the tab. We engineered a dual-layer sync mechanism combining debounced background fetches with a `window.beforeunload` handler using `fetch(url, { keepalive: true })` and `sendBeacon`.

---

### 1.7 Accomplishments that we're proud of (自豪的成果)
* **Design Excellence**: Created an interface that feels genuinely warm, calm, and tactile rather than like sterile enterprise software.
* **Zero-Cloud Data Sovereignty**: Achieved full cloud-like backup benefits through user-owned GitHub repositories without maintaining any centralized user database.
* **High-Paced Engineering**: Took Dayprint from a raw concept in `scope.md` to a fully working, robust, test-passing product with multi-lingual support (English & Chinese) within the hackathon timeline.

---

### 1.8 What we learned (我们的心得)
Spec-driven AI development is exponentially faster and more reliable than ad-hoc prompting. By spending the first 20% of our effort rigorously pinning down `scope.md`, `prd.md`, and `spec.md`, our AI coding assistant maintained 100% architectural coherence, avoided hallucinated refactors, and produced clean, production-grade code on the first try.

---

### 1.9 What's next for Dayprint (未来展望)
* **Bluetooth Thermal Printer Output**: Direct ESC/POS printing to physical paper receipt printers (e.g., Cat Printer, PeriPage) via Web Bluetooth API.
* **Mobile PWA & Ambient Voice Capture**: Offline-capable mobile home screen icon with local voice transcription.
* **Interactive Celestial Knowledge Graph**: Deeper vector-based graph clustering visualizing the serendipitous connections between years of life notes.
