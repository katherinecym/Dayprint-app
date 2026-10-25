# Dayprint 重复冗余与优化审计

> 依据：`src/` 全量静态分析，共 20,531 行。所有数字可复核，关键项附 `文件:行号`。
> 生成日期：2026-10-25

---

## 摘要

| 类别 | 规模 | 可回收 |
|---|---|---|
| 孤儿组件（无人 import） | 1,236 行 | 全部可删 |
| 双语文案硬编码三元 | 744 处（i18n 表只有 64 键） | 收敛到 1 套 |
| LLM provider 分发逻辑 | 5 个路由各写一遍 | 合并后省约 500 行 |
| 弹层壳（遮罩+关闭） | 14 份独立实现 | 抽 1 个 primitive |
| 图谱档案 + Inspector | 133 行 + 205 行两套 | 合并 1 套 |
| 颜色映射 | 5 份 `typeColorMap`（2 份从未被读） | 1 个函数 |

**保守估计**：不动功能的前提下可删掉 **2,000–2,500 行**（约 12%），并消除 3 处会真正影响用户的隐性 bug。

---

## A. 重复冗余

### A1. 双语文案：744 处内联三元 vs 64 键 i18n 表 ⭐ 最大的一笔

```
grep -c 'language === "zh"'  →  744
src/lib/i18n.ts 键数         →  64
```

最严重的 5 个文件：`GitHubSettingsModal` 89、`MemoryOSView` 89、`TodayEditor` 72、`CareerStudioModal` 44、`SmartDocumentIngestModal` 41。

同一个字符串在两处维护——`i18n.ts` 里加了一条 `t.xxx`，组件里又写一遍 `language === "zh" ? "中文" : "English"`。改文案必须全局搜中文串，漏一处就出现半中半英。

**修法**：按域拆 `i18n/{common,journal,graph,career,settings}.ts`，组件里统一 `t("journal.save")`。i18n 表已有结构，只是没人往里填。

### A2. LLM provider 分发：5 份几乎相同的实现

| 路由 | 行数 | 含 provider 分发 |
|---|---|---|
| `memory/distill` | 424 | ✅ Gemini/OpenAI/Claude/DeepSeek + 本地降级 |
| `career/generate` | 388 | ✅ 同上 |
| `memory/extract-doc` | 395 | 部分（只 Gemini） |
| `memory/polish` | 270 | ✅ 同上 |
| `translate` | 143 | ✅ 同上 |

四个端点 URL 在 5 个文件里各出现一次：`generativelanguage.googleapis.com`、`api.openai.com`、`api.anthropic.com`、`api.deepseek.com`。连"Gemini 主模型失败后回退 `gemini-2.5-flash`"这段重试逻辑都抄了两遍（`distill:121,138` 与 `career:216,233`）。

**修法**：`lib/llm.ts` 暴露 `callLLM({provider, apiKey, model, baseUrl, prompt, jsonMode})`，路由只保留 prompt 与解析。预计 5 个路由从 1,620 行降到 1,100 行左右。

### A3. 弹层壳：14 份遮罩 + 7 份 Esc 监听

每个弹层自己写 `fixed inset-0 z-[60] ... bg-black/40 backdrop-blur` + `onClick={onClose}` + `e.stopPropagation()` + 一个 `useEffect` 监听 Esc。

Esc 处理分散在 7 个文件（`OmniSearch` `ExpandedMemory` `ConnectionModal` `HeaderBar` `WeeklyDigest` `Archive` `DailyReceipt`），其中 `DailyReceiptModal` 还额外处理 ←→，`WeeklyDigestModal` 的 Esc 要判断"是否正在编辑"。

**副作用**：行为不一致——`CareerStudioModal`、`SmartDocumentIngestModal`、`MemoryOSView` 的蒸馏弹层**都没有 Esc 关闭**。

**修法**：`<Modal open onClose size>` + `useEscKey`，顺带统一焦点管理（现在没有任何一个弹层做 focus trap）。

### A4. 图谱档案（Dossier）与 Inspector：两套平行实现

| 组件 | 状态 | Dossier | Inspector |
|---|---|---|---|
| `GraphNodesView` | ✅ 在用 | 133 行（567–698） | 124 行（439–562） |
| `ConstellationModal` | ❌ 无入口 | 205 行（486–690） | 118 行（365–482） |

两套结构几乎一样（topic 目录 + summary + insights + 支撑节点），但**能力分叉**：Constellation 版多「思想演进编年史」和「Open Loops」，GraphNodesView 版没有；配色也不同（一个莫兰迪、一个黑白黄）。

**修法**：把 Constellation 版独有的两块并进 `GraphNodesView`，删掉 `ConstellationModal`（696 行）。

### A5. 颜色映射：5 份，2 份是死的，值还打架

`typeColorMap` 出现在 4 个组件里，加上 `types/memory.ts` 的 `DEFAULT_TYPE_COLORS`：

| 文件 | 是否被读 |
|---|---|
| `GraphNodesView:146` | ✅ |
| `ConstellationModal:136` | ✅（但组件不可达） |
| `ExpandedMemory:168` | ❌ 声明后从未索引 |
| `TodayEditor:423` | ❌ 声明后从未索引（实际用 `getTypeColor()`） |

而且值不一致：

| 类型 | `DEFAULT_TYPE_COLORS` | `ExpandedMemory` / `GraphNodesView` | `TodayEditor` / `Constellation` |
|---|---|---|---|
| `decision` | `#7C6F93` | **`#475569`** | `#7C6F93` |
| `collection` | `#5A7D8F` | **`#7C6F93`** | `#5A7D8F` |
| `receipt` | `#4A423D` | **`#2B2420`** | `#292524` |

结果：同一条 `decision` 记忆，在卡片流里是紫藤色，在卡片详情弹层顶部色条是深灰蓝。用户能看见的不一致。

**修法**：只留 `getTypeColor()`，删掉 4 个局部 map（约 40 行 + 3 处视觉 bug）。

### A6. 小件重复

| 重复项 | 位置 | 差异 |
|---|---|---|
| `MOOD_PRESETS` | `ContextPanel:21`、`DailyReceiptModal:30` | 前者 6 字段、后者 9 字段（多 `wash`/`shortZh`）→ 两套心情定义要同步改 |
| `compressImage` | `TodayEditor:158`、`ExpandedMemory:71` | 逐字符相同（30 行 × 2） |
| `normalizeGitHubRepo` | `GitHubSettingsModal:37`、`WelcomeGatewayModal:28` | 完全相同（9 行 × 2） |
| `verifyToken` + `handlePatChange` | 同上两个文件 | 完全相同（25 行 × 2） |
| `customPositions` 持久化 effect | `memory-context:340-343` 与 `427-431` | 两个 effect 写同一个 localStorage key |
| 类型胶囊 + 自定义类型输入 | `TodayEditor:887-965`、`ExpandedMemory:285-356` | 结构相同，样式不同 |

### A7. 死代码

| 项 | 体量 | 说明 |
|---|---|---|
| `SpatialCanvas.tsx` + `MemoryCard.tsx` | 540 行 | 互相引用，但**外部无人 import** |
| `ConstellationModal.tsx` | 696 行 | props 传了三处，无一处调用 |
| `typeColorMap` ×2 | ~20 行 | 声明后未被索引 |
| 排序分支 `by_type` / `thematic` | ~14 行 | 下拉只有 4 项 + 洗牌，这两个值永远进不来 |
| `getDailyReceipt` 的 6 个派生数组 | ~10 行/次 | `moments/ideas/learning/decisions/tomorrow/open_loops` 生成后**从未被读取**（存根弹层自己重算 `dayMems`） |
| `DailyMuseSlip.handleAiGenerate` | ~14 行 | 函数存在，无按钮绑定 |
| `layout-engine.ts` | 106 行 | 只有 `tests/memory.test.ts` 引用，产品代码零引用 |
| context 未消费字段 | — | `activeLayout` `setActiveLayout` `isQuickAddOpen` `setIsQuickAddOpen` `customPositions` `collections` `temporalLevel` `searchQuery` |

---

## B. 架构层优化点

### B1. Context 没有 memo，等于全应用重渲染 ⭐ 性能第一问题

`memory-context.tsx` 全文 **0 个 `useMemo` / `useCallback`**，Provider 直接传内联对象字面量（`:1011 value={{ ... }}`）。

后果链条：
1. `ContextPanel` 的复盘 textarea **每敲一个字**就 `saveDailyReceipt` → `storedReceipts` 变化；
2. Provider 重渲染 → `value` 是新对象 → **所有 `useMemory()` 消费者全部重渲染**；
3. 同时 `useEffect([storedReceipts])` 执行 `JSON.stringify` 整个 receipts 表并同步写 localStorage。

一个有 500 条记忆的用户，在复盘框里打字会触发 500 张卡片的重渲染 + 每字符一次全表序列化。

**修法（按收益排序）**：
1. `value` 包 `useMemo`，写操作包 `useCallback`；
2. 复盘框改 `onBlur` 或 300ms 防抖落盘；
3. 把"仅 UI 状态"（弹层开关、搜索词）拆出独立 context，避免污染数据 context。

### B2. 用 localStorage 当数据库

- 5MB 上限。图片以 base64 内联在 `memory.media_url`（压缩到 1200px/JPEG 0.8 ≈ 100–200KB）→ **约 30–50 张图就撑爆**。
- 主持久化 effect（`:322-342`）**没有 try/catch**。`QuotaExceededError` 会在 effect 里抛出 → React 报错，且用户完全无感知，以为保存成功了。
- 每次写都 `JSON.stringify(全部记忆)`。

**修法**：图片转 IndexedDB（`idb-keyval` 即可）；写入包 try/catch + 顶部 Toast「本地空间不足」；数据量超过阈值时提示导出。

### B3. 关系有两份真相，且删除时不同步 ⭐ 会出真 bug

- `memory.relations: string[]` 和 `relationships: Relationship[]` 是同一批边的两种表示。
- `addRelationship` 只往 `from` 一侧追加 `relations`，**不写 `to` 一侧** → 天然不对称。
- `deleteRelationship`（`:734`）只删 `relationships` 表，**不清理 `memory.relations`** → 断开的边仍留在卡片上，`BoogieMatrixCanvas.getConnectedMemories` 取两边并集 → 幽灵连结永远存在。

**修法**：以 `relationships` 为唯一真相，`relations` 改为派生（`useMemo` 算 Map）；或删除时双向清理。

### B4. 时间处理：三套口径 + 硬编码时区

| 位置 | 方式 | 问题 |
|---|---|---|
| `TodayEditor:338` | 硬编码 `+08:00` | 非东八区用户时间戳错 |
| `WeeklyDigestModal:98` | `toISOString()`（UTC） | 东八区周区间变"周日–周六" |
| `DailyReceiptModal:59,198` | `toISOString()`（UTC） | 凌晨 0–8 点"今天/昨天"错一天 |
| `MemoryActivityHeatmap:16` | 本地 `getFullYear/Month/Date` | ✅ 唯一正确的写法 |

**修法**：把 `getLocalDateStr` 提到 `lib/date.ts`，全站统一；时区从 `settings.time_zone` 读（这个字段已存在但没人用）。

### B5. 计算复杂度

| 位置 | 现状 | 数据量 1,000 条时 |
|---|---|---|
| `autoCompileGraphRelationships` | 双层 `for` 全量两两比较 `O(N²)`，同步执行 | ~50 万次 topic 数组交集 → 主线程卡 1–3 秒 |
| `BoogieMatrixCanvas` 排序 | `getConnectedMemories()` 在 sort 比较器里被调用（每次 O(E)） | `O(N log N × E)`，每次筛选/排序都重算 |
| `compileLLMWiki` | 在 `GraphNodesView` 顶层 `useMemo`，**即使停在"关系网络"标签也照样编译全部主题档案** | 每次记忆变动都全量重算 |
| `ForceGraphCanvas` | 每次 nodes 变化同步跑 160 次迭代 | 节点多时首帧明显卡顿 |

**修法**：补边改 `Map<topic, id[]>` 分桶（同 topic 才两两比较）；连接数预先算成 `Map<id, count>`；`compileLLMWiki` 改成 `activeTab === "wiki"` 时才计算；力导向丢 `requestIdleCallback` 或 Web Worker。

### B6. 校验边界不统一

`addMemory` 走 `CanonicalMemorySchema.parse`，但 `updateMemory` / `bulkAddRelationships` / 所有 API 路由都是直接 spread 入参。外部 `POST /api/memory/ingest` 可以塞任意结构进收件箱，前端轮询后直接 `setMemories` —— 一条畸形数据能让整页崩（`m.topics.some` 之类会抛）。

**修法**：在 ingest 的 GET 出站处和 `pullFromGitHub` 之后各做一次 `safeParse`，坏数据丢弃并计数。

### B7. 同步模型是 last-write-wins

`pullFromGitHub` 直接 `setMemories(result.data.memories)` 整体替换；推送是整包覆盖 `archive.json`。两台设备同时用 → 后写的覆盖先写的，无合并、无冲突提示。

**修法（最小成本）**：推送前比对 `updated_at` 最大值，拉取时按 id 做并集合并（`Map` 按 `updated_at` 取新）。

---

## C. 优化清单（按 ROI 排序）

| # | 动作 | 工作量 | 收益 | 风险 |
|---|---|---|---|---|
| 1 | 删孤儿：`SpatialCanvas` `MemoryCard` `ConstellationModal` `layout-engine` | 10 分钟 | −1,342 行 | 低（先 `git grep` 确认） |
| 2 | 删 4 个 `typeColorMap` + 统一 `getTypeColor` | 20 分钟 | 修 3 处颜色不一致 | 低 |
| 3 | Context `value` 加 `useMemo` + 写操作 `useCallback` | 1 小时 | 打字不再全站重渲染 | 中（注意依赖数组） |
| 4 | 复盘框加 300ms 防抖 | 15 分钟 | 每字符一次 JSON 序列化 → 每 300ms 一次 | 低 |
| 5 | 关系改为单一真相（或删除时双向清理） | 2 小时 | 消除幽灵连结 | 中 |
| 6 | 抽 `lib/llm.ts`，5 路由收敛 | 半天 | −500 行，加新 provider 只改 1 处 | 中（要逐个回归 5 条链路） |
| 7 | 抽 `<Modal>` + `useEscKey` | 2 小时 | −150 行，补齐 3 个弹层的 Esc | 低 |
| 8 | 统一日期工具 + 去硬编码 `+08:00` | 2 小时 | 修跨日/跨周错位 | 中（影响所有日期显示，要回归） |
| 9 | 图片迁 IndexedDB + 写入 try/catch | 半天 | 解决 5MB 上限与静默丢数据 | 中 |
| 10 | 双语文案收敛进 i18n | 2–3 天 | 744 → 0 处三元，改文案只改一处 | 低但量大，建议按文件分批 |
| 11 | 补边改 topic 分桶 + 档案懒计算 | 半天 | 大图谱不再卡顿 | 低 |
| 12 | 同步改并集合并 | 半天 | 多设备不丢数据 | 中 |

---

## D. 建议的重构顺序（3 个 PR，互不阻塞）

**PR 1 · 清理（半天，纯删除，零行为变化）**
删孤儿组件、死 `typeColorMap`、死排序分支、`getDailyReceipt` 的 6 个派生字段、`handleAiGenerate`、context 未消费字段。

**PR 2 · 正确性（1 天，修 4 个真 bug）**
颜色统一 → 关系删除双向清理 → 日期工具统一 → 存储写入 try/catch + 配额提示。

**PR 3 · 结构（2–3 天）**
`<Modal>` primitive → `lib/llm.ts` → Context memo 化 → i18n 分批收敛。

**不要现在做的**：i18n 全量迁移。它收益最高但风险最分散（744 处），应该等 PR3 把弹层和文案结构稳定后再一次性做，否则会边迁移边冲突。
