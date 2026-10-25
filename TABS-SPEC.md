# Dayprint 全 Tab 功能规格（逐面板拆解）

> 依据：`src/` 全量静态阅读（不是 PRD 转述）。凡标 **⚠️** 的，是「代码实际行为与界面文案/README 不一致」的地方，附文件:行号可复核。
> 生成日期：2026-10-25

---

## 0. 先说结论

**一共 15 个可交互面板**，分三层，行为模型完全不同：

| 层 | 数量 | 行为 | 是否改变 `viewMode` |
|---|---|---|---|
| 工作区 Tab | 3 | 互斥全屏切换 | ✅ 是（`daily` / `memory_os` / `graph`） |
| 工具弹层 | 4 | 叠加 modal，Esc/点背景关闭 | ❌ 否 |
| 系统弹层 | 8 | 叠加 modal，多为表单/检索 | ❌ 否 |

三条要点：

1. **「今日记录」实际不是"今日"**：日期过滤分支被短路，画布展示全部记忆（详见 §2.7 ⚠️1）。
2. **「跨天演进」在 UI 上走不通**：归并按钮只改了目标 ID，没切模式，保存仍新建一条（§2.3 ⚠️2）。
3. **有 696 行组件没有任何入口**：`ConstellationModal` 的 props 传了三处，没人调用（§11 ⚠️4）。

---

## 1. 全局壳层（决定所有 Tab 的前置状态）

| 区域 | 控件 | 具体行为 |
|---|---|---|
| 左栏顶部 | Logo + 「Dayprint Web」+ tagline | 点击 Logo 无动作（非导航） |
| 左栏中部 | 工作空间 3 项 | 每项右侧有 badge（记录/特质/图谱），选中态白底+陶土红图标 |
| 左栏中部 | 复盘与工具 4 项 | 只有 hover 变色（各自不同 accent 色），无选中态（因为是弹层不是 Tab） |
| 左栏底部 | 画布外观 3 选 1 | 米黄 `boogie-paper` / 暗黑 `obsidian-dark` / 极简白 `studio-light`，写 `data-theme` 到 `<html>` |
| 左栏底部 | 音效开关 | 机械键盘音（`playKeyClick`）+ 撕纸音（`playPaperRipSound`）+ 火漆印音，纯 Web Audio 合成，无音频文件 |
| 左栏底部 | 语言切换 | `中/EN` 单键切换，影响全部文案 + 卡片双语字段取哪一侧 |
| 左栏底部 | GitHub 同步卡 + 齿轮 | 未连接=黑底「连接 GitHub」；已连接=绿底显示仓库名；点击直接同步（不弹窗） |
| 顶栏左 | 面包屑 | 标题 + `/ 副标题`，随 `viewMode` 变（今日记录/认知档案/关系图谱） |
| 顶栏左 | 模式胶囊 | `✨演示版` / `🌱正式版`，下拉三项：切 Demo / 切正式（会二次确认是否清空）/ 载入官方评测数据 |
| 顶栏中 | 搜索框 | 显示 `⌘K`，点击或按 ⌘K 打开全局检索 |
| 顶栏右 | 主题循环按钮 | 三态循环（不是下拉），显示当前主题名 |
| 顶栏右 | GitHub 按钮组 | 左侧同步、右侧齿轮进设置；未连接时黑底 |
| 顶栏右 | 纯净画卷开关 | **只在 `daily` 出现**，折叠右侧伴随面板 |

**首屏守卫**：`localStorage` 无 `dayprint_onboarding_completed` 且未配置 GitHub → 强制弹欢迎向导。

**本地存储键**（共 11 个，全部在浏览器，无后端 DB）：
`dayprint_memories` `_relationships` `_collections` `_settings` `_receipts` `_custom_positions` `_custom_types` `_type_colors` `_app_mode` `_paper_pattern` `_onboarding_completed`

---

## 2. T1 · 今日记录（`viewMode = daily`）

三段式布局：**顶部磨砂控制带（sticky）+ 居中书写区（max-w-3xl）+ 全宽瀑布流**，右侧可选 320px 伴随面板。

### 2.1 顶部控制带（`BoogieMatrixCanvas`）

| 控件 | 细节 |
|---|---|
| 筛选胶囊「全部 (N)」 | N = 当前进入画布的记忆总数 |
| 类型胶囊 | **动态生成**：只显示 `count > 0` 的类型；未选中时左侧 3px 类型色条，选中时整块填色 + 白字 |
| 「仅关联」胶囊 | **条件出现**：只有存在任何关系边时才渲染；开启后只留 `connectedMemories.length > 0` 的卡片 |
| 排序下拉 | 4 项：最新时间 / 最早起源 / 最多连结 / 字母排序（中文按 `localeCompare`） |
| 洗牌按钮 | 切到 `serendipity`，用 `(id + seed)` 字符和做线性同余哈希 → 每次点都换一个稳定乱序 |
| 纸张下拉 | 点阵 / 方格 / 横线 / 纯白，写 `dayprint_paper_pattern`，重启保留 |

### 2.2 灵感签（`DailyMuseSlip`）

- **5 个 prompt 包**：决策第一性（长期复利/第一性原理）、生活微光（感官/治愈）、认知反转（挑战偏见）、未来信件（十年后回望）、深度追问（个性化）。
- **按时段自动选包**：05–12 晨间意图→决策包；12–18 午后聚焦→认知反转；其余夜间沉淀→生活微光。
- 「换一签」：循环切下一条，配撕纸音 + 140ms 淡出。
- 「以此作答」：把 prompt 原文塞进记录台的**标题输入框**（不是正文），并自动展开记录台。
- ⚠️ `handleAiGenerate`（第 188 行）已写好但**没有任何按钮绑定**，所以"深度追问"包永远只有 4 条静态 prompt，不会真的调 AI。

### 2.3 记录台（`TodayEditor`）—— 双态组件

**折叠态**：一行灰字「随手记下此刻的想法…」+ `↵` 提示，点击展开。
**展开态**（有草稿时强制展开）：

| 区块 | 功能 |
|---|---|
| 头部 | 日期选择器（改 `selectedDate`）+ 时间选择器（默认当前 HH:mm）+ 「now」重置 + 收起按钮（有草稿会 confirm） |
| 补记横幅 | 当 `selectedDate ≠ 今天` 时出现琥珀色条：「正在补记 X 的回忆碎片（将自动同步至当日生活存根）」+ 一键切回今天 |
| 状态行 | 绿点「流式即时记录 · AI 自动感知提炼」+ 琥珀按钮「萃取长笔记/文档」（打开文档萃取弹层） |
| 语言药丸 | `ZH ⇄ EN`，另一侧有内容时亮绿点（提示"那边已经写过了"） |
| 智能归并横幅 | 输入 ≥2 字且模糊命中已有记忆（标题互含 / 命中 topic / 分词命中）时出现：「AI 识别到与已有记忆相关：「X」」+ 按钮「⇄ 自动演进归并」/ 已选时变「分化为新记忆」 |
| 标题输入 | 单行，虚线底边 |
| 正文输入 | 3 行自适应，**⌘/Ctrl+Enter 直接保存**；`onPaste` 拦截剪贴板图片 → 自动压缩成 JPEG 0.8 / 最长边 1200px |
| 认知快车道 | 正文以 `原则:` `心智:` `记住:` `偏好:` `SOP:`（或英文 `principle:` `mental:` `remember:`）开头 → 自动判定 L4/L3/L2 + 自动补 topic + 顶部蓝条提示「完整保存至今日日志 (Obsidian 层)，并已同步提取为「底层信念」」 |
| AI 述职润色 | 调 `/api/memory/polish` → 覆盖标题+正文（改成述职句式）、类型强制切 `achievement`、topics 回填、返回 STAR 三段卡；有「恢复原始随笔」撤销 |
| 图片 | 上传或粘贴，缩略图 + 「拍立得相纸已就绪」+ 移除 |
| STAR 结果卡 | S·挑战与痛点 / A·核心攻坚行动 / R·交付收益与影响，三列 |
| 时空回响条 | 随机抽一条 ≥7 天的旧记忆当「伏笔：《标题》」，点「编织因果连线」→ 保存时自动建一条 `semantic_similarity` 关系 |
| 类型胶囊 | 6 个内置 + 自定义「新增类型」内联输入（Enter 确认 / Esc 取消），未选中显示左侧色条 |
| 类型色彩 | 调色盘 10 个莫兰迪颜料，**改的是该类型全局颜色**（写 `dayprint_type_colors`），所有同类型卡片立刻变色 |
| 标签 | 逗号/空格分隔 |
| 底栏 | `⌘ + Enter` 提示 + 保存按钮（空内容时灰禁）；保存成功后按钮变蓝显示「已保存」2 秒，折叠态复位 |

**保存写入规则**：
- 时间戳 = `${selectedDate}T${customTime}:00+08:00`（**硬编码 +08:00**，不看系统时区）。
- 标题兜底：正文前 36 字 → 再兜底「今日碎片 / Today's Fragment」。
- topics 兜底 `["today"]`；认知快车道命中且类型仍是 `moment` → 自动改 `learning`。
- 只填一种语言 → 后台调 `/api/translate` 自动补齐另一侧（不阻塞 UI）。

### 2.4 瀑布流（记忆卡片）

- **列数**：1 / 2 / 3 / 4 / 5 列（sm / md / xl / 2xl 断点）。
- **纸张质感**：按 type 分配 7 套纸色（暖杏和纸/冰海方格/琥珀牛皮/暮山紫笺/鼠尾草/焦糖/烟灰石青）+ 顶部和纸胶带（clip-path 梯形、左右交替倾斜）+ 卡片本身 -0.8°~0.8° 随机微倾。
- **卡片上的 5 类标记**：
  1. 类型徽章（填色）
  2. `L0–L4 · 简称` 认知层级（带 tooltip 解释）
  3. `STAR` 金色章（仅 `memory.star` 存在）
  4. `🌱 N 次演进`（`timeline_logs.length > 1`）
  5. `🔗 N 连结`
- **hover 联动**：悬停某卡 → 与它相连的卡片套蓝环、被悬停的关联目标套金环、**其余全部降到 35% 透明度**。
- **关系节点**：卡内最多 3 个 `[[标题]]` 胶囊，点击跳转（`stopPropagation`），超出显示 `+N`；无关系时 hover 才浮出「+ 连结节点」。
- **图片**：白边 + 底部留白 + -0.8° 旋转的拍立得相框，hover 转正。
- **空状态 3 种**：筛选无结果（带「清除筛选」）/ 正式版空白（带「载入 Hackathon 评测演示数据」）/ Demo 空（带「载入官方演示数据」）。

### 2.5 右栏伴随面板（`ContextPanel`）

| 模块 | 具体能力 |
|---|---|
| 今日生活存根 | 5 色心情水彩（陶土红·热情 / 琥珀蜜·灵感 / 苍青绿·平和 / 冰海蓝·澄澈 / 暮山紫·内省），选中即写 `receipt.mood`；下方实时显示当前心情 + 描述 + 「• 浸染存根底色」 |
| 今日复盘 | textarea **每敲一个字就写一次** `receipt.custom_reflection`（无防抖），右侧闪「已同步存根」；这段字会印到存根底部 |
| 三个跳转按钮 | 查阅/导出今日存根（带 confetti）、周度复盘与维护、履历与成果库 |
| 今日时间流 | 按 `selectedDate` 过滤 + 时间倒序；每条显示时间徽章、演进次数、类型 chip、标题、正文 2 行、缩略图；点击开卡片详情 |
| 清空今日 | 垃圾桶图标 → confirm → 批量删当天全部记忆 |
| 记忆热力图 | 16 周 × 7 天 GitHub 风格；4 档绿色浓度（1 / 2 / ≥3 条）；连续记录天数火焰徽章（从今天倒推，今天没记则从昨天算）；月份轴；点击任意格子 → 切换 `selectedDate`；未来日期不可点 |

### 2.6 数据行为

新增 → `addMemory` 头部插入（最新在前）+ 自动补翻译；删除 → 同时清掉相关关系边；`selectedDate` 是**全局单例**，热力图/存根/时间流/记录台四处共享。

### 2.7 ⚠️ 实际行为 vs 命名

1. **不做日期过滤**：`MemoryCanvas.tsx:38-39`，`temporalLevel === "day"` 直接 `return true`；而 `temporalLevel` 默认 `"day"` 且 `setTemporalLevel` **没有任何 UI 调用**（全仓仅 context 定义处出现）。→ 画布永远显示**全部记忆**，`selectedDate` 只影响"新记录写哪天 + 右栏三块"。
2. **关键词过滤是死代码**：`MemoryCanvas.tsx:22` 读全局 `searchQuery`，但 `setSearchQuery` 全仓无 UI 调用（OmniSearch/周报都用各自的局部 state）。
3. **归并不可达**：`TodayEditor.tsx:341` 要求 `editorMode === "append"`，而 `setEditorMode` 从未被调用（第 32 行定义后无人使用）。点「自动演进归并」只设了 `targetMemoryId`，保存时仍走 create 分支 → **新建一条独立记忆**，但横幅文案写的是"保存时将作为演进日志沉淀入库（累计第 N 次演进）"。
4. **默认语言**：`memory-context.tsx:125` 初值 `"en"`，而 `DEFAULT_SETTINGS.language` 是 `"zh"` → 首次进入是英文界面。

---

## 3. T2 · 认知档案（`viewMode = memory_os`）

**定位**：把 L0 原始日记和 L1–L4 长期特质**物理分离**的白盒账本。整页纵向滚动，max-w-7xl。

### 3.1 顶部横幅

标题「记忆中枢与认知谱系」+ 徽章「多维认知档案」+ 一段说明（"严守日记感知与特质沉淀的分离准则…"）。

四个动作按钮：

| 按钮 | 行为 |
|---|---|
| 返回今日日记 | `setViewMode("daily")` |
| AI 认知升维（显示当前 provider） | 调 `/api/memory/distill`：只取 **L0 记忆的前 15 条**，要求模型蒸馏出 **2–4 条** L1/L2/L3/L4 候选；按钮转圈 |
| 一键同步 Obsidian | 调 `/api/memory/obsidian-sync`（POST 空 body）；成功后 toast「成功同步 N 条特质与记忆」+ confetti；失败显示 `Vault directory not found at: …` |
| 录入新记忆 | 展开新建抽屉 |

**新建抽屉**：双语 Tab（ZH/EN，有内容的一侧带 `•`）+ 认知维度下拉（L4/L3/L2/L1/L0，带中文长描述）+ 标题 + 正文 + topics（placeholder 提示 `you+bot, persona, tech-driven`）+ 「保存并存入记忆库」。

### 3.2 L0–L4 金字塔筛选（6 张卡）

「全部维度」+ L4→L0 五张，每张显示：层级名 + 该层条数 + 一句描述（如 L3「心智模型与思考框架」）。选中态白底 + 2px 黑环。

### 3.3 搜索 + 计数

输入框 placeholder「搜索记忆特质、价值观、SOP 技能或经历关键词…」，右侧「显示 N 条记忆」+ 当前层级 chip。搜索范围：标题 / 正文 / topics 的中英双语字段。

### 3.4 卡片网格（3 列）

每张卡：层级色徽章 + 类型 + 标题 + 正文（3 行截断）+ topics + 「AI 提取」标记（`provenance.ai_generated`）+ 关系节点 chips + `+ 连结` + 编辑/删除图标 + 日期。

**行内编辑**：层级下拉（L4…L0）+ 双语 Tab（各自独立保存，互不覆盖）+ 标题/正文/confidence/topics + 绿色「保存」/「取消」。

### 3.5 AI 蒸馏结果弹层

逐条候选卡：层级徽章 + confidence + 标题 + 正文 + **溯源**（`derived_from_titles`，来自哪几条日记）+ 理由（`rationale`）。两个动作：**采纳**（confetti + 以 `ai_generated: true` 入库）或**驳回**。

### 3.6 数据风险

- **删除无二次确认**：卡片删除直接 `deleteMemory`（对比：卡片详情弹层、今日清空都有 confirm）。
- Obsidian 同步的 vault 路径**无法在 UI 指定**：只能用 `OBSIDIAN_VAULT_DIR` 环境变量或默认 `cwd/vault`，且文件名硬编码为 `01_Persona_and_Values.md` … `05_Reading_Notes.md` + `books/` 目录。

---

## 4. T3 · 关系图谱（`viewMode = graph`）

### 4.1 头部

标题「概念网络与节点脉络」+ 实时统计 `N 记忆节点 · N 关系连线 · N 脉络档案`。右上双 Tab：**关系网络** / **脉络档案**。

### 4.2 子工具条

| 控件 | 细节 |
|---|---|
| 编织潜在星轨连线 | 调 `autoCompileGraphRelationships`，用共享 topic / 时间承接 / 决策-产出规则批量补边；完成后 confetti + 反馈「成功发现并构建了 N 条新的语义与因果关联」，若已最优则提示"图谱已是最优状态" |
| 动态图谱 / 卡片流 | 同一份数据的两种渲染 |
| L0–L4 过滤 | 6 个胶囊，选中填层级色 |
| TOPIC 过滤 | 取全部 topic 的**前 6 个**，点击切换，再点取消 |

### 4.3 动态图谱（`ForceGraphCanvas`）

- **物理预计算**：渲染前同步跑 **160 次迭代**力导向模拟（不是实时动画循环），所以打开即稳定布局、无抖动。
- **交互**：滚轮以鼠标位置为锚点缩放（0.1–3.0，初始 0.85）；空白处拖拽平移；**拖拽节点可改位置**；hover 节点 → 邻居高亮、其余淡化；点击 → 右侧 Inspector。
- **HUD**：左下缩放百分比 + 加减/重置按钮；底部 L0–L4 图例（圆点色）；右上节点/边计数。
- **节点样式**：按类型填色 + 按层级描边/大小，超长标题截断。

### 4.4 卡片流

4 列网格，每卡：类型徽章 + `Lx` 徽章 + `🔗 N 连结` + 标题（2 行）+ 正文（2 行）+ 缩略图 + topics（前 2）+ `MM-DD`。选中加黑环。

### 4.5 节点 Inspector（右栏 336px）

选中后显示：类型徽章 + 标题 + 日期 + 正文 + 图片 + 「关联节点列表 (N)」+「+ 连结新节点」+ 底部长按钮「查看卡片详情与完整编辑」。空态：网络图标 +「选择左侧任意记忆节点」。

### 4.6 脉络档案（Dossier）

左栏 288px：`MEMORY HUB TOPICS (N)` + 「AI Compiled」标签 + 每个 topic 一行（`#topic` + 节点数 + 箭头），选中变黄底黑字。

右栏 dossier 三块：
1. `// 认知全景概要 (Executive Summary)` — 一段综述
2. `// 核心原则与关键洞察 (Core Principles)` — 带红方块列表
3. `// 关联支撑记忆节点 (N)` — 两列卡片，点击直接开卡片详情

⚠️ 这一版**没有**「思想演进编年史」和「未决议题 Open Loops」——那两块只存在于 `ConstellationModal`（一个没有任何入口的组件，见 §11）。

---

## 5. M1 · 生活存根（`DailyReceiptModal`）

**全屏横滑轮播**，不是普通弹窗。

| 元素 | 细节 |
|---|---|
| 顶部栏 | 标题 + `第 X / N 天` + 一段说明；中间是**日期胶囊轨道**（`MM-DD` + 今天/昨天标签 + 已归档小圆点），点击跳到对应卡；右侧打印 / 关闭 |
| 卡池 | 所有记忆日期 ∪ 已存存根日期 ∪ `selectedDate` ∪ 今天，倒序 |
| 卡片 | 宽 340/390/420 三档；高 `min(720px, 100vh-90px)`；**上下锯齿撕边**（SVG path 生成真锯齿）；非当前卡 scale 0.95 + 40% 透明 |
| 纸面 | `linear-gradient(180deg, #FAF8F5 65%, 心情水彩色 100%)` — 心情选什么，纸底就染什么色 |
| 内容 | 日期大标题 + 星期 + 今天/昨天标 + 心情条 + 「今日记录清单」编号列表（标题/时间/正文 2 行/拍立得缩略图/topics）+ `TOTAL SLIPS // N ITEMS` + 复盘引文（左侧色条）+ `ARCHIVED` 火漆印章（spring 动画旋入） |
| 空日 | 「当天暂无记录碎片 · 留白也是一种记忆」+「去记一笔今日随想」（切日期并关闭） |
| 操作 | 「在主页中展开」/「保存归档」（confetti + 印章）；键盘 ← → Esc；scroll-snap + scroll spy 自动同步高亮 |

⚠️ 「打印存根」直接 `window.print()`，`globals.css` 里**没有 `@media print`** → 会把整个遮罩层和背景一起打印。

---

## 6. M2 · 周度复盘（`WeeklyDigestModal`）

自然周（周一–周日）维护台，`max-w-4xl` / 88vh。

| 区块 | 细节 |
|---|---|
| 周导航 | `‹` / 当前周（或 `-N 周前`）/ `›`；**不能去未来**（`weekOffset ≤ 0`） |
| 统计条 | 本周碎片总数 + 活跃天数 + 五层分布胶囊（L4→L0）+ TOP 5 topics |
| 层级过滤 | 全部 / L4 / L3 / L2 / L1 / L0 |
| 搜索 | 局部 state，搜标题/正文/topics |
| 列表 | 每条：层级色左边框 + 层级徽章 + 日期时间 + 标题 + 正文 3 行 + topics + 编辑/删除 |
| 编辑/补记抽屉 | 右侧 352px 滑入：层级五宫格 → **自动映射 type**（L0→moment / L1→achievement / L2→plan / L3→learning / L4→decision）+ 日期下拉（**只能选本周 7 天**）+ 标题 + 正文 + topics |
| 导出周报 | 生成完整 Markdown（概览 / 认知分层分布 / 高频主题 / 逐条清单）→ 写剪贴板 + confetti + 「已复制周报」 |

⚠️ 周起止用 `toISOString().split("T")[0]`（UTC）计算：东八区下周一本地 00:00 = 周日 16:00 UTC → **区间实际变成"周日~周六"**，标签也显示成周日开头（`WeeklyDigestModal.tsx:98-99`）。

---

## 7. M3 · 履历与成果库（`CareerStudioModal`）

「BragBook Engine」。**三个 Tab**，共享一个时间范围选择器：本周 / 近 14 天 / 本月 / 全部胜仗。

**工作相关性判定**（决定哪些记忆进这个模块）：`type === "achievement"`，或标题/正文/topics 命中 24 个关键词之一（api / mcp / ui / pr / commit / bug / feat / 上线 / 完成 / 交付 / 重构 / 优化 / 设计 / 打通 / 接入 / 部署 / 架构 / 测试 / 发布 / 项目 / 胜仗 / 工作 / 需求 / 研发）。

### Tab 1 · 周报/述职报告
本地模板拼装（核心交付 / 技术攻关 / 业务收益 / 下阶段规划四段）→ 可自由编辑的大 textarea → 「一键复制周报全文」/「下载 Markdown」（文件名带日期）。
「✨ AI 一键深度提炼」调 `/api/career/generate`，成功后右上出现引擎徽章（显示实际 provider），并用返回的 `report` 覆盖文本、`star_items` 覆盖简历库。

### Tab 2 · 简历亮点 & STAR 面试库
每条：标题 + 日期 + 琥珀色「[简历推荐表述]」句子 + 「复制简历句」+ 展开箭头。
展开后三列：`S · 业务背景/难点` / `A · 核心行动/方案` / `R · 最终成果/收益`。
顶部「复制全部简历亮点」一次性导出所有 bullet。数据来源优先 AI 返回，否则用本地正则从正文里抽 `【S…】/【A…】/【R…】`。

### Tab 3 · 胜仗清单
一段 Brag Document 方法论说明 + 卡片网格（类型 / 日期 / 标题 / 正文 3 行 / `已累计演进 N 次`）。

---

## 8. M4 · 历史档案（`ArchiveModal`）

纯检索视图：类型下拉（**只有 moment / idea / learning / decision / plan 5 种**）+ 日期选择器 + 「清除」。列表行 = 类型徽章 + 标题 + 正文 1 行 + 日期，点击开卡片详情并关闭。
左上角红色「清空全部数据」→ confirm → 抹掉记忆/关系/存根/自定义位置。

⚠️ 类型下拉缺 `achievement`、`collection`、`receipt` 和所有自定义类型 → 这些记忆只能靠日期或"全部"找。

---

## 9. 系统弹层（8 个）

### D1 · 欢迎向导（`WelcomeGatewayModal`）
首屏守卫触发。两 Tab：**连接 GitHub**（粘 PAT → ≥25 字符自动验证并回显 `@login`；仓库名留空默认 `my-dayprint-vault`；提示"不存在会自动创建私有仓库"）｜**体验 Demo**（一键载入示例数据，明确警告"Demo 模式无法持久存储"）。完成后写 `dayprint_onboarding_completed`。

### D2 · 全局检索（`OmniSearchModal`，⌘K）
- 空查询 → 最近 7 条。
- 有查询 → 打分：标题命中 +65、正文 +35、topic +45；再叠**意图加权**：含"习惯/偏好"命中 L2 +55；含"画像/人设/特质"命中 L1/L3 +60；含"信念/原则/价值观"命中 L4 +70；含"愿景/目标"；含"灵感"；含"今天"。
- 结果行显示：层级徽章 + 标题 + 命中理由 + 相似度百分比（55+score×0.45，夹在 68–99）。
- ↑↓ 选择、Enter 打开、Esc 关闭。

### D3 · 卡片详情（`ExpandedMemoryModal`）
阅读态：类型徽章 + 时间 + 标题 + topics + 大图 + 正文 + **演进时间线**（左侧绿竖线 + 圆点 + 每条时间戳/正文/图）+ 关联记忆两列网格 + 底栏（编辑 / 归档 / `ID: mem_xxx`）。
编辑态：双语 Tab（各自独立、互不覆盖）+ 类型胶囊 + 自定义类型 + 标题 + 正文 6 行 + topics + 图片（上传压缩 / 粘 URL / 更换 / 移除）。

### D4 · 建立连结（`ConnectionModal`）
上方当前记忆摘要 → 「现有连结 (N)」列表（关系类型黄标 + 对方标题 + 理由引文 + 解除连结）→ 下方新建表单：选目标记忆（下拉列出全部其他记忆，带类型前缀）+ 关系类型（同主题 / 同项目 / 语义相似 / 时序承接 / 决策与结果 / 直接连结）+ 理由 → 「建立思考连结」。建立后同时把目标 ID 写进 `memory.relations`。

### D5 · 智能文档萃取（`SmartDocumentIngestModal`）
三输入 Tab：
- **粘贴笔记全文**（含 3 个示例填充：飞书复盘 / 读书精要 / 原则心智）
- **飞书 / Google Doc 链接**（飞书走 `FEISHU_APP_ID/SECRET` 换 tenant token 读 `raw_content`，wiki 链接会先换 obj_token；Google Doc 需公开可读）
- **本地文件**（`.md/.markdown/.docx/.txt/.csv/.json`，docx 用 mammoth 解析）

→ `/api/memory/extract-doc` 切片 → 预览卡（层级徽章 L1–L4 + 类型 + topics + 标题 + 正文 + `rationale`）→ 逐张勾选 + 「自动连结这批记忆」开关（勾上会把相邻卡片串成 `same_project` 边）→ 「一键批量录入 (N)」。

### D6 · 偏好设置（`GitHubSettingsModal`）—— 三 Tab
| Tab | 内容 |
|---|---|
| **AI 模型与 API Key** | 6 个 provider（Gemini / OpenAI / Claude / DeepSeek / Custom Proxy / 内置本地引擎）；每个 provider 有模型预设按钮；Custom/OpenAI/DeepSeek 额外显示 Base URL；Key 存 localStorage（明文）；「测试连通性」实际打 `/api/memory/distill` 用 3 条样本验证 |
| **GitHub 同步** | 两步：① PAT（带「一键生成 Token」外链，scope=repo）② 仓库名（4 个预设）。另有隐私红条（必须 Private）、Demo 引导条、自动同步开关、底部「从 GitHub 拉取」/「一键绑定并备份」/「断开连接」 |
| **数据管理** | 清理测试数据 / 彻底清空全部 / 重新载入官方示例，三个都带 confirm |

### D7 · 图谱档案弹层（`ConstellationModal`）
⚠️ **无入口**（见 §11）。内容是 `GraphNodesView` 的旧版：卡片网格 + Inspector + dossier；dossier 比现行版本**多两块**：`思想演进编年史 (Evolution Timeline)` 和 `未决议题与待办计划 (Open Loops)` + `交叉引用概念`。

### D8 · 无界面但有数据通路的入口
- `POST /api/memory/ingest` → 写 `.dayprint-inbox.json`；前端每 **3 秒**轮询 `GET`（读后即清空）→ 外部（bot / 快捷指令 / 脚本）可以往手账里推记忆。
- GitHub 轮询：已连接时每 **20 秒**拉一次远端 + 窗口 focus 时再拉。
- 自动同步：本地改动后 **2 秒防抖**推 `archive.json`；`beforeunload` 用 `keepalive` 兜底。

---

## 10. 能力矩阵

| 面板 | 读 | 写 | 调 AI | 调网络 | 快捷键 |
|---|---|---|---|---|---|
| 今日记录 | 全部记忆 | 新增/编辑/删除/关系 | polish | translate | ⌘K、⌘Enter |
| 认知档案 | 按层级/关键词 | 新增/编辑/删除/关系 | distill | obsidian-sync | — |
| 关系图谱 | 全图 + 档案 | 批量补边/新建边 | —（规则引擎） | — | 滚轮/拖拽 |
| 生活存根 | 按日期 | 心情/复盘/归档 | — | — | ←→Esc |
| 周度复盘 | 按周 | 增/改/删 | — | — | Esc |
| 履历成果库 | 按范围+工作关键词 | —（只读） | career/generate | — | — |
| 历史档案 | 全部 | 删除全部 | — | — | Esc |
| 全局检索 | 全部 | — | —（本地打分） | — | ⌘K、↑↓↵ |
| 文档萃取 | 外部文档 | 批量新增+串边 | extract-doc | 飞书/GDoc | — |
| 偏好设置 | 设置 | 设置/清库 | distill（测试） | GitHub API | — |

---

## 11. 断链与风险清单（按影响排序）

| # | 问题 | 证据 | 影响 |
|---|---|---|---|
| 1 | **「演进归并」点了没用**：只设 `targetMemoryId`，`editorMode` 永远是 `create`，`setEditorMode` 全仓零调用 → 保存仍新建独立卡片 | `TodayEditor.tsx:32, 341, 640` | README 主打的「跨天活体演进」在 UI 上无法完成；`appendToMemory` 成为死函数 |
| 2 | **「今日记录」不过滤日期**：`day` 分支 `return true`，且 `setTemporalLevel` 无 UI 入口 | `MemoryCanvas.tsx:38-39`；`memory-context.tsx:121` | 画布 = 全部记忆瀑布流，与"今日"语义不符 |
| 3 | **696 行组件无入口**：`onOpenConstellation` 传给 Sidebar / Header / ContextPanel，三者都只解构不调用 | `page.tsx:64,76,95`；三组件 props 声明处 | `ConstellationModal` 完全不可达；且它是唯一含"演进编年史 + Open Loops"的档案版本 |
| 4 | **侧栏快捷搜索永不渲染**：依赖 `onOpenSearch`，`page.tsx` 未传 | `AppSidebar.tsx:204` | 侧栏顶部那块 ⌘K 输入框不存在（顶栏那个可用） |
| 5 | **灵感签 AI 生成未接线**：`handleAiGenerate` 定义但无按钮 | `DailyMuseSlip.tsx:188` | "深度追问"包只有静态 prompt |
| 6 | **时区口径三套并存**：周报用 UTC 取日期（东八区会错一天）、存根的"今天/昨天"用 UTC、热力图用本地日期 | `WeeklyDigestModal.tsx:98-99`；`DailyReceiptModal.tsx:59,198`；`MemoryActivityHeatmap.tsx:16` | 凌晨 0–8 点、跨周边界会出现"记录跑到前一天/上一周" |
| 7 | **打印无样式**：无 `@media print` | `globals.css` 全文 | 「打印存根」会连遮罩和背景一起打 |
| 8 | **删除确认不一致**：认知档案卡片直接删；详情弹层/今日清空有 confirm | `MemoryOSView.tsx` 卡片删除处 | 误删无挽回（无回收站，删即从 localStorage 移除） |
| 9 | **历史档案类型不全**：只 5 种 | `ArchiveModal.tsx:96-102` | achievement / 自定义类型无法筛选 |
| 10 | **Obsidian 路径不可配**：只能 env 或 `cwd/vault`，文件名硬编码 5 个 + `books/` | `obsidian-sync/route.ts:5,210-217` | 普通用户点「一键同步」必报 `Vault directory not found` |
| 11 | **默认语言反了**：state 初值 `"en"`，`DEFAULT_SETTINGS.language` 是 `"zh"` | `memory-context.tsx:125` vs `:93` | 首次进入英文界面 |

---

## 12. 如果要修，按这个顺序

1. **补 `setEditorMode("append")`**（1 行）→ 让归并真的归并。这是产品叙事的地基，优先级最高。
2. **`day` 分支改成按 `selectedDate` 过滤**，或在控制带加一个"今日 / 本月 / 全部"的时间粒度开关（`temporalLevel` 本来就有，只是没接 UI）。
3. **给 `ConstellationModal` 一个入口**，或把它独有的 Timeline / Open Loops 合并进 `GraphNodesView` 的 dossier，然后删掉死组件。
4. **统一时区口径**：写一个 `toLocalDateStr(date)`（热力图里已有现成的 `getLocalDateStr`），周报、存根、履历全部改用它。
5. 补 `@media print`，只保留当前存根卡。
6. 把删除统一加上 confirm（或做一个 7 天软删除）。
