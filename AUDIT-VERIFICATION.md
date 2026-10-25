# 审计复核报告 · Audit Verification

对 `REFACTOR-AUDIT.md` / `TABS-SPEC.md` 三项结论的逐条压力测试。

复核方法：全仓库 grep（ripgrep）+ 逐处读源码 + **实跑测试验证**。
凡标注「实测」的结论都有可复现证据；凡标注「推断」的都已注明依据。

> **重要前提**：本机 macOS 的 BSD `grep` 不支持 `\|` 交替语法，我第一轮复核有 3 条结论
> 因此得到**假阴性**（例如「i18n helper 从未被使用」是错的）。以下所有数据已改用 ripgrep 重取。

---

## 0. 先纠正我自己三条

| # | 我之前的说法 | 实际情况 | 性质 |
|---|---|---|---|
| 1 | `ConstellationModal` 不可达 | 结论**对**，机制说错。它**有被挂载**（`page.tsx:138`），但 `isConstellationOpen` 唯一的 setter `onOpenConstellation` 从未被调用 | 结论侥幸正确，推理错误 |
| 2 | 「744 处硬编码 trilingual 是翻译遗漏」 | 数量应为 **736**；更重要的是**性质判断错了**——这不是遗漏，这是**这个项目实际在跑的第二套 i18n 系统**。`i18n.ts` 才是死的那套 | 性质定性错误 |
| 3 | 「5 个 API route 重复实现 4 provider 分发」 | 确认，但只有 5/8 个 route 真的调 LLM（`ingest` / `obsidian-sync` / `github/sync` 不调） | 表述不够精确 |

---

## 1. demo / production 双模式，保护了「孤儿组件」吗？

### 答案：**没有。两种模式共用完全相同的组件树。**

你提的假设是合理的——如果 demo 模式挂 `SpatialCanvas`、production 挂 `BoogieMatrixCanvas`，那它就
不是死代码。但代码不是这么写的。

**证据 1：没有任何按需加载。**
`dynamic(` / `React.lazy` / `import(` / `Suspense` 全仓库搜索，命中**只有两个测试文件**
（`bilingual.test.ts:132-133`、`memory.test.ts:73-74`）。没有任何组件是条件加载的。

**证据 2：`appMode` 只影响文案，不影响挂载。**
全仓库只有 4 个文件读 `appMode`：

| 文件 | 用途 |
|---|---|
| `memory-context.tsx:24,136,1012` | 定义 / 暴露 |
| `HeaderBar.tsx`（8 处） | 按钮文案与徽标变体 |
| `GitHubSettingsModal.tsx:63,970-1038`（6 处） | 设置页「数据」Tab 的说明文字 |
| `BoogieMatrixCanvas.tsx:366` | **唯一**影响渲染的一处：空态文案 |

`BoogieMatrixCanvas.tsx:366` 是全部代码里唯一一处 `appMode` 参与渲染判断的地方，而且只是决定
「暂无记忆」提示说什么。**它从来没有决定渲染哪个组件。**

**证据 3：`page.tsx` 的组件树是硬编码的。**
```tsx
{viewMode === "daily" ? (<><MemoryCanvas />{isContextPanelOpen && <ContextPanel .../>}</>)
 : viewMode === "memory_os" ? (<MemoryOSView />)
 : (<GraphNodesView />)}
```
`appMode` 不在这个条件里。两种模式走的是同一个三元表达式。

**结论**：两种模式的差异 = seed 数据不同 + 约 15 处文案分支 + 1 处空态。
组件集合完全一致。所以「孤儿组件在另一个模式下被用到」这个可能性**不存在**。

### 逐个裁决

| 组件 | 行数 | 外部引用 | 裁决 | 依据 |
|---|---|---|---|---|
| `SpatialCanvas.tsx` | 309 | **0** | **真死** | 全仓库无任何 import；`MemoryCanvas` 也没用它 |
| `MemoryCard.tsx` | 231 | 1（`SpatialCanvas:6`） | **传递性死** | 唯一使用者本身是死的 |
| `ConstellationModal.tsx` | 696 | 1（`page.tsx:11,138`） | **运行时死** | 见下 |

### `ConstellationModal` 的死法值得单独说——这是一个 **bug**，不是废弃设计

它被 `page.tsx:138` 正常挂载，但开门的钥匙断了：

- `isConstellationOpen` 初值 `false`（`page.tsx:35`）
- 唯一的 setter 是 `onOpenConstellation`（`page.tsx:64,76,95` 三处传入）
- `onOpenConstellation` 在三个组件里都**声明了类型、解构了**：
  - `HeaderBar.tsx:37`（接口）、`:46`（解构）
  - `AppSidebar.tsx:35`、`:47`
  - `ContextPanel.tsx:35`、`:45`
- **但没有任何一处 JSX 调用它。** 零个 `onClick={onOpenConstellation}`，零个 `action: onOpenConstellation`。

对比一下同一批 prop 的待遇：

```
onOpenReceipt          → AppSidebar.tsx:132  action: onOpenReceipt        ✅
onOpenWeeklyDigest     → AppSidebar.tsx:136  action: onOpenWeeklyDigest   ✅
onOpenCareerStudio     → AppSidebar.tsx:140  action: onOpenCareerStudio   ✅
onOpenArchive          → AppSidebar.tsx:141  action: onOpenArchive        ✅
onOpenGitHubSettings   → AppSidebar.tsx:397  onClick={onOpenGitHubSettings} ✅
onOpenConstellation    → （无）                                            ❌
```

`AppSidebar` 的 `libraryTools` 数组（`:104-146`）只有 4 项：receipts / weekly_digest / career / archive。
**constellation 那一项被漏掉了。**

而 `ConstellationModal` 内部（`486-690`）还写了两个 `GraphNodesView` **完全没有**的 section：
「思想演进编年史 Evolution Timeline」和「未决议题与待办计划 Open Loops」，外加「交叉引用概念」。

**判断**：这是写完了、忘了接线的功能，不是废弃实验。所以处置方式应该是**二选一**，
而不是简单删除：
- **A. 接线**：在 `libraryTools` 补一项，它就成了 T3 的「深度档案」视图；
- **B. 删除**：如果你确认那两个 section 不想要了，删 696 行。

**但绝不能留着**——现在这样是「用户永远看不到，但每次 build 都要编译」的状态。

---

## 2. 重复：哪些是设计，哪些真能删

逐项裁决，按「是否无害」排序。

### 2.1 真重复，逐字节相同 → 可以放心删

| 项 | 位置 | 证据 |
|---|---|---|
| `compressImage` | `TodayEditor.tsx:158` + `ExpandedMemory.tsx:71` | 35 行**完全一致**，只有注释不同 |
| `normalizeGitHubRepo` | `GitHubSettingsModal.tsx:37` + `WelcomeGatewayModal.tsx:28` | 8 行**完全一致**（另有 2 份在测试文件里本地重声明） |

这两项共可删 **43 行**，抽到 `src/lib/utils.ts` 即可。风险为零。

### 2.2 部分设计 + 部分冗余 → 收敛，不要删

**`MOOD_PRESETS`（`ContextPanel.tsx:21` vs `DailyReceiptModal.tsx:30`）**

你的直觉是对的——它们**确实有不同的字段需求**：

| 字段 | ContextPanel | DailyReceipt | 说明 |
|---|---|---|---|
| `id` / `color` | ✅ | ✅ | 相同 |
| `label` / `labelEn` / `descZh` | ✅ | ✅ | **5 条 × 3 字段 = 15 个值纯重复** |
| `descEn` | ✅（做 tooltip） | ❌ **缺失** | 见下 |
| `shortZh` / `shortEn` | ❌ | ✅（票据小标签） | 渲染需求不同 |
| `wash` | ❌ | ✅（水彩底色） | 渲染需求不同 |

**裁决**：字段差异是设计，但**共享的 15 个值是冗余**，且 `DailyReceipt` 版本**丢了 `descEn`**
——意味着票据那张视图在英文模式下**没法显示英文情绪描述**（虽然目前它只渲染 `label`/`labelEn`，
所以还没暴露成可见 bug，但这是一个正在等着被踩的坑）。

**处置**：收敛成一份超集，`descEn` 必须补上。

### 2.3 不是无害重复 —— **已经漂移出可见 bug** 的重复

这是本次复核最值得说的发现。

**`typeColorMap` 全仓库 4 份，其中 2 份活着、2 份声明后从未被索引。**

| 声明位置 | 是否被使用 |
|---|---|
| `GraphNodesView.tsx:146` | ✅ `:344`、`:458` |
| `ConstellationModal.tsx:136` | ✅ `:288`、`:386` |
| `TodayEditor.tsx:423` | ❌ **从未索引** |
| `ExpandedMemory.tsx:168` | ❌ **从未索引** |

而活着的两份，**值已经对调了**。以 `types/memory.ts:41` 的 `DEFAULT_TYPE_COLORS`（唯一权威）为基准：

| type | 权威值 | `GraphNodesView`（T3，活着） | `ConstellationModal` |
|---|---|---|---|
| `idea` | `#C97A63` | ✅ 一致 | ✅ 一致 |
| `learning` | `#5B7B94` | ✅ | ✅ |
| `moment` | `#C49A56` | ✅ | ✅ |
| **`decision`** | **`#7C6F93`（紫）** | ❌ **`#475569`（石板蓝）** | ✅ |
| `plan` | `#608066` | ✅ | ✅ |
| **`collection`** | **`#5A7D8F`（青）** | ❌ **`#7C6F93`（紫，这是 decision 的颜色）** | ✅ |
| `receipt` | `#4A423D` | ❌ `#2B2420` | ❌ `#292524` |

**后果**：同一条 `decision` 类型的记忆——
- 在 T1 日记画布（走 `getMemoryTypeBadgeStyle` → `DEFAULT_TYPE_COLORS`）是**紫色**
- 在 T3 关系图谱的卡片是**石板蓝**
- 同一条 `collection`：T1 青色，T3 紫色

这不是「代码不够干净」，这是**用户能一眼看出来的不一致**。而且它正好证明了重复代码的真实代价：
两份 map 分开维护，`decision` 和 `collection` 的取值被人改过一次、只改了一边。

**处置**：删掉 4 份，全部走 `getMemoryTypeBadgeStyle()`。T3 需要 `hex`，它本来就返回 `hex`。

### 2.4 Modal 外壳：14 处壳，但 Esc 缺的比我说得多

`fixed inset-0` 全仓库 **15 处**（14 个 modal/面板壳 + 1 个 `AppSidebar` 移动端遮罩）。

Esc 监听只有 **7 处**（`OmniSearchModal:71`、`ExpandedMemory:152,317`、`ConnectionModal:50`、
`TodayEditor:927`、`ArchiveModal:20`、`DailyReceiptModal:147`、`WeeklyDigestModal:70`）。

**完全没有 Esc 的 modal（5 个，我之前说 3 个，说少了）：**

| Modal | 缺 Esc |
|---|---|
| `ConstellationModal` | ❌ |
| `WelcomeGatewayModal` | ❌ |
| `CareerStudioModal` | ❌ |
| `GitHubSettingsModal` | ❌ |
| `SmartDocumentIngestModal` | ❌ |

**处置**：抽一个 `<ModalShell>`（`fixed inset-0` + 遮罩 + Esc + focus trap + 点击遮罩关闭），
一处修完 5 个。

### 2.5 LLM 分发：确认重复

`src/lib/` 下**没有任何 LLM 客户端**（`graph-engineering / i18n / layout-engine / memory-context /
seed / sound / translator / utils / vault-parser`）。provider URL 硬编码分布：

| route | provider URL 硬编码次数 |
|---|---|
| `api/memory/distill/route.ts` | 5 |
| `api/career/generate/route.ts` | 5 |
| `api/translate/route.ts` | 3 |
| `api/memory/polish/route.ts` | 3 |
| `api/memory/extract-doc/route.ts` | 1 |

**处置**：抽 `src/lib/llm.ts` 导出 `dispatchLLM(messages, opts)`，5 个 route 各删 60-90 行。

---

## 3. T2 Cognitive Ledger 的卡片 vs T3 Knowledge Graph 的卡片：功能冗余吗？

### 答案：**是冗余，但冗余的不是「功能」，是「卡片外壳」；而且两个版本各缺对方的一半。**

T3 的卡片视图不是隐藏的——`GraphNodesView.tsx:253` 有个叫「拓扑索引 / Topology Index」的按钮，
点进去就是卡片网格（`graphDisplayMode === "cards"`）。用户**能**在 T2 和 T3 看到同一批记忆的两套卡片。

### 字段逐项对照

| 能力 | T2 认知档案 (`MemoryOSView:820-900`) | T3 拓扑索引 (`GraphNodesView:352-431`) | 谁赢 |
|---|---|---|---|
| L0–L4 层级徽标 | ✅ `meta.nameZh/nameEn`（**已本地化**） | ✅ `levelMeta.shortZh/shortEn`（已本地化） | 平 |
| 类型徽标 | ❌ **不显示** | ⚠️ `{node.type}` **裸枚举，永远英文小写** | T2（宁可不显示，也不显示错语言） |
| 标题 | ✅ 本地化，`text-sm`，不截断 | ✅ 本地化，`text-xs`，`line-clamp-2` | T2 |
| 正文 | ✅ 本地化，`line-clamp-4` | ✅ 本地化，`line-clamp-2` | T2 |
| 缩略图 | ❌ **没有** | ✅ `h-14` 缩略图 | **T3** |
| 关联呈现 | ✅ **可点击的 `[[关联标题]]` 芯片**（前 3 个）+ `+N` | ⚠️ 只有计数「N 连结」 | **T2** |
| 主题标签 | ✅ 前 4 个 | ✅ 前 2 个 | T2 |
| 出处（Obsidian / 飞书 / 手动） | ✅ 有 | ❌ 没有 | **T2** |
| 日期 | `toLocaleDateString()`（跟随系统语言） | `occurred_at.slice(5,10)` → `10-01` | 都不对，见 §4.3 |
| 编辑 | ✅ **内联双语编辑**（ZH/EN 双 Tab，标题+正文） | ❌ 只读（改要走 Inspector） | **T2** |
| 密度 | 最多 3 列 | 最多 4 列 | T3 |
| 选中后 | 打开 `ExpandedMemoryModal` | 右侧 Inspector 抽屉（不离开页面） | 定位不同，都合理 |

### 裁决

**功能上没有冗余**——T2 是「编辑/管理台」，T3 是「探索/索引台」，定位确实不同。你的直觉只对了一半。

**但实现上冗余严重**：两张卡片都从头画了一遍 `badge → title → content → topics → date` 的骨架，
而且各自缺了对方的必需件：

- T2 **缺缩略图**（记忆有 `media_url` 时在 T2 完全看不见）
- T3 **缺可点击的关联**（只有数字，点不进去）
- T3 **缺出处**
- T2 的 `type` 干脆不显示，T3 显示了但**是英文裸枚举**

**建议**：抽一个 `MemoryCardShell`，暴露 4 个插槽：

```
<MemoryCardShell
  header={levelBadge | typeBadge}
  media={...}        // T3 传，T2 传 null
  relations={...}    // T2 传芯片，T3 传计数
  footer={provenance | count}
  onEdit={...}       // T2 传，T3 不传
/>
```

外壳共用后，T2 白拿缩略图，T3 白拿可点击关联。**保留两个视图，消灭两份实现。**

### 顺带一个性能问题

`GraphNodesView.tsx:54-62` 两个 `useMemo` 都在**组件顶层**无条件执行：

```tsx
const graph = useMemo(() => buildKnowledgeGraph(memories, relationships, language), [...]);
const wikiArticles = useMemo(() => compileLLMWiki(memories, relationships, language), [...]);
```

即使 `activeTab === "graph"`（用户根本没看 wiki），`compileLLMWiki` 每次 `memories` 变化都要全量跑一遍。
而 `memory-context` 零 memo 化 → 在 T2 里敲一个字都会让 T3 重算。见 §5 第 1 条。

---

## 4. 语言一致性：每个组件、每段内容，都切对语言了吗？

分三层看。**结论：UI 层大致对，数据层无法保证，展示层有零星漏点。**

### 4.1 结构层：两套 i18n 并存，活的那套是错的

| 系统 | 规模 | 实际被消费 |
|---|---|---|
| `src/lib/i18n.ts` 结构化字典 | 63 key × 2 语言 = **126 条** | **16 条** |
| 内联 `language === "zh" ? A : B` 三元 | **736 处 / 24 个文件** | 全部 |

`i18n.ts` 被消费的只有这 16 个 key：

```
app_title            AppSidebar.tsx:177
app_tagline          AppSidebar.tsx:184
saving               HeaderBar.tsx:86, AppSidebar.tsx:75
github_status_connected      HeaderBar.tsx:359
github_status_local_only     HeaderBar.tsx:362
daily_receipt_title  ContextPanel.tsx:170
nav_archive          ArchiveModal.tsx:59
memory_type_*（9 个） ArchiveModal:97-101,152 / GraphNodesView:464,528,677
                      / ContextPanel:353 / BoogieMatrixCanvas:83,470
```

**剩下 47 个 key（74%）从来没有被读过。**

**所以这不是「翻译遗漏」，是「没有单一真源」。** 后果：
- 加一个字符串要改 N 处，改漏一处就出现半中半英；
- 736 处三元无法被 lint 或测试覆盖（对比：`i18n.ts` 至少还有类型约束 `TranslationKey`）；
- `i18n.ts` 的 zh 分支和组件里的 zh 文案**已经开始分叉**了，例如：
  - `i18n.ts` 说 `nav_archive` = 「记忆归档」，`ArchiveModal.tsx:59` 的 zh 分支写的是「历史档案」
  - `i18n.ts` 说 `daily_receipt_title` = 「生活存根」，`ContextPanel.tsx:170` 的 zh 分支写的是「今日生活存根」

**处置（不是重写，是收口）**：让 `t()` 成为唯一入口，把 736 处三元逐步搬进去。
不需要一次搬完——先搬 3 个高频文件（`GitHubSettingsModal` 89 处、`MemoryOSView` 89 处、
`TodayEditor` 72 处 = 250 处 = 34%），就能把字典的覆盖率从 25% 拉到 60% 以上。

### 4.2 数据层：内容语言**无法保证**——这条我实测了

这是本次复核最重要的结论。`types/memory.ts:539` 的注释写着：

> *Strictly guarantees English-only in "en" mode, and Chinese-only in "zh" mode.*

**代码做不到。** 我写了个临时测试实跑（跑完已删）：

```
case A：中文记忆 + /api/translate 失败
  EN title   => 随手记的一条中文记忆        ← 泄漏
  EN content => 今天下午在咖啡馆读完了半本书…  ← 泄漏

case B：只有 _zh 字段，没有 _en
  EN title   => 随手记的一条中文记忆        ← 泄漏
  EN content => 今天下午在咖啡馆读完了半本书…  ← 泄漏

case C：英文记忆，切到 ZH 模式
  ZH title   => Morning walk along the canal          ← 泄漏
  ZH content => Walked for forty minutes before sunrise. ← 泄漏
```

**根因有两处：**

**① `translator.ts:73` 在翻译失败时返回原文：**
```ts
// 网络请求失败 / 无 API Key / 离线
return trimmed;   // ← 返回的是中文原文
```
然后 `ensureBilingualMemoryFields:140` 把它写进 `title_en`：
```ts
title_en: titleEn || titleZh,   // titleEn = 中文原文
```
于是数据库里出现一条「`title_en` 是中文」的记录。这是**污染源头**。

**② `getLocalizedTitle` 的守卫被自己绕过了：**
```ts
const enCand = m.title_en?.trim();
if (enCand && (!/[\u4e00-\u9fa5]/.test(enCand) || !m.title_zh)) {
  title = enCand;              // 守卫在这里是对的：含中文就不走
} else if (...) { ... }
  ...
} else {
  title = enCand || m.title;   // ← 最后又把它还回来了
}
```
`enCand` 含中文 → 第一个 `if` 跳过 → 一路 fallback 全部落空 → **最后一行 `else` 又把同一个
中文 `enCand` 返回**。守卫白写。

**为什么现有测试 6/6 全绿？** 两个原因：

1. `bilingual.test.ts:131` 那条「100% 纯英文」的测试**只遍历 `SEED_MEMORIES`**——而 seed 数据有
   `SEED_MEMORIES_EN_MAP` + `FALLBACK_EN_DICT` 两层硬编码映射兜底，**必然**通过。
2. `:68-94` 那条自动翻译测试只断言 `.length > 0`，不断言「输出真的是目标语言」。中文泄漏也能过。

**所以测试给了虚假的安全感。** 真实用户数据（尤其没配 LLM Key 的用户）100% 会中招。

**处置**：
- `translator.ts` 失败时返回 `""` 而不是原文（宁可空，不要错语言）；
- 或者在 `getLocalizedTitle` 末尾改成「若 `enCand` 含中文则返回占位符/原文标记」而不是静默返回；
- 补一条测试：构造「`title_en` 是中文」的记录，断言 EN 模式不输出中文。

### 4.3 展示层：逐项清单

| 项 | 现状 | 裁决 |
|---|---|---|
| `<html lang>` | `layout.tsx:69` 写死 `lang="en"` | ❌ **切到中文也不变**。影响屏幕朗读、浏览器翻译提示、搜索引擎语言判定 |
| `metadata` / `openGraph` | 标题描述全英文，但 `locale: "zh_CN"`（`layout.tsx:27`） | ❌ 自相矛盾 |
| T3 卡片类型徽标 | `GraphNodesView.tsx:378` `{node.type}` 裸枚举 | ❌ **同页 Inspector（`:464`）用的是 `t[\`memory_type_${...}\`]` 已本地化** → 同一屏两种表现 |
| T2 日期 | `MemoryOSView.tsx:899` `toLocaleDateString()` 无 locale 参数 | ❌ 跟随**操作系统**语言，不跟随 app |
| 归档日期 | `ArchiveModal.tsx:166` 同上 | ❌ |
| 详情日期 | `ExpandedMemory.tsx:202,537` 同上 | ❌ |
| 同步时间 | `GitHubSettingsModal.tsx:917` 同上 | ❌ |
| 票据星期 | `DailyReceiptModal.tsx:418` `language === "zh" ? "zh-CN" : "en-US"` | ✅ **全仓库唯一写对的** |
| 孤儿卡片 | `MemoryCard.tsx:46` `toLocaleDateString(undefined, ...)` | ❌（但它是死代码） |
| 同一字段三种格式 | T1 `formatDisplayDate` → `10/1`；T2 → 系统 locale；T3 → `10-01` | ⚠️ 不是语言 bug，是格式不统一，但用户在三个 Tab 间切换会看到三种写法 |
| `MEMORY_LEVELS_META` | `nameZh/nameEn/shortZh/shortEn/descZh/descEn` 六字段齐全 | ✅ **设计正确**，不是缺陷 |
| `MORANDI_PIGMENTS` | `nameZh/nameEn` 齐全 | ✅ 正确 |
| `MOOD_PRESETS`（ContextPanel） | `label/labelEn/descZh/descEn` 齐全 | ✅ 正确 |
| `MOOD_PRESETS`（DailyReceipt） | 缺 `descEn` | ⚠️ 潜在漏点（见 §2.2） |
| `topics` 标签 | 从不翻译 | ⚠️ 可接受（标签本就是语言中性的索引词），但要知情 |
| `"my-dayprint-vault"` | 输入框占位符 | ✅ 不算缺陷（仓库名是标识符，不该翻译） |
| `02_Work_and_Projects.md` 等 5 个文件名 | Obsidian 数据契约 | ✅ 不算缺陷 |
| `getLocalizedReason` / `getLocalizedCollectionName` | 有 helper，seed 测试覆盖 | ✅ 正确 |

**唯一需要立刻改的两条**：`<html lang>` 和 T3 卡片的裸枚举类型徽标。
其余是「一致性债务」，可以随 §4.1 的收口一起做。

---

## 5. 修正后的优先级

按「用户能否看见」× 「修起来多便宜」排序。

| # | 事项 | 收益 | 成本 | 用户可见 |
|---|---|---|---|---|
| 1 | **`memory-context` 加 memo**：Provider `value` 对象 + 所有函数目前零 `useMemo`/`useCallback`（`memory-context.tsx:1011` 内联对象）。在 T2 反思框敲一个字 → 全部卡片重渲染 + 整张 receipts 表重新序列化 | 最高 | 中 | ✅ 打字卡顿 |
| 2 | **修 `translator.ts` 失败返回原文** + 补 `title_en` 污染测试（§4.2） | 高 | 低 | ✅ 英文模式蹦中文 |
| 3 | **统一 `typeColorMap`** → 全走 `getMemoryTypeBadgeStyle`（§2.3） | 高 | 低 | ✅ decision 紫/蓝不一致 |
| 4 | **`<html lang>` 跟随 language**（§4.3） | 中 | 极低 | 间接（无障碍/SEO） |
| 5 | **T3 卡片类型徽标本地化**（§4.3） | 中 | 极低 | ✅ 中文模式下显示 `moment` |
| 6 | **`ConstellationModal` 二选一：接线或删除**（§1） | 中 | 低 | ✅ 一个完整功能现在是死的 |
| 7 | **抽 `ModalShell`**，补 5 个 modal 的 Esc（§2.4） | 中 | 中 | ✅ |
| 8 | **抽 `MemoryCardShell`**，T2/T3 共用外壳（§3） | 中 | 中 | ✅ T2 白拿缩略图 |
| 9 | **抽 `llm.ts`**，5 个 route 收敛（§2.5） | 中 | 中 | ❌ 纯维护性 |
| 10 | **`compressImage` / `normalizeGitHubRepo` 去重**（§2.1） | 低 | 极低 | ❌ |
| 11 | **`i18n.ts` 收口**（§4.1，先搬 3 个高频文件） | 中 | 高 | ❌ 但决定长期可维护性 |
| 12 | **删 2 份死 `typeColorMap`**（§2.3） | 低 | 极低 | ❌ |

---

## 6. 净结论

| 我原来的判断 | 复核后 |
|---|---|
| 「可删 2,000-2,500 行」 | **数字基本成立，但构成要改**。其中 1,236 行孤儿是**真死**（双模式不保护它们），但这 1,236 行里 **696 行（`ConstellationModal`）不该直接删**——它是个忘了接线的功能。真正「无争议可删」的是 309+231+43 = **583 行** |
| 「736 处 trilingual 是冗余」 | **不是冗余，是没有单一真源**。它是当前实际生效的 i18n 机制，删不掉，只能收口 |
| 「`ConstellationModal` 不可达」 | 对，但原因是**漏了一个侧栏菜单项**，不是设计如此 |
| 「T2/T3 卡片功能重复」 | **功能不重复，实现重复**。两者定位不同（管理台 vs 索引台），但外壳各画一遍、各缺一半能力 |
| 「语言一致性有 744 处问题」 | **UI 层基本没问题**（helper 用得很广，18 个文件）。真正的洞在**数据层**——内容语言无法保证，且现有测试给的是虚假安全感 |

**如果只改一件事**：改 `translator.ts:73`。因为那一个 `return trimmed` 是「英文模式蹦出中文」的
唯一源头，一行改动，影响所有用户创建的记忆。
