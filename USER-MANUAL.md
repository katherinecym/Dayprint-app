# Dayprint User Guide / 操作手册

> **Interactive HTML Version**: [http://localhost:3000/manual.html](http://localhost:3000/manual.html)  
> **Source File**: [public/manual.html](file:///Users/katherine/Desktop/play&fun/build-with-AI-basics/public/manual.html)  
> **Version**: v2.4.0 Release  
> **Languages**: English (Default) / 中文  

---

## Contents / 目录
- [Part 1 (English): Dayprint User Guide](#part-1-english-dayprint-user-guide)
  - [1. Storage & Ownership](#1-storage--ownership)
  - [2. Welcome Gateway & Demo Mode](#2-welcome-gateway--demo-mode)
  - [3. Tab 1: Daily Canvas & Today's Notes](#3-tab-1-daily-canvas--todays-notes)
  - [4. Tab 2: Cognitive Ledger](#4-tab-2-cognitive-ledger)
  - [5. Tab 3: Knowledge Graph](#5-tab-3-knowledge-graph)
  - [6. Daily Thermal Receipts & Mood Washes](#6-daily-thermal-receipts--mood-washes)
  - [7. Helpful Tools](#7-helpful-tools)
- [Part 2 (中文): Dayprint 操作手册](#part-2-中文-dayprint-操作手册)
  - [1. 存储与归属](#1-存储与归属)
  - [2. 新手欢迎网关与演示模式](#2-新手欢迎网关与演示模式)
  - [3. Tab 1: 每日画卷与速记台](#3-tab-1-每日画卷与速记台)
  - [4. Tab 2: 认知中枢账本](#4-tab-2-认知中枢账本)
  - [5. Tab 3: Knowledge Graph](#5-tab-3-knowledge-graph-1)
  - [6. 每日复盘小票与心情洗色](#6-每日复盘小票与心情洗色)
  - [7. 实用辅助工具](#7-实用辅助工具)

---

# Part 1 (English): Dayprint User Guide

## 1. Storage & Ownership

Most of what we build and learn ends up scattered across Slack discussions, temporary text files, and phone memos. When you actually need them later—for a promotion review, an engineering retrospective, or recalling how you solved a tough bug three months ago—they are almost impossible to find.

Dayprint gives you a clean, quiet space to capture daily thoughts and syncs them straight to your private GitHub repository as plain Markdown files.

- **Direct GitHub Sync**: Communicates directly through official GitHub API endpoints without middleman servers.
- **Your Token Stays on Your Machine**: Your Personal Access Token (PAT) stays encrypted in your browser only.
- **Obsidian Compatibility**: Notes are plain Markdown files with standard frontmatter, so you can open your entire vault in Obsidian or VS Code anytime.
- **Warm Paper Style**: Uses gentle paper background colors, thermal receipt edges, and soft typing sounds that feel comfortable for daily writing.

---

## 2. Welcome Gateway & Demo Mode

When opening Dayprint for the first time without configured credentials, the Welcome Gateway appears.

### 2.1 Two Available Modes
- **Option A: Private GitHub Repository (Saving Your Notes)**
  - Enter your repository path (such as `username/my-vault`) and a GitHub Personal Access Token with repository scope.
  - Every note you save is committed straight to your GitHub account with a verified revision history.
  - The Disconnect button cleanly purges tokens from local storage. Refreshing the browser keeps the connection disconnected without auto-filling mock credentials.
- **Option B: Interactive Demo Sandbox**
  - Click "Enter Demo Mode" to load 136 realistic engineering and life notes dating back to August 1, 2026.
  - A clear banner states: `[Demo Notice: Personal data is not saved in demo mode]`.
  - Built with a fictional tech persona (Alex Reed, Systems Architect) so you can test features without exposing personal data.

---

## 3. Tab 1: Daily Canvas & Today's Notes

The primary thinking surface for immediate capture and chronological review.

### 3.1 Today's Notes Desk (TodayEditor)
- **Ready to Type Immediately**: Opens expanded by default so you can start writing without unfolding.
- **Separate Bilingual Tabs**: Switch between `ZH` and `EN` tabs. Neither side overwrites the other. If only one language is filled, the built-in translation engine auto-populates the other side.
- **AI STAR Polish**: Type raw thoughts and click Polish. The engine structures them into Situation, Task, Action, and Result (STAR) bullet points, ideal for work reviews.
- **Weave Echo**: Detects and surfaces notes from 2 to 4 weeks ago that share topic affinity, helping you connect past ideas with current work.
- **Smart Document Ingestion**: Paste long meeting minutes or technical specs; the parser cuts them into atomic cards in batch.
- **Color-Coded Types**: Idea (Terracotta), Learning (Fjord), Moment (Amber), Decision (Twilight), Plan (Sage), Collection (Deep Blue).

### 3.2 Timeline Zoom
- **Zoom Levels**: Toggle between Day (daily sequence), Week (7-day grid), and Month (high-level view).
- **Interactive Cards**: Shows type badges, note stages (L0~L4), and connected [[wikilink]] relationships.

### 3.3 Right Companion Panel (Context Panel)
- Today's timeline stream.
- An evening reflection field that syncs in real time with today's thermal receipt.
- **5-Color Daily Mood Wash**: Instant selection for your daily emotional tone.
- **Annual Activity Heatmap**: Displays your recording activity across the year.

---

## 4. Tab 2: Cognitive Ledger

**Positioning: The place where you refine and organize your thinking.**

### 4.1 From Raw Scratchpads to Principles (L0~L4)
- **L0 Raw Notes**: Unfiltered thoughts and quick observations written in the moment.
- **L1 Key Wins**: Milestones, finished projects, and measurable achievements.
- **L2 Workflows & Habits**: Proven debugging checklists and routines that work.
- **L3 Thinking Models**: Good rules of thumb for making hard architecture or product choices.
- **L4 Core Principles**: Non-negotiable principles you live and work by.

### 4.2 Key Features
- **Sorted by Need**: Cards that need translations or missing tags float to the top.
- **Visible Confidence Meter**: Explicit percentage color bar (85% and above green, 70% amber, below 70% red).
- **Bilingual Readiness Tags**: Displays clean indicators such as `ZH Ready · EN Pending`.
- **Source Links Back to Original Notes (`source_ids`)**: High-level principles display "Derived from N notes". Click to jump straight back to the original daily entry where the idea first started, so every rule is grounded in real experience.
- **AI Distill Tool**: Synthesizes higher-order principles from recent notes upon review.
- **Obsidian Sync**: Exports standard YAML frontmatter for native Obsidian compatibility.

---

## 5. Tab 3: Knowledge Graph

**Positioning: Connecting your notes together.**

### 5.1 Interactive Graph Canvas
- **Visual Connections**: Related notes cluster together on the screen.
- **Auto-Link Compiler**: Click "Auto-Link Graph" to scan your notes and find connections you might have missed between cards discussing similar topics.
- **Stage Colors**: Every node reflects its note stage (L0 to L4) with Morandi pigment accents.

### 5.2 Topology Index (Most Connected Topics)
- Toggle top-right to **"Topology Index"**.
- **Clean Overview**: 5 to 6 columns. Strips out long body copy, displaying only: Type + Level + Title + Connection Count (Links).
- **Most Connected at the Top**: Topics with the most links float directly to the top.
- **Canvas Sync**: Clicking any topic highlights it in the visual map and opens the Inspector drawer.

---

## 6. Daily Thermal Receipts & Mood Washes

Click **"Life Stubs"** in the sidebar or companion panel to summon the thermal receipt carousel.

### 6.1 Tactile Life Stubs
- **Continuous History**: Demo mode includes 85 continuous daily slips spanning from August 1, 2026, to today without date gaps.
- **Zero Empty Slips**: Every single receipt date links to real notes in your vault (`TOTAL RECORDED: 2 ITEMS`, `3 ITEMS`).
- **Torn-Paper Edges**: Realistic physical sawtooth tear edges at top and bottom.
- **Bilingual Daily Reflection**: Dedicated box for your daily evening reflection.
- **Wax Stamp**: Stamped with a physical-style `ARCHIVED` seal.

### 6.2 The 5 Watercolor Mood Washes
1. **Terracotta · Energized (`#C97A63`)**: High-drive action and breakthroughs.
2. **Amber · Inspired (`#C49A56`)**: Creative flow and epiphanies.
3. **Sage · Calm (`#608066`)**: Centered mindfulness and stillness.
4. **Fjord · Focused (`#5B7B94`)**: Sober rationality and deep focus.
5. **Twilight · Reflective (`#7C6F93`)**: Midnight introspection and thoughtful audits.

---

## 7. Helpful Tools

- **Career Studio**: Gathers key wins and project highlights into ready-to-use bullet points for your resume and performance reviews.
- **Weekly Digest**: Summarizes how your week went, what you learned, and how your mood shifted from Monday through Sunday in your local timezone.
- **Constellation Walk**: Concentric planetary orbital walk mapping memories across circadian and historical cycles.
- **Search (Command-K) & Archive**: Sub-millisecond bilingual search and tree-based annual/monthly chronological archives.
- **Language Toggle**: Strict English / Chinese switcher with zero residual Chinese leakage in English mode.
- **Modal Dismiss System**: Esc dismiss and zero background body scroll-bleed.

---

# Part 2 (中文): Dayprint 操作手册

## 1. 存储与归属

在日常开发和生活中，很多有价值的思考容易散落在各个聊天群、临时文档和手机备忘录里。等到写晋升述职、做技术复盘，或者想查几个月前解决某个问题的思路时，往往很难把这些零散的记忆拼凑完整。

Dayprint 给你一个安静、干净的书写空间，直接把笔记同步到你自己的私有 GitHub 仓库，存成最普通的 Markdown 纯文本文件，随时可用任何编辑器打开。

- **直接同步到 GitHub 仓库**：纯客户端直接连接 GitHub 官方接口，没有中间商的服务器。
- **密钥只留在你自己的设备上**：你的个人访问令牌（PAT）只加密存放在本地浏览器中，绝不上传到任何第三方平台。
- **Obsidian 原生兼容**：所有笔记均使用通用 Markdown 格式与标准前置信息，随时可以用 Obsidian、VS Code 或任何文本编辑器打开。
- **舒适的纸张视觉**：采用护眼温润的莫兰迪色系（陶土红、冰海蓝、琥珀蜜、苍青绿、暮山紫），搭配带有撕裂齿纹的小票与轻快的打字音效。

---

## 2. 新手欢迎网关与演示模式

初次打开 Dayprint 且未配置凭据时，系统会自动弹出欢迎网关。

### 2.1 两种可用模式
- **选项 A：配置私有 GitHub 仓库（保存自己的笔记）**
  - 输入你的 GitHub 仓库路径（如 `username/my-vault`）和具备仓库权限的个人访问令牌（PAT）。
  - 每次保存笔记时，都会直接提交到你的 GitHub 仓库，留下清晰的修改记录。
  - 点击“断开连接”可立即清除本地保存的凭据。刷新页面后保持断开状态，绝无多余模拟账号残留。
- **选项 B：交互式演示模式（体验全部功能）**
  - 点击“进入 Demo 体验模式”，立即载入自 2026 年 8 月 1 日起的 136 条真实工程手账与 85 张每日小票。
  - 界面明确提示：`[演示说明：演示模式下不会保存用户个人数据]`。
  - 完全基于虚构工程师人设（Alex Reed）展开，避免任何真实个人隐私暴露。

---

## 3. Tab 1: 每日画卷与速记台

日常记录的主工作台，兼顾即时输入与时间线回溯。

### 3.1 今日速记台 (TodayEditor)
- **打开即写**：打开主页时速记框默认保持展开状态，无需额外点击。
- **中英双语独立编辑**：支持在 `ZH` 与 `EN` 两个选项卡间独立录入，互不覆盖。若仅填写单侧，内置翻译引擎会自动补齐另一侧。
- **AI STAR 润色**：输入日常随笔后点击 ✨ 润色，AI 会自动帮你把口语化碎记梳理为情境（Situation）、任务（Task）、行动（Action）与结果（Result）的 STAR 战绩格式，方便写周报和述职。
- **回声编织 (Weave Echo)**：自动检索两到四周前记录的相关思考，提醒你过去的感悟，形成跨时间的自我对话。
- **智能文档提取**：支持粘贴整篇会议纪要或技术文档，自动切分为独立的知识卡片群。
- **分类标签**：想法（陶土红）、学习（冰海蓝）、瞬刻（琥珀蜜）、决策（暮山紫）、规划（苍青绿）、藏品（深海蓝）。

### 3.2 时间缩放
- **时间视图切换**：提供日（Day）、周（Week）、月（Month）三级缩放，既能细看单日流向，也能全景纵览整月节奏。
- **交互卡片**：展示类型标签、阶段徽标，并支持点击展开 [[wikilink]] 关联。

### 3.3 右侧伴随面板 (Context Panel)
- 当天时间线脉络。
- 即时小票结语编辑区，与当天的热敏小票实时双向同步。
- **5 种心情色彩洗色**：一键点选当天情绪水彩。
- **年度记录热力图**：直观展示全年的记录频次分布。

---

## 4. Tab 2: 认知中枢账本

**定位：整理和打磨核心认知的地方。**

### 4.1 从闪念随笔到核心做事原则 (L0 ~ L4)
- **L0 随笔**：未加工的日常感触与临时闪念。
- **L1 成果**：关键交付、技术突破与里程碑事件。
- **L2 工作流与习惯**：反复验证过的一套好用的做事步骤与排错清单。
- **L3 思维模型**：遇到复杂选择时帮你想明白的参考思路。
- **L4 核心原则**：你长期坚持的做事做人信条。

### 4.2 核心功能
- **按需要完善的程度排序**：需要修改文案、补充双语翻译或缺少来源的卡片会自动浮到最前面。
- **置信度色条**：卡片上直观显示置信度打分（85% 及以上绿色，70% 琥珀色，70% 以下红色）。
- **双语就绪状态**：显示纯文字状态标签（如 `中文已就绪 · 英文待补全`）。
- **点击来源反查原始日记 (`source_ids`)**：每一条高阶原则都会明确标注“源自 N 条原始记录”。点击可直接展开对应日期的日记，确保每条原则都是自己踩坑沉淀出来的真实经验。
- **AI 提炼工具**：一键研读近期随想，提炼可供参考的总结原则。
- **Obsidian 兼容**：导出标准的 Markdown 格式与前置信息，原生兼容 Obsidian。

---

## 5. Tab 3: Knowledge Graph

**定位：把相关笔记连起来。**

### 5.1 可视化关系图
- **动态关系图**：相关的笔记会自动靠拢形成话题群。
- **自动连线功能**：点击“编织潜在星轨”，系统会自动扫描笔记内容，提示可能讨论同一主题的潜在连线。
- **阶段色彩**：不同阶段的笔记采用不同的颜色区分展示。

### 5.2 拓扑索引（被引用最多的核心话题）
- 右上角切换至“拓扑索引”视图。
- **紧凑清单排布**：采用 5 到 6 列紧凑布局，去除了冗长正文，只显示：类型 + 阶段 + 标题 + 连接数（Links）。
- **按连接数量从多到少排列**：将关联最紧密的核心话题直接排在最上方。
- **画布联动**：点击任一话题即可在右侧抽屉检视出入度连线，并在图谱中高亮定位。

---

## 6. 每日复盘小票与心情洗色

点击侧边栏或伴随面板的“生活存根”，唤起手账小票画廊。

### 6.1 真实存根体验
- **连续历史记录**：Demo 模式预置了自 2026 年 8 月 1 日至今的 85 张连续小票，每天都有内容，没有任何断层日期。
- **真实条目统计**：每个小票日期均对应真实的笔记卡片，TOTAL RECORDED 显示 2 ITEMS、3 ITEMS，绝无空卡。
- **锯齿撕裂边缘**：顶部和底部带有逼真的撕纸齿纹。
- **双语今日结语**：衬线体排版的诗意复盘框。
- **火漆印章**：盖有拟物的 `ARCHIVED` 归档印章。

### 6.2 五大莫兰迪心情水彩洗色
1. **陶土红 · 热情 (`#C97A63`)**：充满干劲与突破的高光之日。
2. **琥珀蜜 · 灵感 (`#C49A56`)**：灵感迸发、专注沉浸之日。
3. **苍青绿 · 平和 (`#608066`)**：松弛从容、内心安定之日。
4. **冰海蓝 · 澄澈 (`#5B7B94`)**：冷静专注、思路清晰之日。
5. **暮山紫 · 内省 (`#7C6F93`)**：深度复盘、内省沉淀之日。

---

## 7. 实用辅助工具

- **Career Studio (职场战绩库)**：汇总你平时沉淀的关键成果与解决的难题，一键生成用于简历和述职报告的量化战绩要点。
- **Weekly Digest (周报复盘)**：汇总 7 天的心情走势与关键收获。精准匹配本地周一到周日周期，复盘一周节奏。
- **Constellation Walk**：将记忆按时钟与历史周期映射到同心圆轨道上巡游。
- **全局搜索 (Command-K) 与时光归档**：按下 Command-K 输入关键词毫秒级找出过去的笔记，也可以按年份和月份树状回溯历史。
- **语言切换**：顶部一键切换中英文，英文模式下彻底杜绝中文残留。
- **弹窗防滚动穿透**：基于引用计数的弹窗系统，支持 Esc 关闭，弹窗开启时锁定底层背景滚动。
