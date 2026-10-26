# Dayprint Master Product Guide & Video Demo Blueprint
> **Interactive HTML Version**: Available live at [http://localhost:3000/manual.html](http://localhost:3000/manual.html)  
> **Interactive Preview File**: [public/manual.html](file:///Users/katherine/Desktop/play&fun/build-with-AI-basics/public/manual.html)  
> **Version**: v2.4.0 (Build With AI Hackathon Release)  
> **Languages**: English (Default) / 中文 (Bilingual)  

---

## Quick Navigation / 快速导航
- [Part 1 (English): Complete User Manual & Feature Guide](#part-1-english-complete-user-manual--feature-guide)
  - [1. Data Sovereignty & Core Philosophy](#1-data-sovereignty--core-philosophy)
  - [2. Welcome Gateway & Demo Mode Sandbox](#2-welcome-gateway--demo-mode-sandbox)
  - [3. Tab 1: Daily Canvas & Today's Notes](#3-tab-1-daily-canvas--todays-notes)
  - [4. Tab 2: Cognitive Ledger](#4-tab-2-cognitive-ledger)
  - [5. Tab 3: Knowledge Graph](#5-tab-3-knowledge-graph)
  - [6. Daily Thermal Receipts & 5 Mood Washes](#6-daily-thermal-receipts--5-mood-washes)
  - [7. Specialized Studios & Utilities](#7-specialized-studios--utilities)
  - [8. Master Video Demo Screenplay & Voiceover Script](#8-master-video-demo-screenplay--voiceover-script)
- [Part 2 (中文): 完整功能使用指南与视频演示脚本](#part-2-中文-完整功能使用指南与视频演示脚本)

---

# Part 1 (English): Complete User Manual & Feature Guide

## 1. Data Sovereignty & Core Philosophy

Modern human thinking is deeply fractured across Slack, Jira, Notion, and phone memos. Even worse, entrusting intimate personal thoughts to centralized cloud providers risks vendor lock-in and privacy leakage.

Dayprint is built on three foundational pillars:
1. **100% Data Sovereignty**: Zero central databases, zero telemetry. All personal notes, receipts, and graph links are committed directly to your private GitHub repository as clean, standard Markdown. Compatible with local Obsidian vaults.
2. **Tactile Sensory Craftsmanship**: Rejecting cold glass interfaces in favor of warm Morandi paper fibers, mechanical typewriter audio feedback, dip-dye watercolor glow, and genuine jagged-edge thermal paper tears.
3. **Cognitive Evolution**: Knowledge progresses through an L0~L4 cognitive pyramid paired with a semantic wikilink topology.

---

## 2. Welcome Gateway & Demo Mode Sandbox

![Welcome Gateway](/manual-assets/00-welcome.png)

When first opening Dayprint without credentials, the **Welcome Gateway** modal appears automatically.

### 2.1 Two Operating Modes
- **Option A: Private GitHub Repository Connection (Production Mode)**
  - Enter your repository path (e.g. `username/my-vault`) and Personal Access Token (PAT).
  - The token is encrypted in browser LocalStorage only. Dayprint communicates directly with GitHub REST API—zero intermediary servers.
- **Option B: Instant Interactive Demo (Sandbox Mode)**
  - Click **"进入 Demo 体验模式" (Enter Demo Mode)**.
  - Instantly loads 136 realistic engineering and life notes dating back to August 1, 2026, under the fictional persona of Alex Reed (Systems Architect).
  - Explicit disclaimer: `⚠️ Demo 模式下无法存储用户信息与手账数据` (Demo mode does not persist personal user data).

### 2.2 Disconnecting GitHub
- Click the GitHub badge in the header or sidebar at any time.
- Click **"Disconnect"**: Clears local token and repository bindings immediately. Remains cleanly disconnected upon refresh.

---

## 3. Tab 1: Daily Canvas & Today's Notes

![Daily Canvas](/manual-assets/02-view-daily.png)

The primary thinking surface for immediate capture and temporal reflection.

### 3.1 Today's Notes Desk (TodayEditor)
- **Expanded by Default**: Ready for immediate input without an extra unfold click.
- **Independent Bilingual Editing**: Switch between `ZH` and `EN` tabs. If only one language is filled, the internal engine auto-translates the other side.
- **AI STAR Polish**: Type a raw note and click ✨ Polish. The AI extracts Situation, Task, Action, and Result (STAR) career brag points, stripping away emotional noise.
- **Weave Echo**: Automatically queries memories from 14~30 days ago sharing semantic affinity, sparking cross-temporal self-dialogue.
- **Smart Document Ingest**: Paste long meeting minutes or technical RFCs; AI parses and creates atomic cards in batch.
- **Morandi Pigment Types**: Idea (`#C97A63`), Learning (`#5B7B94`), Moment (`#C49A56`), Decision (`#7C6F93`), Plan (`#608066`), Collection (`#5A7D8F`).

### 3.2 Living Stream & Temporal Zoom
- **Temporal Zoom**: Day (daily sequence), Week (7-day grid), Month (high-level cadence).
- **Interactive Memory Cards**: Level badge, time tags, [[wikilink]] expansion, and inline link weaving.

### 3.3 Right Companion Panel (Context Panel)
- Today's chronological pulse.
- Reflection input box synced in real-time with today's receipt.
- **5-Color Daily Mood Wash**: Instant palette selection.
- **Annual Activity Heatmap**: Visual frequency matrix across the year.

---

## 4. Tab 2: Cognitive Ledger

![Cognitive Ledger](/manual-assets/03-view-memory-os.png)

**Positioning: The singular read-and-write Calibration Workbench in Dayprint.**

### 4.1 L0~L4 Cognitive Pyramid Hierarchy
- **L0 Raw Stream**: Unfiltered thoughts and casual daily notes.
- **L1 Events & Wins**: Milestones, key deliverables, and achievements.
- **L2 Habits & SOPs**: Reusable workflows, personal rhythms, and practice protocols.
- **L3 Mental Models**: Validated thinking heuristics (e.g. "The Archipelago Principle").
- **L4 First Principles & Core Beliefs**: Non-negotiable philosophical tenets.

### 4.2 Calibration Workbench Capabilities
- **Calibration Score Sorting**: Ranked by maintenance need (missing English +40, missing Chinese +40, missing topics +10, missing provenance +10, low confidence).
- **Visible Confidence Meter**: Explicit percentage color bar (≥85% Sage Green, ≥70% Amber, <70% Terracotta).
- **Bilingual Completeness Tag**: Displays `ZH ✅ / EN ⚠️` for instantaneous auditing.
- **Source Provenance Chain (`source_ids`)**: High-level principles display "Derived from N original notes". Click to expand and highlight the exact historical notes that birthed the insight.
- **AI Distill Engine**: Synthesizes higher-order models from recent low-level notes.
- **Obsidian Sync**: Exports standard YAML frontmatter for native Obsidian compatibility.

---

## 5. Tab 3: Knowledge Graph

![Knowledge Graph](/manual-assets/04-view-graph.png)

**Positioning: Horizontal relational network topology and emergent concept map (Read-only Analysis Desk).**

### 5.1 Force-Directed Physics Constellation
- **Physics Attraction Engine**: Dynamic spring forces pull semantically related cards into natural orbital clusters.
- **Auto-Link Compiler**: Click "编织潜在星轨" (Auto-Link Graph) to run local heuristics that detect latent causal and semantic links across the vault.

### 5.2 Topology Index Capsules (No Redundancy)
- Toggle top-right to **"拓扑索引 (Topology Index)"**.
- **Compact Capsule Layout**: 5~6 columns. **Explicitly eliminates redundant body copy**, showing only: Type + Level + Title + Connection Count (Links).
- **Ranked by Degree Centrality**: Highest-connected hub concepts float directly to the top.
- **Inspector Sync**: Clicking any capsule highlights the node in the canvas and opens the Node Inspector drawer.

---

## 6. Daily Thermal Receipts & 5 Mood Washes

![Daily Receipt](/manual-assets/05-modal-receipt.png)

Click **"生活存根 (Daily Receipt)"** to summon the physical thermal receipt carousel.

### 6.1 Tactile Life Stubs
- **Rich Historical Depth**: Demo mode includes 85 slips spanning from August 1, 2026, to today without date gaps.
- **Zero Empty Slips Guarantee**: Every single receipt date links to real canonical memories (`TOTAL RECORDED: 2 ITEMS`, `3 ITEMS`).
- **Authentic Jagged Teeth**: Realistic physical sawtooth tear edges at top and bottom.
- **Bilingual Daily Reflection**: Editorial contemplation box with custom typography.
- **Tactile Wax Stamp**: Stamped with a physical `ARCHIVED` wax seal.

### 6.2 The 5 Morandi Mood Washes
1. **Terracotta · Energized (`#C97A63`)**: High-drive action and breakthroughs.
2. **Amber · Inspired (`#C49A56`)**: Creative flow and epiphanies.
3. **Sage · Calm (`#608066`)**: Centered mindfulness and stillness.
4. **Fjord · Focused (`#5B7B94`)**: Sober rationality and deep focus.
5. **Twilight · Reflective (`#9A8BB8`)**: Midnight introspection and philosophical audits.

---

## 7. Specialized Studios & Utilities

| Studio / Tool | Purpose & Highlight |
| :--- | :--- |
| **Career Studio** | Gathers STAR brag achievements; generates executive promotion summaries and bilingual resume bullet points. |
| **Weekly Digest** | 7-day emotional cadence and cognitive output analysis. Local-timezone Monday~Sunday alignment. |
| **Constellation Walk** | Concentric planetary orbital walk mapping memories across circadian and historical orbits. |
| **OmniSearch (⌘K) & Archive** | Sub-millisecond bilingual fuzzy search and tree-based annual/monthly chronological archives. |
| **Language Toggle** | 100% strict English / Chinese switcher with zero residual Chinese leakage in English mode. |
| **Modal Dismiss System** | Ref-counted `useModalDismiss` ensuring Esc dismiss and zero background body scroll-bleed. |

---

## 8. Master Video Demo Screenplay & Voiceover Script

> **Target Duration**: 2 minutes 15 seconds to 2 minutes 25 seconds  
> **Resolution**: 1080p @ 60fps  
> **Master Voiceover**: Confident, articulate systems architect  

```
+------------------------------------------------------------------------------------------------------------------+
| 0:00 - 0:25   | Scene 1: Welcome Gateway — 100% Data Sovereignty via Private GitHub & Demo Mode                   |
| 0:25 - 0:50   | Scene 2: Tab 1 Daily Canvas — Today's Notes Default Expanded, AI STAR Polish & Temporal Zoom     |
| 0:50 - 1:15   | Scene 3: Daily Receipts — 85 Slips from Aug 1, 5 Mood Washes & Tactile Perforations             |
| 1:15 - 1:40   | Scene 4: Tab 2 Cognitive Ledger — L0-L4 Hierarchy, Calibration Workbench & Source Provenance     |
| 1:40 - 2:05   | Scene 5: Tab 3 Knowledge Graph — Force-Directed Constellations & Topology Index Capsules          |
| 2:05 - 2:25   | Scene 6: Career Studio & Closing — STAR Brag Sheet, 100% Bilingual & Eternal Ownership           |
+------------------------------------------------------------------------------------------------------------------+
```

### 🎬 Scene 1: Welcome Gateway & Data Sovereignty (0:00 – 0:25 | 25s)
- **Visual Actions**:
  1. Open Dayprint (`http://localhost:3000`). The Welcome Gateway modal displays.
  2. Hover over the Private GitHub Repo input and Personal Access Token fields.
  3. Click **"进入 Demo 体验模式" (Enter Demo Mode)**. Confetti bursts; the warm Morandi paper canvas reveals.
- **English Voiceover**:
  > *"Where does your authentic self actually live? Today, our lives are fractured across Slack threads, docs, and phone memos. Dayprint is the living sanctuary for your AI Digital Twin. Built on complete data sovereignty, it commits directly to your private GitHub repository as clean Markdown. For this walkthrough, let's enter instant Demo Mode preloaded with 136 living engineering and life memories."*
- **中文旁白**:
  > “你的真实自我在哪里安放？现代人的思考被撕裂在各种软件中。Dayprint 是你的 AI 数字分身记忆圣殿。基于绝对数据主权，所有记录直接沉淀到你自己的私有 GitHub 仓库。今天让我们进入即时 Demo 模式，体验 136 条涵盖工程与生活的全真记忆。”

### 🎬 Scene 2: Tab 1 Daily Canvas (0:25 – 0:50 | 25s)
- **Visual Actions**:
  1. Showcase the default expanded `TodayEditor` at top.
  2. Type: `"Async Actor Isolation Engine"` and brief content. Click **✨ AI Polish**.
  3. Watch the golden STAR container unfold (Situation, Task, Action, Result). Click Save.
  4. Toggle Temporal Zoom from Day to Week to Month.
- **English Voiceover**:
  > *"Tab 1 is the Daily Canvas. Today's Notes is expanded by default for zero-friction capture. Type a raw note and hit AI Polish: our engine instantly distills it into the STAR format—capturing Situation, Task, Action, and Result for career brag sheets. Weave Echo surfaces related thoughts from two weeks ago, turning fleeting moments into connected wisdom."*
- **中文旁白**:
  > “Tab 1 是每日画卷。今日速记台默认展开，随时捕捉灵感。输入随笔点击 AI 润色，系统立刻提炼出情境、任务、行动与结果的 STAR 战绩模型。回声编织更会自动唤醒两周前的相关思考，让灵感彼此呼应。”

### 🎬 Scene 3: Daily Receipts Gallery (0:50 – 1:15 | 25s)
- **Visual Actions**:
  1. Click **"生活存根 (Daily Receipt)"** in the sidebar. The tactile thermal receipt carousel opens.
  2. Smoothly swipe across August, September, and October.
  3. Highlight the 5 mood washes, jagged sawtooth edges, reflection text, and `ARCHIVED` wax stamp.
- **English Voiceover**:
  > *"Click Daily Receipt to summon our tactile life stubs. Featuring 85 authentic slips from August 1 to today, every date has real records with zero empty cards. Each day is dyed in one of five Morandi mood washes—from Terracotta Energized to Fjord Focused—complete with genuine paper tear edges, reflections, and tactile wax archive stamps."*
- **中文旁白**:
  > “点击每日小票唤起实体手账存根。内置从 8 月 1 日至今的 85 张完整小票，每张均对应真实记忆，零空卡。五大莫兰迪心情色彩洗色——从热情陶土红到澄澈冰海蓝，搭配逼真的撕裂齿纹、今日结语与火漆印章。”

### 🎬 Scene 4: Tab 2 Cognitive Ledger (1:15 – 1:40 | 25s)
- **Visual Actions**:
  1. Switch to **"认知档案 (Cognitive Ledger)"**.
  2. Highlight the L0~L4 hierarchy and default Calibration Score sorting.
  3. Hover over the Confidence bar (95%) and Bilingual tags (`ZH ✅ / EN ⚠️`).
  4. Click **"源自 2 条原始记录" (`source_ids`)** to expand provenance context.
- **English Voiceover**:
  > *"Tab 2 is the Cognitive Ledger—the single calibration workbench in Dayprint. It organizes mental assets into an L0 to L4 pyramid, from raw notes up to foundational beliefs. Cards are sorted by calibration need, featuring visible confidence rating meters, bilingual readiness indicators, and clickable source_ids provenance chains linking directly back to origin notes."*
- **中文旁白**:
  > “Tab 2 是认知中枢账本——也是全系统唯一的校准工作台。它将记忆整理为 L0 到 L4 的金字塔体系，直达底层信条。按待校准度降序排列，配备清晰的置信度色条、双语完整度指示，以及可反查原始日记的 source_ids 溯源链。”

### 🎬 Scene 5: Tab 3 Knowledge Graph (1:40 – 2:05 | 25s)
- **Visual Actions**:
  1. Switch to **"Knowledge Graph"** in the sidebar.
  2. Drag nodes in the force-directed canvas. Click **"编织潜在星轨" (Auto-Link)**.
  3. Toggle top-right to **"拓扑索引 (Topology Index)"**.
  4. Show compact capsules sorted by link count without redundant body text. Click a node to open the Inspector.
- **English Voiceover**:
  > *"Tab 3 is Knowledge Graph—the horizontal relational topology. Watch concepts self-assemble into constellations through physics spring forces, or click Auto-Link to weave latent causal relationships. Switch to Topology Index to inspect degree centrality through compact capsules ranked strictly by link count, without redundant body text."*
- **中文旁白**:
  > “Tab 3 是 Knowledge Graph——横向关系拓扑网络。概念节点通过引力力场自发聚拢为星团，点击自动编织即可发现隐藏因果连线。切换到拓扑索引视图，通过按连结数降序排列的紧凑胶囊快速检索枢纽概念，绝无冗余正文干扰。”

### 🎬 Scene 6: Career Studio & Closing (2:05 – 2:25 | 20s)
- **Visual Actions**:
  1. Open Career Studio: show STAR brag sheet and resume highlights.
  2. Click language switcher to show 100% pure English mode.
  3. Open GitHub settings: highlight disconnect and private repository sync.
- **English Voiceover**:
  > *"Finally, Career Studio turns your memory stream into structured STAR performance sheets and resume highlights. Toggle instantly between 100% pure English and Chinese. Your memories, your thoughts, your future AI digital twin—100% owned by you. Welcome to Dayprint."*
- **中文旁白**:
  > “最后，Career Studio 将沉淀的记忆一键转化为专业的 STAR 职场述职与简历亮点。支持中英文即时切换。你的记忆、你的心智、你未来的 AI 数字分身——100% 掌握在你自己手中。这就是 Dayprint。”

---

# Part 2 (中文): 完整功能使用指南与视频演示脚本

（详细中文各章节与上方英文一一对应，用户可直接在网页版 [http://localhost:3000/manual.html](http://localhost:3000/manual.html) 顶部右上角一键切换查看，并支持全屏缩放所有高精度截图。）
