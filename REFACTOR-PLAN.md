# 重构方案 · Refactor Plan

对应三问：①冗余再确认 ②T2/T3 如何做成两个不同的东西 ③语言一致性怎么长期维护。

配套工具：`scripts/audit-i18n.mjs`（已建好，可直接跑）。

---

## §1 冗余再确认 —— 四处修正 + 两条新发现

### 1.1 我上轮的数字，重新校准

| 项 | 上轮结论 | 本轮复核 | 说明 |
|---|---|---|---|
| 内联三元 | 736 | **747** | ripgrep `count` 按**行**计，一行两处只算 1。脚本按出现次数计，747 才对 |
| i18n 字典覆盖 | 16/63 = 25% | **26/62 = 42%** | 上轮我漏了 `ConnectionModal` / `ExpandedMemory` / `TodayEditor` 里的 `t.xxx`。**我低估了使用面** |
| 中文字面量 | 未量化 | **835 处**（仅 `src/components/`） | 新增指标 |
| 裸 `toLocale*String()` | 5 处 | **6 处** | `MemoryCard.tsx` 漏算 |
| LLM 分发 | 「重复 190 行，省 500 行」 | **只有传输层重复**，见 1.2 | **重要修正** |
| Modal 壳 | 「14 份相同」 | **不同构**，见 1.3 | **重要修正** |

### 1.2 LLM 分发：不是「重复」，是「共享地基 + 5 套不同业务」

实测 `distill`（424 行）的 provider 段 100-290 与 `career`（388 行）的 195-385 逐行 diff：
**190 行里 149 行不同。**

不同的部分：prompt 文本、`temperature`（0.2 vs 0.3）、JSON 解析方式（`extractJsonArray` vs
`JSON.parse(cleanJsonText)`）、响应形状（`candidates` vs `report + star_items`）、错误处理。

相同的部分：4 个 provider 的 URL 拼接、鉴权头、请求体构造、`fetch` 包装、`!res.ok` 判断。
**约 60 行 × 5 个 route = 300 行。**

**所以上轮我说的「抽一个 dispatch 省 500 行」是错的**——那会把 5 套不同 prompt 塞进一个函数。
正确切法见 §2.6。

### 1.3 Modal 壳：不是「重复」，是「6 种不一致」

11 个 modal 的遮罩层实测：

| Modal | z-index | 遮罩色 | blur | 对齐 | 点遮罩关闭 |
|---|---|---|---|---|---|
| `OmniSearchModal` | **z-[70]** | black/60 | xs | **顶部** | ❌ |
| `WelcomeGatewayModal` | **z-50** | stone-900/60 | xs | 居中 | ❌ |
| `CareerStudioModal` | z-[60] | black/60 | **sm** | 居中 | ✅ |
| `DailyReceiptModal` | z-[60] | stone-900/**45** | xs | **整屏 flex-col** | ✅ |
| `ArchiveModal` | z-[60] | stone-900/**50** | xs | 居中 | ✅ |
| `WeeklyDigestModal` | z-[60] | stone-900/45 | xs | 居中 | ✅ |
| `GitHubSettingsModal` | z-[60] | stone-900/60 | xs | 居中 | ✅ |
| `SmartDocumentIngestModal` | z-[60] | black/**45** | xs | 居中 | ✅ |
| `ConstellationModal` | z-[60] | stone-900/60 | xs | 居中 | ✅ |
| `ExpandedMemory` | z-[60] | black/**40** | xs | 居中 | ✅ |
| `ConnectionModal` | z-[60] | black/40 | xs | 居中 | ✅ |

**6 种遮罩透明度、3 种 z-index、2 种 blur、3 种对齐、2 种关闭策略。**

这不是「重复代码」——重复代码删了行为不变。这是**视觉不一致**：连开两个弹层，遮罩深浅不一样。
所以不能简单合并成一个壳，要抽成**带 5 个 prop 的壳**（见 §2.6）。

### 1.4 新发现①：`source_ids` 全仓库零读取

```
写入点：19 处（seed.ts ×13、memory-context.tsx:511、ingest、obsidian-sync、github/sync…）
读取点：0 处
```

而 PRD §3.2 白纸黑字写着：

> **强溯源保障**：每一条沉淀特质保留 `source_id`，支持一键反查回当天的原始日记上下文。

**T2 最核心的差异化能力，根本没实现。** 字段建了、写了、存了、同步了，就是没人读。

### 1.5 新发现②：`confidence` 只能编辑，不能看

`MemoryOSView` 里 `confidence` 出现在 9 个地方：6 处是表单 state，3 处是写回。
**展示卡片（`:820-900`）一次都没渲染它。**

PRD §3.2 说的是「用户可在此工作区**清晰查看**…置信度」。
实际行为：你改了置信度，保存，卡片上什么都不会变。

### 1.6 这两条合起来，解释了「为什么 T2 看起来像 T3」

T2 独有的两件事（**溯源反查**、**置信度可视化**）都没渲染出来。
把这两块从卡片上拿掉，剩下的骨架——类型徽标 + 层级徽标 + 标题 + 正文 + 主题 + 日期——
**恰好就是 T3 卡片的内容**。

所以「功能冗余」的表象，根因是 **T2 的差异化能力没落地**。
修复方向不是「给两边发明差异」，是 **把 PRD 已经写好、代码没做的那半边补上**。

---

## §2 怎么改 —— 不抽共享壳，让两边真的不一样

### 2.0 先推翻我上轮的建议

上轮我建议抽 `MemoryCardShell` + 5 个插槽，T2/T3 共用。**这个建议不好**，三个理由：

1. 两个视图的**交互模型不同**（可编辑表单 vs 只读节点），共享壳必然退化成
   `if (editable) … if (hasMedia) … if (showProvenance) …` 的条件沼泽；
2. 你明确要求「两个地方要有**不一样**的功能和实现」；
3. 更关键：**差异不需要发明，PRD 里已经写好了**（§3.2 校准 vs §3.3 拓扑），只是代码没实现。

**正确做法：共享「原子」，不共享「卡片」。**

### 2.1 三层切分

```
L1  设计令牌（必须唯一）
    types/memory.ts → DEFAULT_TYPE_COLORS / MEMORY_LEVELS_META / getMemoryTypeBadgeStyle
    ↓
L2  原子组件（必须共享）
    components/primitives/ → <TypeBadge> <LevelBadge> <TopicChips> <LocalDate>
                             <ConfidenceMeter> <ProvenanceTag>
    ↓
L3  卡片（必须不同）
    T2 <LedgerCard>   可编辑表单行卡，1-2 列，带置信度条 + 溯源链
    T3 <TopologyCard> 只读节点胶囊，4-6 列，带缩略图 + 连结数
```

**L3 不共享。** 这是核心决定。

### 2.2 T2 重定位：记忆列表 → **校准工作台**

依据 PRD §3.2 已有承诺，补三件事 + 改两处形态。

**(a) 置信度可见**

```tsx
// components/primitives/ConfidenceMeter.tsx
export function ConfidenceMeter({ value, lang }: { value?: number | null; lang: Language }) {
  if (value == null) return <span className="text-[10px] text-stone-400">{lang === "zh" ? "未评估" : "Unrated"}</span>;
  const pct = Math.round(value * 100);
  const tone = value >= 0.85 ? "#608066" : value >= 0.7 ? "#C49A56" : "#C97A63";
  return (
    <span className="inline-flex items-center gap-1.5" title={lang === "zh" ? `置信度 ${pct}%` : `Confidence ${pct}%`}>
      <span className="w-10 h-1 rounded-full bg-stone-200 overflow-hidden">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
      </span>
      <span className="text-[10px] font-mono tabular-nums" style={{ color: tone }}>{pct}%</span>
    </span>
  );
}
```

**(b) 溯源反查**（PRD 承诺、当前缺失）

```tsx
// components/primitives/ProvenanceTag.tsx
export function ProvenanceTag({ sourceIds, onJump, lang }: {
  sourceIds: string[]; onJump: (id: string) => void; lang: Language;
}) {
  if (!sourceIds.length) {
    return <span className="text-[10px] text-stone-400">{lang === "zh" ? "无溯源" : "No source"}</span>;
  }
  return (
    <button onClick={() => onJump(sourceIds[0])} className="text-[10px] text-[#5B7B94] hover:underline">
      {lang === "zh" ? `源自 ${sourceIds.length} 条原始日志` : `From ${sourceIds.length} raw log(s)`}
    </button>
  );
}
```

> ⚠️ 这一步的前提：`addMemory` 在 distill 入库时必须把 `derived_from_titles` 映射成 `source_ids`。
> 现在 `MemoryOSView:155-170` 的 `handleAcceptCandidate` 完全没传 `source_ids`。这是 **P1 的前置依赖**。

**(c) 默认排序换成「待校准度」**

```ts
// 不是按时间，而是按「最需要我动手的」
function calibrationScore(m: CanonicalMemory): number {
  let s = 0;
  if (!m.title_en || !m.content_en) s += 40;   // 英文缺失
  if (!m.title_zh || !m.content_zh) s += 40;   // 中文缺失
  if (!m.topics?.length) s += 10;
  if (!m.source_ids?.length) s += 10;
  s += (1 - (m.confidence ?? 0.8)) * 20;       // 低置信加权
  return s;
}
```

排序换成 `sort((a,b) => calibrationScore(b) - calibrationScore(a))`。
**这一条就让它跟 T3 彻底不一样了**——T2 打开是「该干的活」，T3 打开是「枢纽在哪」。

**(d) 卡片形态：3 列网格 → 1-2 列表单行卡**

现在的问题：双语编辑区就地展开，在 3 列网格里会被挤成 90px 宽。所以行卡更合适。

```
┌────────────────────────────────────────────────────────────────┐
│ [L2 习惯准则] [idea]  ●●●●○ 82%        ZH ✅  EN ⚠️   [编辑][删] │
│ 技术排查规范：先复现再定位                                        │
│ 遇到线上问题先最小复现，再二分定位…                                │
│ #debug #sop        源自 3 条原始日志          2026/10/1         │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 T3 重定位：卡片浏览 → **拓扑索引**

**(a) 卡片降级为「节点胶囊」，去掉正文**

正文在右侧 Inspector（`:479-486`）已经完整显示了，卡片里再显示一遍是纯重复。

```
┌──────────────────────────┐
│ [idea] [习惯]        ⤳ 5 │
│ 技术排查规范              │
│ ┌────────┐               │
│ │ 缩略图  │               │
│ └────────┘               │
└──────────────────────────┘
```

高度从 ~120px 压到 ~64px，列数 4 → 5-6。

**(b) 排序固定为连结数降序**

T3 的语义是「哪些概念在聚拢」，按时间排是错的。现在 `filteredNodes` 直接沿用 `graph.nodes`
的顺序（= `memories` 顺序 = 时间序）。

**(c) 点击 → 图与 Inspector 联动**

现在点胶囊只 `setSelectedNodeId`。理想是同时让力导向图对应节点闪一下（即使当前在 cards 模式），
保持「同一个东西的两种呈现」的心智模型。

**(d) 明确不做编辑**

T3 保持只读。要改就去 T2。**这是两个 Tab 存在的意义。**

### 2.4 结果对比

| | T2 认知档案 | T3 拓扑索引 |
|---|---|---|
| 回答的问题 | 「哪条需要我校准？」 | 「哪些概念在聚拢？」 |
| 读写 | 读 + 写 | 只读 |
| 卡片形态 | 表单行卡，1-2 列，高 | 节点胶囊，5-6 列，矮 |
| 默认排序 | 待校准度 ↓ | 连结数 ↓ |
| 卡片独有 | 置信度条 / 双语完整度 / 溯源反查 / 双语编辑 | 缩略图 / 连结数 / Inspector 联动 |
| 共享 | `TypeBadge` `LevelBadge` `TopicChips` `LocalDate` `getLocalized*` | 同左 |

一眼能看出不同，且**零行重复的卡片代码**。

### 2.5 顺带解决的三件事

差异化重构和语言一致性修复在这里是**同一件事**，不是两件事：

| 动作 | 同时修好的问题 |
|---|---|
| 4 份 `typeColorMap` → `getMemoryTypeBadgeStyle()` | `decision` 紫/蓝不一致（T1 紫、T3 石板蓝） |
| T3 `{node.type}` → `<TypeBadge type={...} lang={language}>` | 中文模式下显示裸枚举 `moment` |
| 6 处裸 `toLocaleDateString()` → `<LocalDate iso={...} lang={language}>` | 日期跟随系统语言而非 app 语言 |

### 2.6 其他冗余的处置（不涉及 T2/T3）

| 项 | 处置 | 理由 |
|---|---|---|
| `compressImage` ×2（35 行 ×2） | 抽 `lib/image.ts` | 逐字节相同，无差异化必要 |
| `normalizeGitHubRepo` ×2（8 行 ×2） | 抽 `lib/github.ts` | 逐字节相同 |
| `MOOD_PRESETS` ×2 | 抽 `lib/moods.ts` 超集，**补 `descEn`** | 字段差异是渲染需求，但 15 个值不该重复；DailyReceipt 版丢了 `descEn` |
| `typeColorMap` ×4 | **删全部**，走 `getMemoryTypeBadgeStyle` | 其中 2 份声明后从未被索引 |
| LLM 分发 ×5 | **只抽传输层** | 见下 |
| Modal 壳 ×11 | 抽 `<ModalShell>` + **5 个 prop** | 见下 |

**LLM 只抽传输层**——不能像上轮说的「5 个 route 共用一个 dispatch」：

```ts
// lib/llm.ts  ← 只做「把 messages 发给某家，拿回文本」
export type LLMProvider = "gemini" | "openai" | "claude" | "deepseek" | "custom";

export async function callProvider(
  provider: LLMProvider,
  messages: { role: "system" | "user"; content: string }[],
  opts: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;   // distill 用 0.2，career 用 0.3 —— 各自传
    jsonMode?: boolean;
  }
): Promise<{ ok: true; text: string } | { ok: false; error: string }>
```

每个 route 只保留自己的：prompt 构造 + JSON 解析 + 响应形状。
**省约 300 行传输代码，零业务行为变更。**

**ModalShell 必须暴露 5 个 prop**，否则统一会破坏现有差异：

```tsx
<ModalShell
  zIndex={60}              // OmniSearch 用 70，Welcome 用 50
  align="center" | "top"   // OmniSearch 是顶部对齐
  padding="p-4" | "p-3 sm:p-5" | "none"
  backdropTone="black/40" | "black/60" | "stone900/45" | "stone900/60"
  closeOnBackdrop={false}  // Welcome / OmniSearch 不关
  closeOnEsc                // 顺手补齐 5 个缺 Esc 的 modal
>
```

---

## §3 语言一致性维护

三道闸门。第二道已经建好了。

### 3.1 闸门一：数据层不许写入未翻译内容（必须先修）

问题链：

```
translateText 失败 → return trimmed（返回原文）
  → ensureBilingualMemoryFields 写进 title_en
    → 库里出现「title_en 是中文」
      → getLocalizedTitle 末尾 else 把它原样返回
        → EN 模式显示中文
```

三个方案，**我推荐 B**：

| 方案 | 做法 | 问题 |
|---|---|---|
| A | `translateText` 失败返回 `""` | **不解决问题**：`getLocalizedTitle` 的 else 仍 fallback 到 `m.title`（中文） |
| **B** | 失败时**不写 `_en`**，改打 `translation_pending` 标记；渲染时显示原文 + 「未翻译」角标 | 诚实、可手动补。**推荐** |
| C | 翻译失败禁止保存 | 离线不可用，不可接受 |

```ts
// translator.ts
if (titleZh && !titleEn) {
  const t = await translateText(titleZh, "en");
  if (t && t !== titleZh) titleEn = t;   // 只有真的翻译了才写
  else translationPending = true;        // 否则打标记，不污染字段
}
```

```ts
// types/memory.ts — getLocalizedTitle / getLocalizedContent 末尾
} else {
  title = enCand || m.title || "Untitled Memory";
  if (lang === "en" && /[\u4e00-\u9fa5]/.test(title)) {
    title = `[未翻译] ${title}`;   // 显式暴露，不静默
  }
}
```

配套测试（**现在缺的就是这条**）：

```ts
it("翻译不可用时，EN 模式必须显式标记而不是静默显示中文", () => {
  const m = mem({ title: "中文标题", title_zh: "中文标题", title_en: "中文标题", language: "zh" });
  expect(getLocalizedTitle(m, "en").startsWith("[未翻译]")).toBe(true);
});
```

### 3.2 闸门二：棘轮（已建好）

```bash
pnpm audit:i18n            # 有退步 → exit 1
pnpm audit:i18n:baseline   # 迁移完一个文件，把水位降下来
```

当前水位（已写入 `scripts/i18n-baseline.json`）：

```
内联三元              747
中文字面量            835   （仅 src/components/）
裸 toLocale*String()    6
直读原始 .title/.content 4
i18n 字典覆盖      26 / 62 = 42%（36 个 key 从没被读过）
<html lang>            "en"  ← 硬编码
```

它**不做**的事：不要求你一次改完 747 处。它只保证**不会变多**。

接 CI：

```yaml
- run: pnpm audit:i18n
- run: pnpm test
```

### 3.3 闸门三：迁移顺序（按 ROI，不按文件大小）

**不要从 91 处的 `GitHubSettingsModal` 开始**——那是最难的，而且用户一年看两次。
按「是否顺手 + 用户可见频率」排：

| 顺序 | 文件 | 三元 | 为什么是这个顺序 |
|---|---|---|---|
| 1 | `graph/GraphNodesView.tsx` | 34 | 本来就要换 `<TypeBadge>`，一箭双雕 |
| 2 | `memory-os/MemoryOSView.tsx` | 89 | 本来就要重做卡片，一起改 |
| 3 | `receipts/DailyReceiptModal.tsx` | 23 | 已有全仓库唯一正确的 locale 写法（`:418`），照着抄 |
| 4 | `navigation/ContextPanel.tsx` | 23 | 每屏都在，收益高 |
| 5 | `canvas/BoogieMatrixCanvas.tsx` | 33 | 主画布 |
| 6 | `canvas/TodayEditor.tsx` | 72 | 主编辑台 |
| — | `GitHubSettingsModal`（91）/ `CareerStudioModal`（46） | 137 | **放最后**，设置页用户低频 |

### 3.4 每迁移一个文件的固定五步

1. 把中英对照搬进 `i18n.ts`，key 用 `文件.语义`（如 `ledger.empty_hint`）
2. `language === "zh" ? A : B` → `t.ledger_empty_hint`
3. `pnpm audit:i18n` → 确认该文件三元归零
4. `pnpm audit:i18n:baseline` → 水位降下来
5. `pnpm test`

> ⚠️ `i18n.ts` 现有 **36 个 key 从没被读过**。迁移前先删死 key，否则字典会变成 200 key 的垃圾场。

---

## §4 落地顺序

**P0 —— 半天，不改结构**
1. `translator.ts` 打 `translation_pending` + `getLocalizedTitle` 显式标记 + 补那条测试
2. 4 份 `typeColorMap` → `getMemoryTypeBadgeStyle`（`decision` 颜色立刻一致）
3. `compressImage` / `normalizeGitHubRepo` 抽到 `lib/`

**P1 —— 1-2 天，T2/T3 差异化**
4. 建 `components/primitives/`（6 个原子组件）
5. `handleAcceptCandidate` 补 `source_ids` 映射（溯源反查的前置依赖）
6. T2 → `<LedgerCard>` + 待校准排序
7. T3 → `<TopologyCard>` + 连结数排序

**P2 —— 2-3 天，结构**
8. `<ModalShell>` 统一 11 个 modal（保留 5 prop + 补 5 个 Esc）
9. `lib/llm.ts` 只抽传输层
10. `memory-context` 加 `useMemo` / `useCallback`

**P3 —— 持续，每 PR 一个文件**
11. 按 §3.3 顺序迁移 i18n，靠棘轮守住

---

## §5 一句话总结

**冗余不是「两处写了同样的东西」，是「T2 该有的能力没实现，只好长得像 T3」。**
所以修法不是合并，是**把 T2 补成校准台、把 T3 收成拓扑索引**，然后只共享 6 个原子组件。
语言一致性同理——`<TypeBadge>` / `<LocalDate>` 这两个原子组件一建，就同时修好了颜色漂移、
裸枚举和系统 locale 三个问题。
