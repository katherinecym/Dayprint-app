# Dayprint · 交接文档（给下一个 agent 看的唯一入口）

> **如果你只读一个文件，就是这一个。**
> 读完这份之后，按 §7 的顺序再补 2 份（PRD + REFACTOR-PLAN），不需要读 TABS-SPEC / REFACTOR-AUDIT / AUDIT-VERIFICATION —— 那三份是过程记录，结论已经收进这里。

最后更新：2026-10-25

---

## 1. 这个产品是什么

Dayprint 是一个**本地优先的个人记忆工作台**。用户每天写零散日记（L0 原文），系统把它们升维成认知卡片（L1 事实 → L2 方法论 → L3 心智模型 → L4 核心价值观），再把一天压成一张「小票」（Daily Receipt）。

三个视图，不是三个 tab 而是三种**看同一批数据的方式**：

| viewMode | 名字 | 回答的问题 |
|---|---|---|
| `daily` | 今日手账（T1） | 「今天我写了什么」 |
| `memory_os` | 认知台账 / Cognitive Ledger（T2） | 「我对这条有多确定、还缺哪一半、它是从哪来的」 |
| `graph` | 拓扑索引 / Knowledge Graph（T3） | 「它连了谁、连了几条」 |

**这三个视图的分工是刻意的，不要合并它们的卡片组件。** 详见 §4.1。

---

## 2. 技术事实（先记住，省得你自己去翻）

- Next.js 16.4 App Router + React 19 + TypeScript + Tailwind v4
- **没有后端数据库**。全部状态在 `localStorage`，共 14 个 key，前缀 `dayprint_`：
  `memories` / `relationships` / `collections` / `settings` / `custom_positions` /
  `receipts` / `app_mode` / `custom_types` / `type_colors` / `sound_enabled` /
  `paper_pattern` / `active_logo` / `onboarding_completed` / `test_cleaned_v2`
- 唯一全局 store = `src/lib/memory-context.tsx` 的 `MemoryProvider` / `useMemory()`。
  **没有 Redux / Zustand，不要引入。**
- 云同步 = GitHub 私有仓库里的一个 `archive.json`（`/api/github/sync`），不是数据库
- `appMode: "demo" | "production"` —— **只切换文案与种子数据，从不切换挂载哪些组件**。
  这是刻意的：demo 与真实使用走完全同一条渲染路径，demo 能跑通就等于真实能用。
- 双语数据模型：`title` / `title_zh` / `title_en` + content 三项。读取**必须**走
  `getLocalizedTitle()` / `getLocalizedContent()`，不要直接读 `.title`。
- 测试：`vitest`，51 个用例。**注意：仓库里没有 vitest 配置文件**，所以 `@/` 别名在
  测试里不生效 —— 测试文件只能用相对路径 import，且被测模块内部也只能用相对路径
  引用**值**（type-only import 会被 esbuild 擦除，所以看起来能跑，加一个值导出就炸）。

---

## 3. 一条命令验证你没搞坏东西

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit --skipLibCheck   # 必须 exit 0
npx vitest run                                                            # 必须 51 passed
node scripts/audit-i18n.mjs                                               # 必须「✓ 无退步」
NODE_OPTIONS="--max-old-space-size=4096" npx next build                    # 必须 0 warning
```

`tsc` 直接跑会被 OOM kill（exit 137），必须带 `NODE_OPTIONS`。

`audit-i18n.mjs` 是个**棘轮**：`scripts/i18n-baseline.json` 记录当前水位，改差了就
`exit 1`。你新增 UI 文案时不要写 `language === "zh" ? ... : ...`，走 `t.xxx`
（`src/lib/i18n.ts`）。确实需要临时内联，就先 `--write-baseline` 并在 PR 里说明。

---

## 4. 绝对不要破坏的约定

### 4.1 T2 与 T3 的卡片必须长得不一样

用户明确要求过这一点。曾经两者都退化成「标题 + 正文 + 标签」的同一个骨架，
因为 PRD 里承诺的差异点**一个都没实现**（`source_ids` 有 19 处写入、0 处读取；
`confidence` 在 T2 里出现 9 次、从未渲染）。

现在它们的差异是：

| | T2 认知台账 | T3 拓扑索引 |
|---|---|---|
| 定位 | 校准工作台（可编辑） | 只读索引 |
| 卡片正文 | 有 | **没有**（纯节点索引） |
| 置信度 | 彩色进度条 + 百分比 | 无 |
| 双语完整度 | `ZH` / `EN` 缺哪个划掉哪个 | 无 |
| 溯源 | 「源自 N 条原始记录」，可展开、可点击跳转 | 无 |
| 排序 | 层级 / 搜索 | 按连接数降序 |
| 交互 | 行内编辑双语、点击关系 chip | Inspector 面板驱动 |

**不要抽一个共享的 `MemoryCardShell` 把两者合回去。** 共享 atom（颜色、徽章、
日期格式化）可以，共享卡片骨架不行。

### 4.2 日期一律用「本地日历日」

`src/lib/date.ts` 是唯一真源。**不要写 `toISOString().slice(0,10)`**，也不要用
`occurred_at.slice(0,10)`（对旧数据里 Z 结尾的串会算错一天）。用 `dateKeyOf()` /
`todayKey()` / `localDayKey()`。

这条规矩是用一串真实 bug 换来的：东八区下本地 00:00–07:59 的记录会被归到前一天，
导致小票条目变 0、周报把周一算进上一周、月报在每月 1 号早上丢掉整月数据。

### 4.3 弹窗一律走 `useModalDismiss(onClose)`

`src/lib/use-modal-dismiss.ts` 负责 Esc 关闭 + 背景滚动锁（带引用计数，支持嵌套）。
不要自己再 `addEventListener("keydown")` —— 之前 10 个弹窗里有 5 个压根没接 Esc，
而且**没有任何一个**锁背景滚动。

### 4.4 模态层级与背景统一

- z-index：普通弹窗 `z-[60]`，命令面板 `z-[70]`
- 背景：`bg-stone-900/55 backdrop-blur-xs`（新增弹窗请沿用）
- 现存 3 处历史不一致（`z-50` / `bg-black/40` / `bg-black/60` / `backdrop-blur-sm`）
  尚未清理，属于已知债务，见 §8

### 4.5 demo 数据必须是虚构人设

演示数据的人设是虚构的 **Alex Reed（Systems Architect）**。**绝不能**出现真实姓名、
真实雇主、真实联系方式。`src/tests/seed-integrity.test.ts` 里有断言守着这条红线。

---

## 5. 本轮已完成（2026-10-25）

### 5.1 demo 模式数据（用户直接提的三件事）

| 问题 | 根因 | 状态 |
|---|---|---|
| Mood Wash 只有一种心情 | `loadDemoData` 把 receipts 设成 `{}`，每天回落同一个默认值 | ✅ 现在 5 种心情，85 天全覆盖 |
| 小票内容太少 | 只有 9 天 / 12 条 | ✅ **136 条记忆 / 86 天**（8/1 → 今天） |
| TOTAL RECORDED 是空的 | ① `occurred_at` 用 UTC 写，本地早上被归到前一天；② `allRecordedDates` 无条件把 `selectedDate` 塞进去，凭空造出 0 条记录的小票；③ 记忆窗口到 11 天前、小票窗口到 2 天前，中间 9 天必然空 | ✅ 三处全修，现在 **0 张空小票**（有测试守着） |
| 用了真人数据 | — | ✅ 全部替换为虚构人设 |

顺带修掉两个会随时间爆的坑：

- **`getDemoWindow()`**：原来 `new Date(y, 7, 1)` 表示「今年 8 月 1 日」。**1–7 月启动时
  这个日期在未来**，`start > end`，长尾和小票**双双返回空** —— 也就是说如果一月上线，
  demo 直接没有历史。现在会回退到去年 8 月，并封顶 120 天。
- **补种条件**：原来是「只要存在任意 `mem_demo_*` 就跳过」，导致老 demo 用户永远拿不到
  新增的种子数据。现在按 id 求差集补。

### 5.2 数据完整性测试

新增 `src/tests/seed-integrity.test.ts`（11 个用例），守：id 唯一、`source_ids` 与
`relations` 无悬空引用、双语字段齐全、日期无空洞、无空小票、心情有变化、反思占比合理、
时间跨度够、无人设泄漏。

新增 `src/tests/date.test.ts`（14 个用例）守本地日历日与周区间。

### 5.3 溯源链（T2 的核心差异化）

- `handleAcceptCandidate` 现在把 distill API 返回的 `derived_from_titles` 映射回真实
  memory id 写进 `source_ids`（此前恒为 `[]`）
- T2 卡片新增「源自 N 条原始记录」可展开列表，点击跳转到原始记忆
- demo 种子里有 4 条认知带真实溯源链

### 5.4 去重与抽离

| 抽到哪 | 干掉了什么 |
|---|---|
| `lib/date.ts` | 12 处 `occurred_at.slice(0,10)` + 1 处 UTC 周区间 |
| `lib/moods.ts` | 2 份 `MOOD_PRESETS`（字段各有缺失，`descEn` 只在其中一份）+ 2 份模糊匹配逻辑 |
| `lib/use-modal-dismiss.ts` | 5 个弹窗缺失的 Esc + 全部 10 个弹窗缺失的滚动锁 |
| `lib/image.ts` | 2 份逐字节相同的 `compressImage`（35 行 ×2），并修掉 `getContext` 返回 null 时静默产出白图 |
| `lib/github-repo.ts` | 2 份相同的 `normalizeGitHubRepo` |
| `lib/i18n.ts` `localeOf()` / `htmlLangOf()` | 5 处裸 `toLocale*String()` + 内联 locale 三元 |
| `lib/date.ts` `getWeekRange()` | 周报的 UTC 周区间（此前把周一算进上一周，七个日列整体错位一天） |

### 5.5 i18n

- `<html lang>` 现在跟随语言切换（`LocaleHtmlLang` + `htmlLangOf()`）
- `[未翻译]` 标记的判据从「只要含中文就打标」改为「中文占比超过拉丁字母」，避免
  `"Fullstack engineering preference (置信度: 80%)"` 被误判
- translator 不再把中文回填进 `title_en` / `content_en`（这是数据污染的源头）
- 内联三元 **747 → 741**，棘轮基线已重置

### 5.6 其他

- 周报 / 月报 / 述职报告的日期改为**客户端传自己的日历日**给 API，不再用服务器时区
- `obsidian-sync` 路由标注 `runtime = "nodejs"` + `turbopackIgnore`，消除
  「Dynamic filesystem access traces the whole project」部署告警（此前会把 public/ 和
  全部源码打进 server bundle）
- 审计脚本改为**先剥注释再扫**：否则在注释里写 `toLocaleDateString()` 会被当成真实调用，
  于是「修好问题」反而让指标变差

---

## 6. 仍未完成（按优先级）

### P0 — 上线前必须

1. **`<html lang>` 的 SSR 首帧**：现在是 `lang="en"` 硬编码 + 客户端 effect 纠正。
   中文用户的屏幕阅读器在首帧会读错。彻底解法是 middleware 读 cookie 决定 lang，
   但这会引入 cookie 同步问题。当前方案是**可接受的取舍**，但要知道它存在。
2. **`memory-context` 没有 memo**：provider 每次渲染都新建 context value 对象。
   真正的解法是**拆 context**（data / UI / settings 三个），不是加 `useMemo` ——
   因为 value 里 ~20 个函数都没 `useCallback`，只加 `useMemo` 等于没加。
   这是一次有风险的架构改动，**单独一轮做**，别和其他改动混在一起。

### P1

3. **`lib/llm.ts` 传输层抽离**：5 个 API 路由（distill / career / polish / translate /
   extract-doc）各自实现 provider 分发。**注意：真正能共享的只有约 60 行 HTTP 传输层**，
   不是「省 500 行」。distill 与 career 的核心逻辑 190 行里有 149 行不同（prompt、
   temperature 0.2 vs 0.3、JSON 解析、响应结构）。别按「重复代码」去合它们。
4. **弹窗视觉统一**：3 种 z-index、6 种背景不透明度、2 种 blur、3 种对齐、2 种关闭策略。
   抽 `ModalShell` 时注意 `DailyReceiptModal`（全幅横向轮播）、`OmniSearchModal`
   （顶部对齐命令面板）、`ConstellationModal`（全幅画布）需要 variant 支持。
5. **`ModalShell` 抽离后**，把 `useModalDismiss` 收进去。

### P2

6. **`i18n.ts` 不支持插值**。现在是 `t.xxx` 拼字符串（`{t.derived_from} {n} {t.raw_entries_many}`），
   中文语序凑合能用，但英文单复数要靠 `_one` / `_many` 两个 key 手动选。要彻底解决得
   让 `t` 支持参数，但那会动 ~26 个调用点。
7. **32 个 i18n key 从未被消费**（62 个里只有 30 个在用，48%）。要么接上，要么删掉 ——
   留着会让人以为改了 key 就会生效。
8. **`source_ids` 反查只做了 T2 卡片这一处**。PRD 里还承诺了从图谱节点反查，未做。

---

## 7. 阅读顺序（除本文外只需要 2 份）

1. **本文** —— 你已经读完了
2. `PRD-Dayprint-NextGen.md` —— 产品意图。**重点读 §3.2（T2 校准工作台）与 §3.3（T3 拓扑索引）**，
   这两节定义了「为什么两个视图不能合并」。其余章节可按需查。
3. `REFACTOR-PLAN.md` —— 每一处改动的**理由与取舍**，包括我推翻自己早先结论的地方
   （§2.0 明确撤回「抽共享卡片骨架」的建议）。

**不需要读**：`TABS-SPEC.md`（每个视图的功能清单，已被本文 §1 概括）、
`REFACTOR-AUDIT.md` / `AUDIT-VERIFICATION.md`（审计过程与自我纠错记录，结论已并入本文 §5–6）。

如果你要动 demo 数据，先读 `src/lib/seed.ts` 顶部注释和 `src/tests/seed-integrity.test.ts` ——
测试会告诉你哪些不变量不能破。

---

## 8. 已知取舍（我主动决定不做的）

- **没做 context 拆分**：收益是真实的（现在任何 state 变化都会重渲染全部消费者），
  但风险也真实（20 个函数要加 `useCallback`，漏一个就是 stale closure）。P0-2 记录了做法。
- **没合 5 个 API 路由**：核对了 190 行里的 149 行，它们**本来就不该合**。硬合会造出一个
  充满 `if (provider === ...)` 的怪物。只值得抽 60 行传输层。
- **没有视觉回归测试**：本机无头 Chrome 连不上 CDN（`curl` 能通但 Chrome 走系统代理，
  表现为页面永远 `readyState: "loading"`，症状和「产物坏了」一模一样，极易误判）。
  所以本轮所有验证都是**类型 + 单测 + 构建 + 数据断言**，没有像素级确认。
  **建议在真机上过一遍 6 个弹窗和 3 个视图**。
