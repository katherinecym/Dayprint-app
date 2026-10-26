# Dayprint User Guide / 操作手册

> **Interactive HTML Version**: [http://localhost:3000/manual.html](http://localhost:3000/manual.html)  
> **Source File**: [public/manual.html](file:///Users/katherine/Desktop/play&fun/build-with-AI-basics/public/manual.html)  
> **Version**: v2.4.0 Release  
> **Languages**: English (Default) / 中文  

---

## Contents / 目录
- [Part 1 (English): Dayprint User Guide](#part-1-english-dayprint-user-guide)
  - [1. Data Ownership & Storage Architecture](#1-data-ownership--storage-architecture)
  - [2. Welcome Gateway & Demo Mode](#2-welcome-gateway--demo-mode)
  - [3. Tab 1: Daily Canvas & Today's Notes](#3-tab-1-daily-canvas--todays-notes)
  - [4. Tab 2: Cognitive Ledger](#4-tab-2-cognitive-ledger)
  - [5. Tab 3: Knowledge Graph](#5-tab-3-knowledge-graph)
  - [6. Daily Thermal Receipts & Mood Washes](#6-daily-thermal-receipts--mood-washes)
  - [7. Specialized Studios & Utilities](#7-specialized-studios--utilities)
- [Part 2 (中文): Dayprint 操作手册](#part-2-中文-dayprint-操作手册)
  - [1. 数据主权与存储机制](#1-数据主权与存储机制)
  - [2. 新手欢迎网关与演示模式](#2-新手欢迎网关与演示模式)
  - [3. Tab 1: 每日画卷与速记台](#3-tab-1-每日画卷与速记台)
  - [4. Tab 2: 认知中枢账本](#4-tab-2-认知中枢账本)
  - [5. Tab 3: Knowledge Graph](#5-tab-3-knowledge-graph-1)
  - [6. 每日复盘小票与心情洗色](#6-每日复盘小票与心情洗色)
  - [7. 专属工作台与实用工具](#7-专属工作台与实用工具)

---

# Part 1 (English): Dayprint User Guide

## 1. Data Ownership & Storage Architecture

Most of what we learn and build gets lost in everyday noise. Good engineering breakthroughs stay buried in old pull requests, quick architecture ideas vanish in Slack threads, and reading notes end up forgotten in random desktop scratchpads. When performance review season comes around or when you need to recall how you solved a tough bug three months ago, it is almost impossible to piece things back together.

Dayprint is a local-first notebook designed to keep your thinking organized, connected, and completely under your control. Every note, daily slip, and relationship compiles directly into your own private GitHub repository as standard, human-readable Markdown files.

- **Direct GitHub Sync**: Communicates directly through official GitHub REST API endpoints without intermediary servers.
- **Local Credential Storage**: Your Personal Access Token (PAT) stays encrypted in your browser's LocalStorage only.
- **Obsidian Compatibility**: Markdown files use standard YAML frontmatter, making your vault directly openable in Obsidian.
- **Tactile Paper Palette**: Built with warm Morandi tones (`#C97A63`, `#5B7B94`, `#C49A56`, `#608066`, `#7C6F93`), subtle noise textures, and gentle mechanical keystroke acoustics.

---

## 2. Welcome Gateway & Demo Mode

When opening Dayprint for the first time without configured credentials, the Welcome Gateway appears.

### 2.1 Two Available Modes
- **Option A: Private GitHub Repository (Production Mode)**
  - Enter your repository path (such as `username/my-vault`) and a GitHub Personal Access Token with repository scope.
  - Changes are committed directly to your repository with verifiable commit SHAs.
  - Disconnect button cleanly purges tokens from local storage. Refreshing the browser keeps the connection disconnected without auto-filling mock credentials.
- **Option B: Interactive Demo Sandbox**
  - Click "Enter Demo Mode" to load 136 realistic engineering and life notes dating back to August 1, 2026.
  - A clear banner states: `[Demo Notice: Personal data is not persisted in demo mode]`.
  - Built with a fictional tech persona (Alex Reed, Systems Architect) so you can test features without exposing personal data.

---

## 3. Tab 1: Daily Canvas & Today's Notes

The primary thinking surface for immediate capture and chronological review.

### 3.1 Today's Notes Desk (TodayEditor)
- **Default Expanded State**: Opens ready for input so you can start typing immediately without unfolding.
- **Independent Bilingual Editing**: Switch between `ZH` and `EN` tabs. Neither side overwrites the other. If only one language is filled, the built-in translation engine auto-populates the other side.
- **AI STAR Polish**: Type raw thoughts and click Polish. The engine structures them into Situation, Task, Action, and Result (STAR) points, ideal for performance reviews.
- **Weave Echo**: Detects and surfaces notes from 2 to 4 weeks ago that share topic affinity, helping you connect past ideas with current work.
- **Smart Document Ingestion**: Paste long meeting minutes or technical specs; the parser cuts them into atomic cards in batch.
- **Color-Coded Types**: Idea (Terracotta), Learning (Fjord), Moment (Amber), Decision (Twilight), Plan (Sage), Collection (Deep Blue).

### 3.2 Living Stream & Temporal Zoom
- **Temporal Zoom**: Toggle between Day (daily sequence), Week (7-day grid), and Month (high-level cadence).
- **Interactive Cards**: Shows type badges, cognitive levels (L0~L4), and expandable [[wikilink]] connections.

### 3.3 Right Companion Panel (Context Panel)
- Today's chronological stream.
- Reflection input box synced in real-time with today's thermal receipt.
- **5-Color Daily Mood Wash**: Instant selection for your daily emotional tone.
- **Annual Activity Heatmap**: Displays daily recording frequency across the year.

---

## 4. Tab 2: Cognitive Ledger

**Positioning: The primary read-and-write calibration workbench in Dayprint.**

### 4.1 L0~L4 Cognitive Pyramid Hierarchy
- **L0 Raw Stream**: Unfiltered thoughts and casual daily notes.
- **L1 Events & Wins**: Milestones, key deliverables, and achievements.
- **L2 Habits & SOPs**: Reusable workflows, personal rhythms, and practice protocols.
- **L3 Mental Models**: Validated thinking heuristics (such as the Archipelago Principle).
- **L4 First Principles & Core Beliefs**: Non-negotiable philosophical tenets.

### 4.2 Calibration Workbench Features
- **Calibration Need Sorting**: Ranked by maintenance need. Cards needing translations, missing tags, or missing provenance float to the top.
- **Visible Confidence Meter**: Explicit percentage color bar (85% and above Sage Green, 70% and above Amber, below 70% Terracotta).
- **Bilingual Readiness Tags**: Displays clean indicators such as `ZH Ready · EN Pending`.
- **Source Provenance Chain (`source_ids`)**: High-level principles display "Derived from N notes". Click to expand and highlight the exact historical notes where the insight was originally recorded.
- **AI Distill Engine**: Synthesizes higher-order principles from recent low-level notes upon review.
- **Obsidian Sync**: Exports standard YAML frontmatter for native Obsidian compatibility.

---

## 5. Tab 3: Knowledge Graph

**Positioning: Horizontal relational network topology and emergent concept map (Read-only Analysis Desk).**

### 5.1 Force-Directed Physics Constellation
- **Physics Attraction Engine**: Dynamic spring forces cluster semantically related notes into natural visual groups.
- **Auto-Link Compiler**: Click "Auto-Link Graph" to run local heuristics that detect latent causal and semantic links across your vault.
- **Level Color Coding**: Every node reflects its cognitive level (L0 to L4) with Morandi pigment accents.

### 5.2 Topology Index Capsules (No Redundancy)
- Toggle top-right to **"Topology Index"**.
- **Compact Capsule Layout**: 5 to 6 columns. Strips out long body copy, displaying only: Type + Level + Title + Connection Count (Links).
- **Ranked by Degree Centrality**: Nodes with the most links float directly to the top.
- **Inspector Sync**: Clicking any capsule highlights the node in the canvas and opens the Node Inspector drawer.

---

## 6. Daily Thermal Receipts & Mood Washes

Click **"Life Stubs"** in the sidebar or companion panel to summon the thermal receipt carousel.

### 6.1 Tactile Life Stubs
- **Continuous Historical Depth**: Demo mode includes 85 continuous slips spanning from August 1, 2026, to today without date gaps.
- **Zero Empty Slips**: Every single receipt date links to real canonical memories (`TOTAL RECORDED: 2 ITEMS`, `3 ITEMS`).
- **Authentic Jagged Teeth**: Realistic physical sawtooth tear edges at top and bottom.
- **Bilingual Daily Reflection**: Editorial contemplation box with custom typography.
- **Tactile Wax Stamp**: Stamped with a physical `ARCHIVED` wax seal.

### 6.2 The 5 Morandi Mood Washes
1. **Terracotta · Energized (`#C97A63`)**: High-drive action and breakthroughs.
2. **Amber · Inspired (`#C49A56`)**: Creative flow and epiphanies.
3. **Sage · Calm (`#608066`)**: Centered mindfulness and stillness.
4. **Fjord · Focused (`#5B7B94`)**: Sober rationality and deep focus.
5. **Twilight · Reflective (`#7C6F93`)**: Midnight introspection and philosophical audits.

---

## 7. Specialized Studios & Utilities

- **Career Studio**: Gathers STAR brag achievements; generates executive promotion summaries and bilingual resume bullet points.
- **Weekly Digest**: 7-day emotional cadence and cognitive output analysis. Aligned strictly to local-timezone Monday through Sunday.
- **Constellation Walk**: Concentric planetary orbital walk mapping memories across circadian and historical cycles.
- **OmniSearch (⌘K) & Archive**: Sub-millisecond bilingual fuzzy search and tree-based annual/monthly chronological archives.
- **Language Toggle**: 100% strict English / Chinese switcher with zero residual Chinese leakage in English mode.
- **Modal Dismiss System**: Ref-counted `useModalDismiss` ensuring Esc dismiss and zero background body scroll-bleed.

---

# Part 2 (中文): Dayprint 操作手册

## 1. 数据主权与存储机制

在日常开发和生活中，很多有价值的思考容易散落在 Slack 讨论、临时文本和备忘录里。等到写晋升述职、做技术选型复盘，或者想查几个月前解决某个 Bug 的思路时，往往很难拼凑完整。

Dayprint 采用本地优先（Local-First）设计，直接把笔记同步到你自己的私有 GitHub 仓库，存成最干净、随时可迁移的 Markdown 文件。

- **直连私有 GitHub 仓库**：纯客户端调用 GitHub 官方 REST API，没有第三方服务器中转。
- **本地密钥存储**：你的 Personal Access Token（PAT）仅加密存放在本地浏览器 LocalStorage 中。
- **Obsidian 原生兼容**：所有 Markdown 笔记包含标准 YAML 前置元数据，可直接用 Obsidian 打开整个仓库。
- **温润的纸张触感**：选用莫兰迪色系（陶土红、冰海蓝、琥珀蜜、苍青绿、暮山紫），辅以微质感噪点、撕裂小票与机械打字机音效。

---

## 2. 新手欢迎网关与演示模式

初次打开 Dayprint 且未配置凭据时，系统会自动唤起欢迎网关。

### 2.1 两种可用模式
- **选项 A：配置私有 GitHub 笔记仓库（正式模式）**
  - 输入你的 GitHub 仓库路径（如 `username/my-vault`）与具备仓库权限的个人访问令牌（PAT）。
  - 笔记在保存时会自动生成带有 SHA 校验的 Git 提交。
  - 点击“断开连接”可立即清除本地保存的凭据。刷新页面后保持断开状态，绝无多余模拟账号残留。
- **选项 B：即时体验 Demo 模式（沙盒环境）**
  - 点击“进入 Demo 体验模式”，立即载入自 2026 年 8 月 1 日起的 136 条真实工程手账与 85 张每日小票。
  - 界面明确标注：`[Demo 说明：演示模式下不会保存用户个人数据]`。
  - 基于虚构工程师（Alex Reed）展开，避免任何真实个人隐私暴露。

---

## 3. Tab 1: 每日画卷与速记台

日常记录的主工作台，兼顾即时输入与时间线回溯。

### 3.1 今日速记台 (TodayEditor)
- **默认展开状态**：打开即处于展开书写状态，无需额外点击展开。
- **中英双语独立编辑**：支持在 `ZH` 与 `EN` 两个选项卡间独立录入，互不覆盖。若仅填写单侧，内置翻译引擎会自动补齐另一侧。
- **AI STAR 润色**：输入日常随笔后点击 ✨ 润色，AI 会自动帮你把口语化碎记梳理为情境（Situation）、任务（Task）、行动（Action）与结果（Result）的 STAR 格式，便于工作复盘。
- **回声编织 (Weave Echo)**：自动检索两到四周前记录的相关思考，提醒你过去的感悟，形成跨时间的自我对话。
- **智能文档提取**：支持粘贴整篇会议纪要或技术文档，AI 自动将其切分为原子卡片群批量入库。
- **色彩与类型**：想法（陶土红）、学习（冰海蓝）、瞬刻（琥珀蜜）、决策（暮山紫）、规划（苍青绿）、藏品（深海蓝）。

### 3.2 时序画卷与缩放
- **时空缩放**：提供“日（Day）/ 周（Week）/ 月（Month）”三级缩放，既能细看单日流向，也能全景纵览整月节奏。
- **交互卡片**：展示类型标签、认知层级徽标，并支持展开 [[wikilink]] 关联。

### 3.3 右侧伴随面板 (Context Panel)
- 当日时间线脉络。
- 即时小票结语编辑区，与当天的热敏小票实时双向同步。
- **5 种心情色彩洗色**：一键点选当天情绪水彩。
- **年度记录热力图**：直观展示全年的记录频次分布。

---

## 4. Tab 2: 认知中枢账本

**定位：Dayprint 全系统唯一的读写校准工作台（Calibration Workbench）。**

### 4.1 认知金字塔分层 (L0 ~ L4)
- **L0 原始随笔**：未加工的日常感触与临时随笔。
- **L1 事件与战绩**：关键交付、技术突破与里程碑事件。
- **L2 习惯与流程**：可复用的工作流、调试清单与日常习惯。
- **L3 心智模型**：经过验证的思考模型（如群岛原则、第一性原理）。
- **L4 底层信念**：指导工作与生活的底层哲学准则。

### 4.2 校准工作台功能
- **待校准度排序**：按待办缺陷度从高到低排列（缺英文翻译、缺中文、无主题、无来源的卡片排在最前）。
- **置信度色条**：卡片上直观显示置信度百分比（85% 及以上苍青绿，70% 及以上琥珀蜜，70% 以下陶土红）。
- **双语就绪状态**：显示纯文字状态标签（如 `中文已就绪 · 英文待补全`）。
- **来源溯源反查链 (`source_ids`)**：高阶信条显式标注“源自 N 条原始记录”。点击可直接展开对应日期的日记，确保每条信条都言之有据。
- **AI 升维引擎**：一键研读低阶日记，提炼候选心智模型。
- **Obsidian 导出**：符合 Obsidian 官方标准 Frontmatter，一键同步。

---

## 5. Tab 3: Knowledge Graph

**定位：横向概念网络与拓扑结构分析台（只读分析台）。**

### 5.1 力导向动态画布
- **引力物理模拟**：概念节点根据语义关联与双向链接产生引力，自然聚拢为主题星团。
- **自动连线编译**：点击“编织潜在星轨”，本地算法自动扫描笔记，挖掘潜在的因果与关联关系。
- **层级色彩标识**：每个节点均按其认知层级（L0 到 L4）以莫兰迪色标出。

### 5.2 拓扑索引胶囊（无冗余正文）
- 右上角切换至“拓扑索引”视图。
- **紧凑胶囊排布**：采用 5 到 6 列紧凑布局，去除了正文，只显示：类型 + 层级 + 标题 + 连结数（Links）。
- **按连结度降序排列**：将关联最紧密的核心枢纽概念直接排在最上方。
- **检视联动**：点击任一胶囊即可在右侧抽屉检视出入度连线，并在画布中高亮定位。

---

## 6. 每日复盘小票与心情洗色

点击侧边栏或伴随面板的“生活存根”，唤起实体热敏纸小票轮播画廊。

### 6.1 真实存根体验
- **连续历史记录**：Demo 模式预置了自 2026 年 8 月 1 日至今的 85 张连续小票，没有任何断层日期。
- **零空卡保障**：每个小票日期均对应真实的日记卡片，TOTAL RECORDED 显示 2 ITEMS、3 ITEMS，绝无空卡。
- **撕裂锯齿边缘**：顶部和底部带有逼真的热敏纸撕口齿纹。
- **双语今日结语**：衬线体排版的诗意复盘框。
- **火漆印章**：印有拟物的 `ARCHIVED` 归档印章。

### 6.2 五大莫兰迪心情水彩洗色
1. **陶土红 · 热情 (`#C97A63`)**：充满干劲与突破的高光之日。
2. **琥珀蜜 · 灵感 (`#C49A56`)**：顿悟闪光、创造心流之日。
3. **苍青绿 · 平和 (`#608066`)**：松弛从容、内心安定之日。
4. **冰海蓝 · 澄澈 (`#5B7B94`)**：清醒理性、专注沉浸之日。
5. **暮山紫 · 内省 (`#7C6F93`)**：深度复盘、静水流深之日。

---

## 7. 专属工作台与实用工具

- **Career Studio (职场战绩库)**：汇总历次 AI 润色提炼的 STAR 战绩，一键推演生成中英文述职亮点与量化简历要点。
- **Weekly Digest (周报复盘)**：汇总 7 天的情绪节奏与关键认知产出，精准匹配本地周一至周日周期。
- **Constellation Walk**：将记忆按时钟与历史周期映射到同心圆轨道上巡游。
- **OmniSearch (⌘K) 与时光归档**：毫秒级中英文全文模糊检索，搭配按年份、月份树状折叠的历史归档抽屉。
- **语言切换**：顶部一键切换中英文，英文模式下彻底杜绝中文残留。
- **弹窗防滚动穿透**：基于引用计数的弹窗系统，支持 Esc 关闭，弹窗开启时锁定底层背景滚动。
