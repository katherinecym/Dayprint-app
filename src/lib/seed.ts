import {
  CanonicalMemory,
  Relationship,
  Collection,
  DailyReceipt,
  MemoryType,
  MemoryLevel,
  DEFAULT_TYPE_COLORS,
} from "../types/memory";
import { toLocalIso, localDayKey } from "./date";

/**
 * Dynamic date offset generator relative to the execution timestamp.
 * Guarantees that the current week, today, and recent days are densely populated
 * with memories, making Weekly Digest, Daily Journal, and Activity Heatmap rich and lively.
 *
 * ⚠ 必须输出「带本地时区偏移」的 ISO 字符串（见 lib/date.ts 的说明），
 * 而不是 toISOString() 的 UTC 形式，否则按天分组会错位。
 */
function getOffsetIso(daysAgo: number, hours = 14, minutes = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return toLocalIso(d);
}

/** 稳定伪随机：同一个字符串永远得到同一串数，保证 demo 数据跨刷新不变 */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the canonical mock demo dataset for Dayprint.
 * 100% Mock / Fictional Persona Data: "Alex Reed", Systems Architect & Creative Technologist.
 * ZERO personal / real user data.
 */
export function getDynamicSeedMemories(): CanonicalMemory[] {
  return [
    {
      schema_version: "1.0",
      id: "mem_demo_01",
      type: "idea",
      title: "AetherOS 个人认知与数字分身系统架构实践",
      title_zh: "AetherOS 个人认知与数字分身系统架构实践",
      title_en: "AetherOS Cognitive Digital Sub-Myself Architecture & Human-in-the-Loop",
      content: "规划并主导 AetherOS 个人认知系统的整体产品架构。底层基于本地大语言模型与认知代理，设计 Human-in-the-Loop 记忆提炼流：日常散落随笔 -> 智能提炼认知卡片 -> 主动生成双向链接 -> 一键沉淀入库，实现零干扰、可控性强的个人知识资产闭环。",
      content_zh: "规划并主导 AetherOS 个人认知系统的整体产品架构。底层基于本地大语言模型与认知代理，设计 Human-in-the-Loop 记忆提炼流：日常散落随笔 -> 智能提炼认知卡片 -> 主动生成双向链接 -> 一键沉淀入库，实现零干扰、可控性强的个人知识资产闭环。",
      content_en: "Architected the AetherOS personal cognitive operating system. Designed a Human-in-the-Loop memory distillation workflow: casual thoughts and work logs -> autonomous LLM extraction of cognitive slips -> proactive bi-directional link suggestions -> one-click verification into local storage, establishing a high-signal living digital twin.",
      language: "zh",
      occurred_at: getOffsetIso(0, 15, 30), // Today afternoon
      recorded_at: getOffsetIso(0, 15, 30),
      updated_at: getOffsetIso(0, 15, 30),
      topics: ["aether-os", "architecture", "digital-sub-myself", "local-first"],
      source_ids: [],
      relations: ["mem_demo_02", "mem_demo_08", "mem_demo_09", "mem_demo_07"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/02_Architecture.md",
      },
      color_accent: "#C97A63",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_02",
      type: "decision",
      title: "架构聚焦与高阶精力管理：践行群岛原则",
      title_zh: "架构聚焦与高阶精力管理：践行群岛原则",
      title_en: "Architecture Focus & The Archipelago Principle: Eliminating Low-Density Noise",
      content: "早期系统开发中职责边界模糊容易导致注意力碎片化。确立「群岛原则（Archipelago Principle）」：将 100% 认知精力倾注于高杠杆系统架构、核心心智模型与人机交互打磨，系统性拒绝无意义的低密度社交与会议消耗，显著提升产品迭代速率与代码纯度。",
      content_zh: "早期系统开发中职责边界模糊容易导致注意力碎片化。确立「群岛原则（Archipelago Principle）」：将 100% 认知精力倾注于高杠杆系统架构、核心心智模型与人机交互打磨，系统性拒绝无意义的低密度社交与会议消耗，显著提升产品迭代速率与代码纯度。",
      content_en: "Early-stage development often suffers from blurred boundaries and context-switching fatigue. Established the 'Archipelago Principle': allocate 100% of cognitive bandwidth to high-leverage system architecture, core mental models, and tactile UX craftsmanship while systematically eliminating low-density meetings and social noise.",
      language: "zh",
      occurred_at: getOffsetIso(0, 9, 15), // Today morning
      recorded_at: getOffsetIso(0, 9, 15),
      updated_at: getOffsetIso(0, 9, 15),
      topics: ["decision", "deep-work", "principles", "focus"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_05", "mem_demo_12"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/01_Decisions.md",
      },
      color_accent: "#7C6F93",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_03",
      type: "learning",
      title: "技术选型 SOP：GitHub 活跃度与本地压测双重验证",
      title_zh: "技术选型 SOP：GitHub 活跃度与本地压测双重验证",
      title_en: "Technology Selection SOP: GitHub Health & Local Stress Testing",
      content: "建立严谨的技术选型四步法：1. 分析 GitHub 长期 commit 频率与 PR 合并延迟；2. 检验 issue 响应速度与维护团队信噪比；3. 构建独立测试床进行边界压测；4. 核心禁忌：绝不迷信官方宣传文案与跑分演示，一切以本地物理基准与真实负载为准。",
      content_zh: "建立严谨的技术选型四步法：1. 分析 GitHub 长期 commit 频率与 PR 合并延迟；2. 检验 issue 响应速度与维护团队信噪比；3. 构建独立测试床进行边界压测；4. 核心禁忌：绝不迷信官方宣传文案与跑分演示，一切以本地物理基准与真实负载为准。",
      content_en: "Formulated a disciplined 4-step technology evaluation SOP: 1. Audit long-term commit velocity and PR merge latency on GitHub; 2. Assess issue response quality and maintainer signal-to-noise ratio; 3. Build an isolated local testbed to stress-test edge conditions; 4. Core rule: Never trust marketing claims or vendor benchmarks without empirical verification.",
      language: "zh",
      occurred_at: getOffsetIso(1, 16, 40), // Yesterday
      recorded_at: getOffsetIso(1, 16, 40),
      updated_at: getOffsetIso(1, 16, 40),
      topics: ["engineering", "methodology", "benchmarking", "habits"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_11", "mem_demo_06"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/03_Engineering.md",
      },
      color_accent: "#5B7B94",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_04",
      type: "idea",
      title: "底层价值观：智识自主权与第一性原理思辨",
      title_zh: "底层价值观：智识自主权与第一性原理思辨",
      title_en: "Foundational Value: Intellectual Autonomy & First-Principles Reasoning",
      content: "在模型泛滥与观点同质化的时代，外界信息极其廉价且充斥杂音。唯有依托第一性原理推导的心智模型和亲身实证，才能筑起不可动摇的个人护城河。坚持白盒可控性与真正的用户数据主权，不做被动的信息搬运工。",
      content_zh: "在模型泛滥与观点同质化的时代，外界信息极其廉价且充斥杂音。唯有依托第一性原理推导的心智模型和亲身实证，才能筑起不可动摇的个人护城河。坚持白盒可控性与真正的用户数据主权，不做被动的信息搬运工。",
      content_en: "In an era of cognitive homogenization and automated content, external opinions are cheap and noisy. Only proprietary mental models derived from first principles and empirical experience form an enduring intellectual moat. Champion white-box auditability and sovereign user data ownership.",
      language: "zh",
      occurred_at: getOffsetIso(1, 10, 20), // Yesterday
      recorded_at: getOffsetIso(1, 10, 20),
      updated_at: getOffsetIso(1, 10, 20),
      topics: ["values", "first-principles", "intellectual-autonomy", "philosophy"],
      source_ids: ["mem_demo_01", "mem_demo_02", "mem_demo_09"],
      relations: ["mem_demo_09", "mem_demo_11"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/01_Values.md",
      },
      color_accent: "#C49A56",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_05",
      type: "moment",
      title: "沟通哲学：极简、高信噪比与直击根因",
      title_zh: "沟通哲学：极简、高信噪比与直击根因",
      title_en: "Communication Philosophy: High-Density Signal & Root-Cause Directness",
      content: "日常交流与工程协作始终奉行极简与高信息密度。厌恶低信噪比的冗余客套与过度包装，主张开门见山直击因果链条与核心瓶颈。“删除冗余是最高阶的优雅（Deletion is the ultimate sophistication）”，在代码重构、产品设计与日常决策中皆奉此道。",
      content_zh: "日常交流与工程协作始终奉行极简与高信息密度。厌恶低信噪比的冗余客套与过度包装，主张开门见山直击因果链条与核心瓶颈。“删除冗余是最高阶的优雅（Deletion is the ultimate sophistication）”，在代码重构、产品设计与日常决策中皆奉此道。",
      content_en: "Adhere strictly to high-density, low-fluff communication in both engineering and leadership. Cut straight to root causes, causal chains, and verifiable metrics. Deletion is the ultimate sophistication across code refactoring, system architecture, and daily routines.",
      language: "zh",
      occurred_at: getOffsetIso(2, 14, 15), // 2 days ago
      recorded_at: getOffsetIso(2, 14, 15),
      updated_at: getOffsetIso(2, 14, 15),
      topics: ["communication", "minimalism", "habits", "principles"],
      source_ids: ["mem_demo_02", "mem_demo_09"],
      relations: ["mem_demo_02", "mem_demo_12", "mem_demo_07"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/04_Habits.md",
      },
      color_accent: "#57524E",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_06",
      type: "learning",
      title: "算法推演：非线性凸性与动态系统中的数值收敛",
      title_zh: "算法推演：非线性凸性与动态系统中的数值收敛",
      title_en: "Algorithm Study: Non-linear Convexity & Numerical Convergence in Dynamic Systems",
      content: "推导非线性动力系统中的凸性（Convexity）曲率与收敛边界。在多变量状态转移模型中，局部极值逼近必须采用阻尼牛顿迭代法进行步长校准。理论启示：认知进化正如数值求根，无法依靠单次跃迁，而是通过连续的微观反馈逐步逼近真实解。",
      content_zh: "推导非线性动力系统中的凸性（Convexity）曲率与收敛边界。在多变量状态转移模型中，局部极值逼近必须采用阻尼牛顿迭代法进行步长校准。理论启示：认知进化正如数值求根，无法依靠单次跃迁，而是通过连续的微观反馈逐步逼近真实解。",
      content_en: "Derived curvature properties and convergence boundaries in non-linear dynamic systems. Proved that local optimum convergence requires damped Newton-Raphson step-size calibration. Conceptual insight: cognitive evolution mirrors numerical solvers—it requires continuous micro-feedback loops rather than abrupt speculative leaps.",
      language: "zh",
      occurred_at: getOffsetIso(3, 11, 30), // 3 days ago
      recorded_at: getOffsetIso(3, 11, 30),
      updated_at: getOffsetIso(3, 11, 30),
      topics: ["algorithms", "mathematics", "learning", "systems"],
      source_ids: [],
      relations: ["mem_demo_08", "mem_demo_03"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/03_Algorithms.md",
      },
      color_accent: "#608066",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_07",
      type: "idea",
      title: "通感美学：将纸张质感与机械音效注入数字界面",
      title_zh: "通感美学：将纸张质感与机械音效注入数字界面",
      title_en: "Synesthetic Aesthetics: Bringing Tactile Paper Warmth to Digital Interfaces",
      content: "优秀的人机交互应当遵循维科与李白的通感联觉原理：界面不应是冰冷的玻璃平面，而应具备物理世界的温度与阻尼。通过莫兰迪矿物纸张纹理、锯齿边缘撕裂动效与机械打字机微音效，将枯燥的备忘记录升华为令人愉悦的心灵仪式。",
      content_zh: "优秀的人机交互应当遵循维科与李白的通感联觉原理：界面不应是冰冷的玻璃平面，而应具备物理世界的温度与阻尼。通过莫兰迪矿物纸张纹理、锯齿边缘撕裂动效与机械打字机微音效，将枯燥的备忘记录升华为令人愉悦的心灵仪式。",
      content_en: "Human-computer interaction should embrace sensory synesthesia: interfaces must transcend sterile glass rectangles to evoke the tactile friction of the physical world. By combining Morandi paper textures, serrated tear animations, and mechanical keystroke acoustics, note-taking transforms into a grounding ritual.",
      language: "zh",
      occurred_at: getOffsetIso(4, 17, 0), // 4 days ago
      recorded_at: getOffsetIso(4, 17, 0),
      updated_at: getOffsetIso(4, 17, 0),
      topics: ["design", "synesthesia", "tactile-ui", "aesthetics"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_10", "mem_demo_05"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/05_Aesthetics.md",
      },
      color_accent: "#C97A63",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_08",
      type: "achievement",
      title: "里程碑：自主研发离线双向链接与图谱编译引擎",
      title_zh: "里程碑：自主研发离线双向链接与图谱编译引擎",
      title_en: "Milestone: Shipped Offline Bi-directional Linking & Constellation Compiler",
      content: "自主完成知识图谱编译引擎研发，支持毫秒级解析 [[Wiki-Links]] 与跨条目概念共鸣。结合力导向排布算法与拓扑聚类，将散落在日记、读书笔记与工作决策中的孤岛碎片实时编译为可交互的神经星轨图谱。",
      content_zh: "自主完成知识图谱编译引擎研发，支持毫秒级解析 [[Wiki-Links]] 与跨条目概念共鸣。结合力导向排布算法与拓扑聚类，将散落在日记、读书笔记与工作决策中的孤岛碎片实时编译为可交互的神经星轨图谱。",
      content_en: "Engineered an autonomous knowledge compilation engine supporting sub-millisecond [[Wiki-Links]] resolution and semantic resonance detection. Coupled with force-directed physics and topological clustering, isolated daily notes assemble into an interactive neural constellation.",
      language: "zh",
      occurred_at: getOffsetIso(5, 15, 45), // 5 days ago
      recorded_at: getOffsetIso(5, 15, 45),
      updated_at: getOffsetIso(5, 15, 45),
      topics: ["milestone", "knowledge-graph", "engineering", "achievement"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_12", "mem_demo_06", "mem_demo_09"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/02_Milestones.md",
      },
      color_accent: "#A66B4E",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_09",
      type: "decision",
      title: "数据主权：以用户私有 Git 树为核心存储底座",
      title_zh: "数据主权：以用户私有 Git 树为核心存储底座",
      title_en: "Data Sovereignty: User-Owned Git Trees Over Proprietary Cloud Silos",
      content: "做出关键持久化决策：放弃托管式集中黑盒数据库，全面采用用户本地文件系统与私有 GitHub 仓库作为主存储。虽牺牲毫秒级即时推送，但彻底赢得不可篡改的版本树、明文 Markdown 可读性以及 100% 的个人记忆主权。",
      content_zh: "做出关键持久化决策：放弃托管式集中黑盒数据库，全面采用用户本地文件系统与私有 GitHub 仓库作为主存储。虽牺牲毫秒级即时推送，但彻底赢得不可篡改的版本树、明文 Markdown 可读性以及 100% 的个人记忆主权。",
      content_en: "Made a load-bearing persistence decision: rejected proprietary cloud databases in favor of local Markdown and user-owned private GitHub repositories. Traded microsecond cloud sync for tamper-evident commit trees, human-readable data longevity, and uncompromised privacy.",
      language: "zh",
      occurred_at: getOffsetIso(6, 13, 20), // 6 days ago
      recorded_at: getOffsetIso(6, 13, 20),
      updated_at: getOffsetIso(6, 13, 20),
      topics: ["local-first", "git", "architecture", "privacy"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_04", "mem_demo_08"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/01_Decisions.md",
      },
      color_accent: "#5B7B94",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_10",
      type: "moment",
      title: "晨间认知仪式：15 分钟无阻力意识流倾泻",
      title_zh: "晨间认知仪式：15 分钟无阻力意识流倾泻",
      title_en: "Morning Cognitive Ritual: 15-Minute Frictionless Stream-of-Consciousness",
      content: "清晨 7:30，手冲一杯耶加雪菲。打开 Dayprint 输入框，不设任何标题与文件夹分类，直接将刚苏醒时大脑中无序涌现的灵感、梦境余波与当日优先项倾泻在画布上。敲击回车，伴随机械清脆声，思绪瞬间定格成一页实体小票。",
      content_zh: "清晨 7:30，手冲一杯耶加雪菲。打开 Dayprint 输入框，不设任何标题与文件夹分类，直接将刚苏醒时大脑中无序涌现的灵感、梦境余波与当日优先项倾泻在画布上。敲击回车，伴随机械清脆声，思绪瞬间定格成一页实体小票。",
      content_en: "7:30 AM. Fresh cup of pour-over coffee. Opened Dayprint with zero title pressure or folder taxonomy, dumping waking thoughts, dream fragments, and daily focus areas onto the blank stream. Pressing Enter with a crisp mechanical strike seals the moment onto paper.",
      language: "zh",
      occurred_at: getOffsetIso(0, 7, 45), // Today early morning
      recorded_at: getOffsetIso(0, 7, 45),
      updated_at: getOffsetIso(0, 7, 45),
      topics: ["routine", "habits", "morning-ritual", "stream"],
      source_ids: [],
      relations: ["mem_demo_01", "mem_demo_07"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/04_Routines.md",
      },
      color_accent: "#C49A56",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_11",
      type: "learning",
      title: "系统拆解法：复杂分布式架构的第一性原理降维",
      title_zh: "系统拆解法：复杂分布式架构的第一性原理降维",
      title_en: "Systems Heuristic: Deconstructing Complex Distributed Systems to First Principles",
      content: "学习并总结复杂系统的降维法则：当架构变得臃肿混乱时，回归最底层的三要素——状态所有权、不可变事件日志与失败隔离边界。一切高大上的抽象若无法映射到这三点，皆属于无谓的自嗨式复杂度。",
      content_zh: "学习并总结复杂系统的降维法则：当架构变得臃肿混乱时，回归最底层的三要素——状态所有权、不可变事件日志与失败隔离边界。一切高大上的抽象若无法映射到这三点，皆属于无谓的自嗨式复杂度。",
      content_en: "Distilled an architectural reduction heuristic: when complex systems become bloated, strip them down to three fundamental primitives—state ownership, immutable event logs, and failure isolation boundaries. Any abstraction that fails to map cleanly is gratuitous complexity.",
      language: "zh",
      occurred_at: getOffsetIso(8, 16, 0), // 8 days ago
      recorded_at: getOffsetIso(8, 16, 0),
      updated_at: getOffsetIso(8, 16, 0),
      topics: ["architecture", "learning", "systems", "mental-models"],
      source_ids: ["mem_demo_03", "mem_demo_06"],
      relations: ["mem_demo_03", "mem_demo_04"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/03_Systems.md",
      },
      color_accent: "#7C6F93",
    },
    {
      schema_version: "1.0",
      id: "mem_demo_12",
      type: "plan",
      title: "周度复盘演进计划：修剪冗余节点与加固核心连接",
      title_zh: "周度复盘演进计划：修剪冗余节点与加固核心连接",
      title_en: "Weekly Review Cadence: Pruning Graph Dead Weight & Reinforcing Core Bridges",
      content: "制定周度知识沉淀规范：每周日晚利用 Dayprint 周报模块自动萃取本周高光条目，通过 AI 述职润色提炼 STAR 结构，同时在关系图谱中排查无连接的孤立节点，手动补全关联原因，保持认知网络的生命力。",
      content_zh: "制定周度知识沉淀规范：每周日晚利用 Dayprint 周报模块自动萃取本周高光条目，通过 AI 述职润色提炼 STAR 结构，同时在关系图谱中排查无连接的孤立节点，手动补全关联原因，保持认知网络的生命力。",
      content_en: "Established a weekly knowledge hygiene workflow: every Sunday evening, use Dayprint's Weekly Digest to synthesize milestones into STAR accomplishment bullets, prune disconnected nodes in the graph, and articulate latent relationship reasons.",
      language: "zh",
      occurred_at: getOffsetIso(9, 19, 30), // 9 days ago
      recorded_at: getOffsetIso(9, 19, 30),
      updated_at: getOffsetIso(9, 19, 30),
      topics: ["weekly-review", "planning", "habits", "growth"],
      source_ids: ["mem_demo_07", "mem_demo_08", "mem_demo_10"],
      relations: ["mem_demo_02", "mem_demo_05", "mem_demo_08"],
      confidence: 0.95,
      status: "active",
      provenance: {
        capture_method: "manual",
        ai_generated: false,
        source: "vault/01_Plans.md",
      },
      color_accent: "#608066",
    },
  ];
}

interface DemoEntry {
  type: MemoryType;
  tZh: string;
  tEn: string;
  cZh: string;
  cEn: string;
  topics: string[];
  confidence?: number;
}

const DEFAULT_LEVEL_BY_TYPE: Record<MemoryType, MemoryLevel> = {
  moment: "L0",
  plan: "L1",
  achievement: "L1",
  learning: "L2",
  idea: "L2",
  decision: "L3",
  fact: "L2",
  collection: "L2",
  receipt: "L0",
  generic: "L0",
};

/**
 * 长尾演示语料池（虚构人物 Alex Reed，系统架构师 / 创意技术人）。
 * 全部为虚构事件，不映射任何真实个人经历。
 * 分布刻意偏向 moment / plan —— 真实的日记本来就是碎片刻多、长思考少。
 */
const DEMO_POOL: DemoEntry[] = [
  // ---- moment: 日常肌理 ----
  { type: "moment", tZh: "在楼下咖啡店坐了一小时，把本周的待办重排了一遍", tEn: "An hour at the café downstairs, reordering this week's tasks", cZh: "点了一杯手冲，把便利贴全摊在桌上。删掉三条、合并两条，剩下的反而更长了——但顺序清楚多了。", cEn: "Ordered a pour-over and spread every sticky note across the table. Deleted three, merged two, and the list somehow got longer — but the order finally made sense.", topics: ["routine", "planning"] },
  { type: "moment", tZh: "晨跑五公里，耳机里是去年听过的那张专辑", tEn: "Five-kilometre morning run with an album from last year", cZh: "同一张专辑，去年听是背景音，今天突然听清了第二段的贝斯。", cEn: "Same album as last year. Back then it was background noise; today the bass line in the second track suddenly surfaced.", topics: ["running", "music"] },
  { type: "moment", tZh: "把书架上三本读到一半的书并排放好，决定先读完最薄的那本", tEn: "Lined up three half-read books and picked the thinnest one", cZh: "同时读三本的结果是三本都停在第三章。", cEn: "Reading three books at once meant all three stalled at chapter three.", topics: ["reading", "habits"] },
  { type: "moment", tZh: "雨下了一整天，窗台上的薄荷被淋得东倒西歪", tEn: "Rained all day; the mint on the windowsill got knocked sideways", cZh: "没做什么正事，只是听着雨改了两处文案。", cEn: "Got nothing serious done — just rewrote two lines of copy while listening to the rain.", topics: ["weather", "routine"] },
  { type: "moment", tZh: "深夜十一点，把桌面的线全收进抽屉，思路突然清楚了", tEn: "At eleven at night I tidied every cable into a drawer and my head cleared", cZh: "物理上的杂乱和思路的杂乱，原来真的是同一件事。", cEn: "Physical clutter and mental clutter turned out to be the same thing.", topics: ["environment", "focus"] },
  { type: "moment", tZh: "在旧书店淘到一本 1987 年的设计几何学，扉页有前主人的铅笔批注", tEn: "Found a 1987 book on design geometry with a stranger's pencil notes inside", cZh: "批注比正文有意思。他在讲黄金分割那页写了句「太整齐反而不像活的」。", cEn: "The marginalia were better than the text. Next to the golden-ratio page he had written: 'too tidy stops feeling alive'.", topics: ["books", "design"] },
  { type: "moment", tZh: "地铁上没看手机，只是看着隧道灯一盏一盏过去", tEn: "Didn't touch my phone on the subway, just watched the tunnel lights pass", cZh: "二十分钟里想通了一个卡了两天的接口设计。", cEn: "Twenty minutes of doing nothing untangled an interface design I'd been stuck on for two days.", topics: ["commute", "thinking"] },
  { type: "moment", tZh: "给三盆植物换了土，手上全是泥，心情意外地好", tEn: "Repotted three plants; hands covered in soil, mood unexpectedly good", cZh: "很久没有一件事是「做完就是做完」的了。", cEn: "It had been a long time since anything was simply finished when it was finished.", topics: ["plants", "offline"] },
  { type: "moment", tZh: "晚饭后散步四十分钟，路过一家还开着的唱片店", tEn: "Forty-minute walk after dinner, passed a record shop still open", cZh: "没买，只是翻了十分钟的封套。", cEn: "Didn't buy anything, just flipped through sleeves for ten minutes.", topics: ["walking", "music"] },
  { type: "moment", tZh: "关掉所有通知，安静地写了两小时代码", tEn: "Turned off every notification and wrote code quietly for two hours", cZh: "两小时的产出超过之前一整天。", cEn: "Two hours produced more than the previous full day.", topics: ["focus", "coding"] },
  { type: "moment", tZh: "楼顶看日落，云被风撕成一片一片", tEn: "Watched the sunset from the rooftop, clouds torn into strips", cZh: "拍了很多张，没有一张能还原那个颜色。", cEn: "Took a dozen photos; none of them came close to the actual colour.", topics: ["sky", "offline"] },
  { type: "moment", tZh: "煮了一锅汤，等它收汁的四十分钟里读完了两章", tEn: "Made a pot of soup and finished two chapters while it reduced", cZh: "「等待」原来是可以被利用的时间，不是被浪费的时间。", cEn: "Waiting turned out to be usable time, not wasted time.", topics: ["cooking", "reading"] },
  { type: "moment", tZh: "整理相册时发现一张三年前拍的空椅子", tEn: "Sorting photos, found an empty chair I shot three years ago", cZh: "完全不记得为什么拍它，但一眼就知道当时一定有什么。", cEn: "No memory of why I took it, but one look told me something had been there.", topics: ["photos", "memory"] },
  { type: "moment", tZh: "换了张新桌垫，写字的手感一下不一样了", tEn: "Swapped the desk mat and writing suddenly felt different", cZh: "材质对行为的影响，比想象中大得多。", cEn: "Material changes behaviour far more than I expected.", topics: ["environment", "design"] },
  { type: "moment", tZh: "凌晨的便利店，只有关东煮的锅在冒热气", tEn: "The convenience store at midnight, only the oden pot steaming", cZh: "加班回家的路上，站着吃完了两串萝卜。", cEn: "On the way home from overtime, ate two skewers of daikon standing up.", topics: ["late-night", "routine"] },
  { type: "moment", tZh: "在公园长椅上坐了半小时，看别人遛狗", tEn: "Half an hour on a park bench watching people walk their dogs", cZh: "什么都没想，这是这周最有效的休息。", cEn: "Thought about nothing. Best rest of the week.", topics: ["rest", "offline"] },
  { type: "moment", tZh: "把旧键盘拆开清了一遍灰，敲击声变脆了", tEn: "Took the old keyboard apart and cleaned it; the keys sound crisper", cZh: "顺便发现键帽底下有一层不知道哪年的咖啡渍。", cEn: "Also found a layer of coffee stains of unknown vintage under the keycaps.", topics: ["hardware", "maintenance"] },
  { type: "moment", tZh: "第一次自己磨咖啡豆，粗细没掌握好，但味道还行", tEn: "Ground coffee beans myself for the first time; grind was off but it tasted fine", cZh: "参数错了反而得到一个新口味，算是意外收获。", cEn: "Wrong parameter, new flavour — an accidental win.", topics: ["coffee", "experiment"] },
  { type: "moment", tZh: "坐错了一站地铁，索性出站走回去", tEn: "Missed my stop, got off and walked back instead", cZh: "意外发现一条完全安静的街，两边都是老梧桐。", cEn: "Found a completely quiet street lined with old plane trees.", topics: ["commute", "city"] },
  { type: "moment", tZh: "整理抽屉，扔掉了十七支写不出水的笔", tEn: "Cleaned a drawer and threw out seventeen dried-up pens", cZh: "「以后可能用得上」是所有杂物唯一的借口。", cEn: "'Might need it later' is the only excuse clutter ever needs.", topics: ["declutter", "habits"] },

  // ---- idea ----
  { type: "idea", tZh: "把周报从「成果清单」改成「问题清单」", tEn: "Rewrite the weekly report as a problem list, not an achievement list", cZh: "写成果容易变成自我表扬，而且下周没有起点。改成写「本周没解决的问题」，下一周自然就接上了。", cEn: "Listing wins slides into self-congratulation and leaves next week without a starting point. Writing down unresolved problems instead makes the next week connect by itself.", topics: ["writing", "process"] },
  { type: "idea", tZh: "标签应该用动词，而不是名词", tEn: "Tags should be verbs, not nouns", cZh: "名词标签会越积越多最后全部失效；动词标签自带动作，比如「待重写」「待验证」「待删」。", cEn: "Noun tags accumulate until they mean nothing. Verb tags carry an action — to-rewrite, to-verify, to-delete.", topics: ["taxonomy", "knowledge"] },
  { type: "idea", tZh: "图谱里最该被看见的不是连接最多的节点，而是孤岛", tEn: "In a knowledge graph, surface the islands — not the hubs", cZh: "连接数高只说明它被反复提到。孤岛才说明「这条我记了，但再也没用过」，那才是真正需要处理的东西。", cEn: "A high connection count only means it got mentioned repeatedly. An island means 'I captured this and never touched it again' — that is the real backlog.", topics: ["knowledge-graph", "product"] },
  { type: "idea", tZh: "错误提示应该写「下一步做什么」", tEn: "Error messages should state the next action", cZh: "用户不关心哪里错了，关心怎么继续。把「文件格式不支持」改成「请换成 PDF 或 DOCX 再试」。", cEn: "Users don't care where it broke; they care how to continue. 'Unsupported format' becomes 'try a PDF or DOCX instead'.", topics: ["ux", "copywriting"] },
  { type: "idea", tZh: "「收藏」是伪需求，「重读队列」才是真需求", tEn: "'Save for later' is a fake need; a re-read queue is the real one", cZh: "收藏的动作成本几乎为零，所以收藏夹一定是垃圾场。加上「重读」这个动作，才会真的被消费。", cEn: "Saving costs nothing, so the save folder is always a graveyard. Attaching a re-read action is what actually gets things consumed.", topics: ["product", "reading"] },
  { type: "idea", tZh: "演示文稿第一页放结论，不放目录", tEn: "Open a deck with the conclusion, not the agenda", cZh: "目录是作者的地图，不是读者的地图。读者只想知道「所以呢」。", cEn: "An agenda is the author's map, not the reader's. Readers only want to know: so what.", topics: ["presentation", "communication"] },
  { type: "idea", tZh: "让用户看到「你上次在这里停下来了」", tEn: "Show people where they stopped last time", cZh: "恢复上下文的成本远低于重新开始。这一句话能省掉大量的「我上次想到哪了」。", cEn: "Restoring context is far cheaper than starting over. One line removes an entire class of 'where was I'.", topics: ["ux", "memory"] },
  { type: "idea", tZh: "设计决策用「三行约束」写，不用长文档", tEn: "Write design decisions as three-line constraints, not long docs", cZh: "长文档写完就没人读。三行约束会在评审时被真的引用，因为它短到可以贴在墙上。", cEn: "Long docs are never re-read. Three-line constraints get quoted in reviews because they are short enough to stick on a wall.", topics: ["process", "writing"] },
  { type: "idea", tZh: "把「无产出日」排进日历", tEn: "Put a no-output day on the calendar", cZh: "不排进日历的休息，一定会被工作填满。它需要和会议一样有明确的时间块。", cEn: "Rest that isn't on the calendar gets filled by work. It needs a time block as explicit as a meeting.", topics: ["energy", "habits"] },
  { type: "idea", tZh: "先删后读：待读清单超过二十条就整体清空", tEn: "Delete first: clear the reading list whenever it passes twenty", cZh: "三个月没读的东西，未来三个月也不会读。清空之后留下的那几条才是真的想读。", cEn: "Anything unread for three months won't be read in the next three either. Whatever survives a reset is what you actually wanted.", topics: ["reading", "declutter"] },

  // ---- learning ----
  { type: "learning", tZh: "《Thinking in Systems》第 4 章：存量、流量与延迟", tEn: "Thinking in Systems, ch. 4: stocks, flows, and delay", cZh: "大部分「政策没效果」其实是延迟，不是无效。判断失效之前，先估算系统的响应时间。", cEn: "Most 'the policy didn't work' is actually delay, not failure. Estimate the system's response time before declaring it broken.", topics: ["systems", "reading"] },
  { type: "learning", tZh: "Postgres 的 MVCC 在长事务下会让表持续膨胀", tEn: "Postgres MVCC bloats tables under long transactions", cZh: "一个忘了提交的只读事务，能让 vacuum 一直追不上，磁盘涨得毫无道理。", cEn: "One uncommitted read-only transaction keeps vacuum permanently behind, and disk usage grows for no visible reason.", topics: ["postgres", "database"] },
  { type: "learning", tZh: "力导向布局可以用 Barnes-Hut 把 O(n²) 降到 O(n log n)", tEn: "Barnes-Hut drops force-directed layout from O(n²) to O(n log n)", cZh: "节点过百以后，逐对计算就是卡顿的根源。把远处节点聚成一个质心，视觉上几乎看不出差别。", cEn: "Past a hundred nodes, pairwise force calculation is the source of jank. Collapsing distant nodes into a centre of mass is visually indistinguishable.", topics: ["algorithms", "performance"] },
  { type: "learning", tZh: "CSS 的 z-index 失效几乎总是层叠上下文问题", tEn: "A broken z-index is almost always a stacking context problem", cZh: "父元素的 transform、opacity、filter 都会创建新的层叠上下文，子元素 z-index 再高也出不去。", cEn: "Transform, opacity, and filter on a parent all create a new stacking context; no z-index on a child can escape it.", topics: ["css", "frontend"] },
  { type: "learning", tZh: "分布式系统里「恰好一次」本质上不存在", tEn: "'Exactly once' does not really exist in distributed systems", cZh: "能做到的是「至少一次 + 幂等」。所以幂等键不是优化，是正确性的前提。", cEn: "What you can build is at-least-once plus idempotency. Idempotency keys are therefore a correctness requirement, not an optimisation.", topics: ["distributed", "systems"] },
  { type: "learning", tZh: "用户访谈里「我会用」和「我用了」之间隔着一个产品", tEn: "In interviews, 'I would use it' and 'I used it' are separated by a whole product", cZh: "问意愿得到的是礼貌，看行为得到的才是真相。所以访谈要问「上一次遇到这个问题是什么时候」。", cEn: "Asking about intent gets politeness; watching behaviour gets truth. Ask instead: when did you last hit this problem.", topics: ["research", "product"] },
  { type: "learning", tZh: "写作是思考的压缩算法", tEn: "Writing is a compression algorithm for thinking", cZh: "写不清楚通常不是文笔问题，是还没想清楚。写不出来的时候，先画图。", cEn: "Unclear writing is rarely a prose problem; it means the thinking isn't done. When you can't write it, draw it.", topics: ["writing", "thinking"] },
  { type: "learning", tZh: "读完《设计心理学》，回头重看自己的按钮", tEn: "Re-read The Design of Everyday Things and looked at my own buttons", cZh: "好的设计不需要说明书，坏的设计让人怪自己。所以「用户没看懂」永远是设计的问题。", cEn: "Good design needs no manual; bad design makes people blame themselves. 'The user didn't get it' is always a design bug.", topics: ["design", "reading"] },
  { type: "learning", tZh: "构建超过三十秒，人就会开始做别的事", tEn: "Past thirty seconds of build time, people start doing something else", cZh: "所以缓存命中率比绝对速度更重要——冷启动再快，也不如「大多数时候不用等」。", cEn: "Cache hit rate matters more than raw speed: fast cold starts still lose to 'usually there's no wait at all'.", topics: ["performance", "dx"] },
  { type: "learning", tZh: "函数式核心 + 命令式外壳，比全函数式更好维护", tEn: "Functional core with an imperative shell beats full functional", cZh: "纯逻辑好测，副作用集中在边界上。反过来做，两边都难受。", cEn: "Pure logic is testable and side effects stay at the boundary. Inverting that makes both halves painful.", topics: ["architecture", "code"] },

  // ---- decision ----
  { type: "decision", tZh: "放弃自建 CI，改用托管流水线", tEn: "Drop the self-hosted CI for a managed pipeline", cZh: "自建 runner 的维护成本远超省下的钱。每周至少两小时花在修环境上，那些时间本来可以写功能。", cEn: "Maintaining our own runners cost far more than it saved — at least two hours a week patching the environment, time that could have gone into features.", topics: ["infrastructure", "tradeoff"] },
  { type: "decision", tZh: "不再给每个功能都加开关，只保留三个", tEn: "Stop adding a flag for every feature; keep three", cZh: "开关数量是线性增长的，组合是指数增长的。超过三个之后，没有人能说清线上到底是哪个组合。", cEn: "Flags grow linearly and combinations grow exponentially. Past three, nobody can say which combination is live.", topics: ["release", "complexity"] },
  { type: "decision", tZh: "拒绝把 AI 摘要做成默认开启", tEn: "Refuse to make AI summaries on by default", cZh: "默认开启会让人跳过原文，而摘要有错的时候没有人会发现。必须让用户主动选择。", cEn: "On by default, people skip the source, and when a summary is wrong nobody notices. It has to be an explicit choice.", topics: ["ai", "product"] },
  { type: "decision", tZh: "数据导出优先支持 Markdown，而不是 JSON", tEn: "Prioritise Markdown export over JSON", cZh: "JSON 是给程序读的，Markdown 是给人读的。用户真正要的是「十年后还能直接打开」。", cEn: "JSON is for programs, Markdown is for people. What users actually want is 'still openable in ten years'.", topics: ["data", "sovereignty"] },
  { type: "decision", tZh: "不做移动端 App，先把响应式做到位", tEn: "Skip the native app; make the responsive web actually good", cZh: "同时做两个端的结果通常是两个都不好用。先把一个做到能用，再考虑第二个。", cEn: "Building both at once usually means neither works. Get one right before starting the second.", topics: ["platform", "focus"] },
  { type: "decision", tZh: "砍掉三个「看起来很酷」的功能", tEn: "Cut three features that only looked cool", cZh: "查了埋点，它们各自只被打开过两次，其中两次还是我自己测试。", cEn: "Checked the analytics: each was opened twice, and two of those were my own tests.", topics: ["product", "focus"] },
  { type: "decision", tZh: "放弃暗色模式作为默认，回到纸感浅色", tEn: "Drop dark mode as the default and return to paper-light", cZh: "长时间写作场景下浅色更耐看。暗色留着做选项，但不做默认。", cEn: "For long writing sessions, light reads better. Keep dark as an option, not the default.", topics: ["design", "defaults"] },
  { type: "decision", tZh: "下季度只做一件大事：把搜索做对", tEn: "One big thing next quarter: make search right", cZh: "搜索是所有功能的入口。它不好用，其他功能等于不存在。", cEn: "Search is the entry point to everything. If it's bad, the rest of the product effectively doesn't exist.", topics: ["roadmap", "focus"] },

  // ---- plan ----
  { type: "plan", tZh: "下周把图谱节点从 120 压到 80", tEn: "Cut the graph from 120 nodes down to 80 next week", cZh: "删掉重复概念，比继续加节点有用。节点越多，图谱越像一团毛线。", cEn: "Merging duplicate concepts beats adding nodes. The more nodes, the more the graph looks like a ball of yarn.", topics: ["knowledge-graph", "maintenance"] },
  { type: "plan", tZh: "把本周的会议压到三小时以内", tEn: "Compress this week's meetings to under three hours", cZh: "先按「没有我会怎样」筛一遍，一半的会其实不需要我。", cEn: "Filter by 'what happens if I'm not there' first — half of them don't need me.", topics: ["calendar", "focus"] },
  { type: "plan", tZh: "给每个模块写一行「这个文件存在的理由」", tEn: "Write one line per module: why this file exists", cZh: "写不出来的模块就该合并或删除。这是一个很便宜的重构触发条件。", cEn: "Any module whose reason you can't state should be merged or deleted. It's a very cheap refactor trigger.", topics: ["refactor", "code"] },
  { type: "plan", tZh: "每月最后一个周五留成无产出日", tEn: "Reserve the last Friday of each month as a no-output day", cZh: "不排任何会，不做任何交付，只允许散步、读书和整理。", cEn: "No meetings, no deliverables — only walking, reading, and tidying.", topics: ["energy", "habits"] },
  { type: "plan", tZh: "把待读清单从 34 条砍到 8 条", tEn: "Cut the reading list from 34 items to 8", cZh: "只留这个季度真的会读的，其余全部归档。", cEn: "Keep only what I'll genuinely read this quarter; archive the rest.", topics: ["reading", "declutter"] },
  { type: "plan", tZh: "用一周只做一件事：把冷启动压到一秒内", tEn: "Spend one week on a single thing: get cold start under a second", cZh: "先量，再改，再量。中间不加任何其他任务。", cEn: "Measure, change, measure. No other tasks in between.", topics: ["performance", "focus"] },

  // ---- achievement ----
  { type: "achievement", tZh: "构建时间从 92 秒降到 31 秒", tEn: "Build time down from 92 seconds to 31", cZh: "主要收益来自删掉重复的类型检查和一次多余的全量打包，没有换工具链。", cEn: "Most of the win came from removing a duplicate type-check and a redundant full bundle — no toolchain swap.", topics: ["performance", "milestone"] },
  { type: "achievement", tZh: "把一个三千行的文件拆成十二个模块", tEn: "Split a three-thousand-line file into twelve modules", cZh: "拆完发现其中两个模块其实从来没被调用过，顺手删了。", cEn: "Two of the twelve turned out never to be called, so they got deleted too.", topics: ["refactor", "milestone"] },
  { type: "achievement", tZh: "测试覆盖率从 12% 提到 61%", tEn: "Test coverage from 12% to 61%", cZh: "没有追求 100%，只覆盖了所有会真的花钱的地方：支付、导出、同步。", cEn: "Didn't chase 100% — only covered the places where failure costs money: payments, export, sync.", topics: ["testing", "milestone"] },
  { type: "achievement", tZh: "冷启动到首屏可交互压到 800 毫秒", tEn: "Cold start to interactive in 800 ms", cZh: "关键是把字体和图标从阻塞路径上挪走，剩下的都是小优化。", cEn: "The key move was getting fonts and icons off the blocking path; everything else was minor.", topics: ["performance", "milestone"] },
  { type: "achievement", tZh: "收到第一封用户手写的感谢邮件", tEn: "Got the first hand-written thank-you email from a user", cZh: "她说「终于有一个不催我打卡的记录工具」。这句话比任何增长数字都有用。", cEn: "She wrote: 'finally a journal that doesn't nag me to check in'. That line was worth more than any growth metric.", topics: ["users", "milestone"] },
  { type: "achievement", tZh: "周活跃从 40 涨到 210，没有做任何推广", tEn: "Weekly actives from 40 to 210 with zero promotion", cZh: "全靠一个用户在自己的周报里提了一句，然后被转发了十几次。", cEn: "One user mentioned it in their weekly report, and it got forwarded a dozen times.", topics: ["growth", "milestone"] },

  // ================================================================
  // 第二批：把池子从 60 条扩到 120 条。
  //
  // 为什么必须扩：长尾按「每天 1 条 + 隔天加 1 条」铺满 85 天，需要约 118 条。
  // 池子只有 60 条时只能循环取用，结果是 136 条记忆里只有 72 个不同标题
  // （64 条重复）—— 档案页和图谱里同一个标题会出现在不同日期，一眼就是假数据。
  // 扩到 120 条之后，窗口内每条只用一次，标题全局唯一。
  //
  // 新增部分刻意提高了「工作相关」的占比（含 优化/交付/重构/上线/测试/部署/
  // 架构/设计/需求/评审 等关键词），因为 Career Studio 靠关键词判定工作脉冲，
  // 之前 136 条里只有 12 条能被识别成工作记录，履历库几乎是空的。
  // ================================================================

  // ---- moment 补充 20 ----
  { type: "moment", tZh: "早上把桌面清空，只留一台电脑一杯水", tEn: "Cleared the desk, leaving only a laptop and a glass of water", cZh: "空桌面带来的专注，比任何番茄钟都有效。", cEn: "An empty desk bought more focus than any timer app.", topics: ["environment", "focus"] },
  { type: "moment", tZh: "把上周的会议录音倍速听完，只记了七行", tEn: "Speed-listened to last week's meeting recordings, kept seven lines", cZh: "一小时的会，真正有用的信息不到五分钟。", cEn: "An hour of meeting yielded under five minutes of actual information.", topics: ["meetings", "notes"] },
  { type: "moment", tZh: "第一次用纸质笔记本开需求评审", tEn: "Ran a requirements review with a paper notebook for the first time", cZh: "不开电脑反而没人分心，四十分钟就定了方案。", cEn: "No laptops meant nobody drifted; the plan was settled in forty minutes.", topics: ["meetings", "process"] },
  { type: "moment", tZh: "下班路上把明天的三件事写在手机备忘录里", tEn: "Wrote tomorrow's three tasks into my phone on the way home", cZh: "写下来的那一刻，今晚就不用再想了。", cEn: "Writing them down meant I could stop thinking about them for the evening.", topics: ["planning", "routine"] },
  { type: "moment", tZh: "帮同事看了一个卡了他两天的问题，五分钟就定位到了", tEn: "Looked at a bug a colleague had been stuck on for two days; found it in five minutes", cZh: "不是更聪明，只是没被前面两天的假设绑住。", cEn: "Not smarter — just not trapped by two days of assumptions.", topics: ["debugging", "collaboration"] },
  { type: "moment", tZh: "把界面上的六个按钮砍到三个", tEn: "Cut six buttons on a screen down to three", cZh: "砍完用户反而更快找到主操作。", cEn: "With fewer options, users reached the primary action faster.", topics: ["design", "ux"] },
  { type: "moment", tZh: "在客户现场看到有人用纸质表格代替我们的系统", tEn: "On site, watched someone use a paper form instead of our system", cZh: "那一刻比任何用户调研都清楚：我们的录入流程太长了。", cEn: "Clearer than any user study: our data-entry flow was simply too long.", topics: ["users", "product"] },
  { type: "moment", tZh: "改了一行配置，把接口平均延迟从 900ms 降到 210ms", tEn: "One config line took average API latency from 900 ms to 210 ms", cZh: "连接池上限一直用的是默认值，从来没人看过。", cEn: "The connection pool cap had been left at its default and nobody had ever looked.", topics: ["performance", "api"] },
  { type: "moment", tZh: "把项目里的 47 个 TODO 评论集中清理了一遍", tEn: "Cleared out all 47 TODO comments in the project", cZh: "其中 31 个早就做完了，只是没人回来删。", cEn: "Thirty-one of them had already been done; nobody came back to delete the notes.", topics: ["refactor", "maintenance"] },
  { type: "moment", tZh: "周末花两小时把文档站重新排了目录", tEn: "Spent two hours on a weekend reorganising the docs site", cZh: "没有人会读一份找不到入口的文档。", cEn: "Nobody reads documentation they can't find their way into.", topics: ["docs", "writing"] },
  { type: "moment", tZh: "第一次做线上故障复盘，主持得比想象中顺", tEn: "Ran my first incident postmortem; smoother than expected", cZh: "关键是先把时间线写清楚，责任讨论放最后。", cEn: "The trick was writing the timeline first and leaving blame for last.", topics: ["process", "reliability"] },
  { type: "moment", tZh: "把家里的路由器换了个位置，视频会议再也没卡过", tEn: "Moved the home router and video calls stopped stuttering", cZh: "困扰半年的问题，解决方案是挪两米。", cEn: "A six-month problem solved by moving something two metres.", topics: ["home", "network"] },
  { type: "moment", tZh: "在地铁上用手机读完了一篇很长的技术文章", tEn: "Read a very long technical article on my phone on the subway", cZh: "分段读完的，但比收藏起来永远不读要好。", cEn: "Read it in fragments — still better than saving it and never returning.", topics: ["reading", "commute"] },
  { type: "moment", tZh: "把一个功能的三种空状态都补了文案", tEn: "Wrote copy for all three empty states of one feature", cZh: "空状态是用户第一次见到产品的地方，却总是最后才做。", cEn: "Empty states are the first thing users see and always the last thing built.", topics: ["design", "copywriting"] },
  { type: "moment", tZh: "开会时把「我觉得」换成「数据显示」，讨论立刻变了", tEn: "Swapped 'I think' for 'the data shows' in a meeting and the discussion shifted", cZh: "不是数据更有说服力，是它逼所有人回到同一个地面。", cEn: "Not that data persuades better — it forces everyone onto the same ground.", topics: ["communication", "collaboration"] },
  { type: "moment", tZh: "给导出功能加了个进度条，投诉少了一大半", tEn: "Added a progress bar to export; complaints dropped by half", cZh: "用户不是不能等，是不能接受不知道要等多久。", cEn: "Users can wait. They just can't wait without knowing how long.", topics: ["ux", "product"] },
  { type: "moment", tZh: "把两个相似的服务合并，运维成本降了一半", tEn: "Merged two similar services and halved the ops burden", cZh: "分开的理由早就消失了，只是没人重新评估。", cEn: "The reason for splitting them had evaporated; nobody re-evaluated.", topics: ["architecture", "refactor"] },
  { type: "moment", tZh: "在电梯里被问「这个功能到底解决什么问题」，答不上来", tEn: "Asked in the lift what problem a feature solved, and I had no answer", cZh: "答不上来的功能，大概率不该做。", cEn: "A feature I can't justify in one sentence probably shouldn't exist.", topics: ["product", "thinking"] },
  { type: "moment", tZh: "把周会从一小时压到二十分钟", tEn: "Cut the weekly meeting from an hour to twenty minutes", cZh: "方法是会前把材料发出去，会上只讨论分歧。", cEn: "Circulate the material beforehand; only discuss disagreements live.", topics: ["meetings", "process"] },
  { type: "moment", tZh: "给新同事讲了一遍系统架构，自己也讲清楚了", tEn: "Walked a new colleague through the architecture and clarified it for myself", cZh: "讲到第三层的时候发现自己也一直理解错了一处。", cEn: "By the third layer I realised I'd been misreading one part all along.", topics: ["architecture", "collaboration"] },

  // ---- idea 补充 10 ----
  { type: "idea", tZh: "把「已读」改成「已用过」", tEn: "Replace 'read' with 'used'", cZh: "读没读过无法验证，用没用过可以。让标记反映行为，而不是自我报告。", cEn: "Whether I read something is unverifiable; whether I used it isn't. Let the marker track behaviour, not self-report.", topics: ["product", "knowledge"] },
  { type: "idea", tZh: "延迟应该被设计成可见的，而不是被隐藏的", tEn: "Latency should be made visible, not hidden", cZh: "把所有「加载中」换成真实耗时数字，用户容忍度反而上升。", cEn: "Showing real elapsed time instead of a spinner raises tolerance rather than lowering it.", topics: ["ux", "performance"] },
  { type: "idea", tZh: "搜索的第一功能不是找到，而是排除", tEn: "The primary job of search is exclusion, not retrieval", cZh: "用户真正想做的是「在 300 条里去掉 290 条」，所以筛选器比排序更重要。", cEn: "Users want to remove 290 of 300 items; filters matter more than ranking.", topics: ["ux", "product"] },
  { type: "idea", tZh: "文档应该写在代码之前，但只写一段", tEn: "Write docs before code — but only one paragraph", cZh: "一段话写不清楚的事，通常也不该开工。", cEn: "If it can't be explained in one paragraph, it probably shouldn't be started.", topics: ["writing", "process"] },
  { type: "idea", tZh: "把「重要」拆成「不可逆」和「高频」", tEn: "Split 'important' into 'irreversible' and 'frequent'", cZh: "两个词混在一起，导致所有事都重要，等于都不重要。", cEn: "Merged into one word, everything is important, which means nothing is.", topics: ["thinking", "prioritisation"] },
  { type: "idea", tZh: "通知应该按「打扰成本」分级，而不是按来源", tEn: "Tier notifications by interruption cost, not by source", cZh: "按来源分级的结果是所有 App 都觉得自己最重要。", cEn: "Tiering by source just means every app rates itself critical.", topics: ["ux", "product"] },
  { type: "idea", tZh: "「导出」是产品最重要的信任按钮", tEn: "'Export' is a product's most important trust button", cZh: "愿意让你随时带走数据的工具，才值得把数据放进去。", cEn: "Only a tool that lets you leave with your data deserves to hold it.", topics: ["product", "trust"] },
  { type: "idea", tZh: "把接口的错误码当成产品文案来写", tEn: "Treat API error codes as product copy", cZh: "错误码最终一定会出现在用户眼前，那就别让它以乱码的形式出现。", cEn: "Error codes always reach a user eventually — so don't let them arrive as gibberish.", topics: ["api", "copywriting"] },
  { type: "idea", tZh: "一次只改一个变量，是排查问题的唯一纪律", tEn: "Change one variable at a time — the only debugging discipline", cZh: "同时改三处然后「好像好了」，等于什么也没学到。", cEn: "Change three things, declare it fixed, and you've learned nothing.", topics: ["debugging", "process"] },
  { type: "idea", tZh: "把「我记得」变成「我记下来了」只需要三秒", tEn: "Turning 'I remember' into 'I wrote it down' takes three seconds", cZh: "三秒的成本，换掉一整晚的「我是不是忘了什么」。", cEn: "Three seconds buys you an evening without the 'what did I forget' loop.", topics: ["memory", "habits"] },

  // ---- learning 补充 10 ----
  { type: "learning", tZh: "读《A Philosophy of Software Design》：复杂度是依赖和未知的乘积", tEn: "Read A Philosophy of Software Design: complexity is dependencies times unknowns", cZh: "作者说复杂度不是代码行数，而是「理解一处需要看多少别处」。这个定义比任何指标都好用。", cEn: "Complexity isn't line count — it's how much else you must read to understand one place. That definition beats any metric.", topics: ["reading", "architecture"] },
  { type: "learning", tZh: "学到：缓存失效比缓存命中难一百倍", tEn: "Learned that cache invalidation is a hundred times harder than cache hits", cZh: "写缓存只要一行，写对它什么时候失效要一整套规则。", cEn: "Writing the cache is one line; deciding when it goes stale is a whole ruleset.", topics: ["caching", "architecture"] },
  { type: "learning", tZh: "读了指数退避的原始论文，才发现自己一直实现错了", tEn: "Read the original exponential-backoff paper and found my implementation was wrong", cZh: "我加了抖动，但抖动范围写成了固定值，等于没加。", cEn: "I had jitter — but a constant jitter range, which is no jitter at all.", topics: ["reliability", "reading"] },
  { type: "learning", tZh: "学会用「反例优先」的方式读需求文档", tEn: "Learned to read specs by hunting for counterexamples first", cZh: "先找文档没说的情况，比顺着读完更快发现漏洞。", cEn: "Looking for what the doc doesn't say finds gaps faster than reading it linearly.", topics: ["reading", "process"] },
  { type: "learning", tZh: "看完一篇文章后能用自己的话讲出来，才算读完", tEn: "An article is only read once I can restate it in my own words", cZh: "讲不出来的部分，其实只是眼睛扫过去了。", cEn: "Whatever I can't restate, my eyes merely passed over.", topics: ["reading", "learning"] },
  { type: "learning", tZh: "学了数据库索引的选择性原理，回头改了三个慢查询", tEn: "Learned index selectivity and immediately fixed three slow queries", cZh: "给低选择性字段加索引，反而更慢——优化器会绕开它。", cEn: "Indexing a low-selectivity column makes things slower; the optimiser just ignores it.", topics: ["database", "performance"] },
  { type: "learning", tZh: "第一次认真读 CSS 的层叠上下文，解释了三个历史 bug", tEn: "Finally read up on stacking contexts and it explained three old bugs", cZh: "z-index 失效从来不是 z-index 的问题，是父元素建了新的层叠上下文。", cEn: "z-index never fails on its own — a parent created a new stacking context.", topics: ["css", "debugging"] },
  { type: "learning", tZh: "读了一篇讲「认知负荷」的文章，理解了为什么好界面看起来空", tEn: "Read an article on cognitive load and understood why good interfaces look empty", cZh: "空不是信息少，是把信息按需展开。", cEn: "Empty doesn't mean less information — it means information revealed on demand.", topics: ["ux", "reading"] },
  { type: "learning", tZh: "学了 OWASP 前十，发现自己项目里有两条", tEn: "Went through the OWASP Top Ten and found two issues in my own project", cZh: "一个是导出接口没做权限校验，一个是日志里打了完整 token。", cEn: "One export endpoint had no authorisation check; one log line printed a full token.", topics: ["security", "testing"] },
  { type: "learning", tZh: "理解了「幂等」不只是接口设计，是所有重试的前提", tEn: "Realised idempotency isn't just API design — it's the premise of all retries", cZh: "不能幂等的操作，就不该允许自动重试。", cEn: "An operation that isn't idempotent should never be retried automatically.", topics: ["api", "reliability"] },

  // ---- decision 补充 8 ----
  { type: "decision", tZh: "决定不做移动端 App，先做响应式 Web", tEn: "Decided against a mobile app; going responsive web first", cZh: "两个平台的维护成本会吃掉所有做功能的时间，而核心用户是坐着写东西的人。", cEn: "Two platforms would eat every hour meant for features, and the core user writes at a desk.", topics: ["product", "strategy"] },
  { type: "decision", tZh: "决定把第三方 SDK 从四个减到一个", tEn: "Cut third-party SDKs from four down to one", cZh: "每个 SDK 都是一次隐私风险和一次升级负担，换来的功能都能自己写。", cEn: "Each SDK is a privacy surface and an upgrade burden, and the features were all reproducible in-house.", topics: ["architecture", "security"] },
  { type: "decision", tZh: "决定不追功能数量，先把导出和备份做到无懈可击", tEn: "Decided to stop adding features and make export and backup bulletproof first", cZh: "数据安全的信任一旦破了，功能再多也没用。", cEn: "Once trust in data safety breaks, no number of features helps.", topics: ["product", "trust"] },
  { type: "decision", tZh: "决定所有异步任务都要有可见的失败重试入口", tEn: "Decided every async job needs a visible retry entry point", cZh: "之前失败只在日志里，用户以为成功了。", cEn: "Failures used to live only in logs while users assumed success.", topics: ["ux", "reliability"] },
  { type: "decision", tZh: "决定放弃自建搜索，改用浏览器原生能力", tEn: "Dropped the custom search layer for native browser capabilities", cZh: "自建的模糊匹配在中文上一直不准，原生方案反而更稳。", cEn: "My fuzzy matcher was always wrong on Chinese; the native path was steadier.", topics: ["architecture", "search"] },
  { type: "decision", tZh: "决定把周报生成从模板改成规则加 AI 混合", tEn: "Moved report generation from pure templates to rules plus AI", cZh: "纯模板读起来像机器，纯 AI 又爱编。规则定骨架，AI 只改措辞。", cEn: "Pure templates read like a machine; pure AI invents. Rules build the skeleton, AI only adjusts phrasing.", topics: ["product", "writing"] },
  { type: "decision", tZh: "决定给所有写操作加上本地草稿", tEn: "Decided every write action gets a local draft", cZh: "丢过一次两小时的内容之后，这条变成了硬性要求。", cEn: "After losing two hours of writing once, this became non-negotiable.", topics: ["product", "reliability"] },
  { type: "decision", tZh: "决定不再支持 IE 和旧版 Safari", tEn: "Dropped support for IE and older Safari", cZh: "兼容层占了 18% 的代码量，而这部分用户不到 0.3%。", cEn: "The compat layer was 18% of the code for under 0.3% of users.", topics: ["architecture", "strategy"] },

  // ---- plan 补充 6 ----
  { type: "plan", tZh: "下个月把文档从 12 篇合并成 5 篇", tEn: "Merge twelve docs into five next month", cZh: "文档的问题从来不是不够多，是找不到该看哪一篇。", cEn: "The problem with docs is never volume — it's not knowing which one to read.", topics: ["docs", "writing"] },
  { type: "plan", tZh: "本季度把首屏的 JS 体积砍掉一半", tEn: "Halve the first-load JS bundle this quarter", cZh: "先量出每个依赖的体积，再逐个决定留还是删。", cEn: "Measure each dependency's weight first, then decide keep or cut one by one.", topics: ["performance", "planning"] },
  { type: "plan", tZh: "给每个核心流程补一条端到端测试", tEn: "Add one end-to-end test per core flow", cZh: "只要三条：记录、导出、同步。其他都可以没有。", cEn: "Three is enough: capture, export, sync. The rest can wait.", topics: ["testing", "planning"] },
  { type: "plan", tZh: "连续两周每天写 200 字，不修改", tEn: "Write 200 words a day for two weeks without editing", cZh: "先解决「写不出来」，再解决「写得不好」。", cEn: "Fix not-writing first; fix bad-writing second.", topics: ["writing", "habits"] },
  { type: "plan", tZh: "把每周固定的三个会议减到一个", tEn: "Cut three recurring weekly meetings down to one", cZh: "其余两个改成异步文档，谁需要谁读。", cEn: "The other two become async docs — read them if you need them.", topics: ["meetings", "process"] },
  { type: "plan", tZh: "给项目补一份「为什么这样设计」的决策记录", tEn: "Add a decision log explaining why things are designed this way", cZh: "代码能说明「是什么」，说明不了「为什么不选另一条路」。", cEn: "Code shows what; it never shows why the other path was rejected.", topics: ["docs", "architecture"] },

  // ---- achievement 补充 6 ----
  { type: "achievement", tZh: "把导出功能的失败率从 7% 压到 0.2%", tEn: "Export failure rate from 7% down to 0.2%", cZh: "根因是大文件走内存拼接，改成流式写入就解决了。", cEn: "Root cause was assembling large files in memory; streaming writes fixed it.", topics: ["reliability", "milestone"] },
  { type: "achievement", tZh: "把三个仓库的 CI 合并成一条流水线", tEn: "Merged three repositories' CI into a single pipeline", cZh: "构建总时长从 26 分钟降到 9 分钟。", cEn: "Total build time dropped from 26 minutes to 9.", topics: ["ci", "milestone"] },
  { type: "achievement", tZh: "完成了一次零停机的数据迁移", tEn: "Completed a zero-downtime data migration", cZh: "双写、比对、切换、回滚预案，四步都真的跑了一遍。", cEn: "Dual-write, diff, cutover, rollback plan — all four actually rehearsed.", topics: ["database", "milestone"] },
  { type: "achievement", tZh: "把用户反馈的 23 个问题在一周内清空", tEn: "Cleared all 23 user-reported issues in one week", cZh: "其中 9 个是同一个根因，只是被报了 9 次。", cEn: "Nine of them shared one root cause and had been reported nine times.", topics: ["users", "milestone"] },
  { type: "achievement", tZh: "把首页加载从 3.4 秒做到 1.1 秒", tEn: "Homepage load from 3.4 s to 1.1 s", cZh: "删掉一个没在用的图表库，直接少了 400KB。", cEn: "Removing one unused charting library cut 400 KB outright.", topics: ["performance", "milestone"] },
  { type: "achievement", tZh: "完成了第一次对外技术分享，来了 60 多人", tEn: "Gave my first public tech talk to an audience of 60+", cZh: "准备的时候才发现，自己有三个地方其实没真正搞懂。", cEn: "Preparing it exposed three things I hadn't actually understood.", topics: ["communication", "milestone"] },
];

/**
 * 长尾演示数据：8 月 1 日 → 11 天前，每天 1–2 条。
 * 最近 10 天由 getDynamicSeedMemories() 的 12 条核心记忆覆盖，避免重叠。
 * 同一日期用固定种子生成，保证跨刷新、跨设备完全一致。
 */
/**
 * The date window the demo archive is generated over.
 *
 * Anchored on August 1 so the demo always tells the same story ("your archive
 * starts in August"), with `tailDays` of headroom before today so that the
 * Today / This Week views are populated by the *dynamic* seed entries rather
 * than by generated long-tail filler.
 *
 * Two guards that the previous inline `new Date(y, 7, 1)` lacked:
 *
 * 1. **Future anchor.** From January to July, "August 1 of this year" is in the
 *    future, so `start > end` and both the long tail and every receipt came back
 *    empty — the Mood Wash carousel and the calendar went blank for the first
 *    seven months of any year. Falling back to last year's August fixes it.
 * 2. **Unbounded span.** That fallback alone can span ~14 months, which would
 *    generate several hundred filler entries and slow first paint. `MAX_SPAN_DAYS`
 *    trims the window from the left.
 */
const MAX_SPAN_DAYS = 120;

function getDemoWindow(tailDays: number): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() - tailDays);

  let start = new Date(today.getFullYear(), 7, 1); // 8 月 1 日
  if (start > end) start = new Date(today.getFullYear() - 1, 7, 1);

  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (spanDays > MAX_SPAN_DAYS) {
    start = new Date(end);
    start.setDate(start.getDate() - MAX_SPAN_DAYS);
  }

  return { start, end };
}

export function getLongTailSeedMemories(): CanonicalMemory[] {
  // 长尾一直铺到「昨天」，和 getDemoReceipts 用同一个 end：
  // 这样 8/1 至今的每一天都至少有一条记录，小票不会出现空卡（TOTAL RECORDED 0）。
  // 今天不铺长尾，留给 getDynamicSeedMemories 的 3 条手写记录。
  const { start, end } = getDemoWindow(1);

  if (start > end) return [];

  // 把池子确定性打乱成一副牌，按天依次发牌。
  //
  // 之前的写法是 DEMO_POOL[dayIdx % 60]：池子 60 条、窗口 85 天，必然循环取用，
  // 结果 136 条记忆里只有 72 个不同标题（64 条重复）—— 档案页和图谱里同一个标题
  // 出现在不同日期，一眼就能看出是假数据。发牌式取用保证窗口内每条只用一次。
  const deck = Array.from({ length: DEMO_POOL.length }, (_, i) => i);
  const shuffleRnd = seededRandom("demo-pool-deck");
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(shuffleRnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  let dealt = 0;
  const deal = (): DemoEntry => DEMO_POOL[deck[dealt++ % deck.length]];

  const out: CanonicalMemory[] = [];
  let dayIdx = 0;

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const dayKey = localDayKey(cursor);
    const rnd = seededRandom(dayKey);

    // 每天 1 条；每 3 天多 1 条；偶尔 3 条。
    // 85 天共约 119 条，池子 120 条 —— 刚好不重样。
    const picks: DemoEntry[] = [deal()];
    if (dayIdx % 3 === 0) picks.push(deal());
    if (rnd() < 0.06) picks.push(deal());

    // 同一天去重（三条公式可能撞车）
    const seen = new Set<DemoEntry>();
    const unique = picks.filter((e) => (seen.has(e) ? false : (seen.add(e), true)));

    unique.forEach((entry, n) => {
      const hour = 7 + Math.floor(rnd() * 15); // 07:00 – 21:59
      const minute = Math.floor(rnd() * 60);
      const at = new Date(cursor);
      at.setHours(hour, minute, 0, 0);
      const iso = toLocalIso(at);
      const type = entry.type;

      out.push({
        schema_version: "1.0",
        id: `mem_demo_d${dayKey.replace(/-/g, "")}_${n + 1}`,
        type,
        title: entry.tZh,
        title_zh: entry.tZh,
        title_en: entry.tEn,
        content: entry.cZh,
        content_zh: entry.cZh,
        content_en: entry.cEn,
        language: "zh",
        occurred_at: iso,
        recorded_at: iso,
        updated_at: iso,
        topics: entry.topics,
        source_ids: [],
        relations: [],
        confidence: entry.confidence ?? 0.9,
        memory_level: DEFAULT_LEVEL_BY_TYPE[type],
        status: "active",
        provenance: {
          capture_method: "manual",
          ai_generated: false,
          source: "demo/long-tail",
        },
        color_accent: DEFAULT_TYPE_COLORS[type],
      } as CanonicalMemory);
    });

    dayIdx++;
  }

  return out;
}

/**
 * 演示用「每日心情水彩 + 复盘」。
 *
 * 之前 loadDemoData 把 storedReceipts 直接置空，导致所有日期的心情都回退到
 * 同一个默认值（陶土红），Daily Mood Wash 看起来只有一种。这里按日期确定性地
 * 铺开五种心情，并给约三成日期写一句复盘。
 *
 * 只铺到「前天」，今天与昨天保持未定稿状态（不写入），语义上更自然。
 */
export function getDemoReceipts(): Record<string, DailyReceipt> {
  const { start, end } = getDemoWindow(1);

  const MOODS = [
    { id: "terracotta", zh: "陶土红 · 热情", en: "Terracotta · Energized" },
    { id: "amber", zh: "琥珀蜜 · 灵感", en: "Amber · Inspired" },
    { id: "sage", zh: "苍青绿 · 平和", en: "Sage · Calm" },
    { id: "fjord", zh: "冰海蓝 · 澄澈", en: "Fjord · Focused" },
    { id: "twilight", zh: "暮山紫 · 内省", en: "Twilight · Reflective" },
  ];

  const REFLECTIONS = [
    { zh: "今天大部分时间在等编译，反而想清楚了一件事：慢的东西会强迫你思考。", en: "Spent most of today waiting on builds, and figured one thing out: slow things force you to think." },
    { zh: "删掉的东西比写出来的更有价值。", en: "What I deleted was worth more than what I wrote." },
    { zh: "状态不好的时候不要做设计决策，只做整理。", en: "On a low-energy day, don't make design decisions — just tidy." },
    { zh: "把一个问题讲给别人听，答案通常自己就出来了。", en: "Explain a problem to someone and the answer usually surfaces on its own." },
    { zh: "今天没有推进任何东西，但把桌面收干净了，明天会好过很多。", en: "Nothing moved forward today, but the desk is clean and tomorrow will be easier." },
    { zh: "又一次证明：先写完再改，比边写边改快三倍。", en: "Proven again: write it all first, edit later — three times faster." },
    { zh: "记录的意义不在于回看，而在于写的那一刻就已经在想清楚了。", en: "The point of journaling isn't rereading — it's that writing it forces the thinking." },
  ];

  const out: Record<string, DailyReceipt> = {};
  if (start > end) return out;

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const dayKey = localDayKey(cursor);
    const rnd = seededRandom(`receipt:${dayKey}`);
    const mood = MOODS[Math.floor(rnd() * MOODS.length)];
    const hasReflection = rnd() < 0.32;
    const refl = REFLECTIONS[Math.floor(rnd() * REFLECTIONS.length)];

    out[dayKey] = {
      id: `receipt_${dayKey}`,
      date: dayKey,
      moments: [],
      ideas: [],
      learning: [],
      decisions: [],
      tomorrow: [],
      open_loops: [],
      referenced_memory_ids: [],
      created_at: toLocalIso(cursor),
      mood: mood.zh,
      mood_zh: mood.zh,
      mood_en: mood.en,
      ...(hasReflection
        ? {
            custom_reflection: refl.zh,
            custom_reflection_zh: refl.zh,
            custom_reflection_en: refl.en,
          }
        : {}),
    };
  }

  return out;
}

/**
 * 手写的 12 条核心记忆之间的关系。这些是「叙事性」连线（决策→结果、同一主题），
 * 理由文案是手写的，所以单独保留；自动推导的连线见 deriveTopicRelationships()。
 */
const HANDWRITTEN_RELATIONSHIPS: Relationship[] = [
  {
    id: "rel_demo_01",
    from_memory_id: "mem_demo_01",
    to_memory_id: "mem_demo_08",
    type: "references",
    origin: "manual",
    reason: "AetherOS 系统架构将离线双向链接引擎作为核心底层持久化模块",
    reason_zh: "AetherOS 系统架构将离线双向链接引擎作为核心底层持久化模块",
    reason_en: "AetherOS architecture relies on the offline bi-directional linking engine as its core persistence module",
    status: "confirmed",
    created_at: getOffsetIso(5, 16, 0),
  },
  {
    id: "rel_demo_02",
    from_memory_id: "mem_demo_01",
    to_memory_id: "mem_demo_02",
    type: "decision_outcome",
    origin: "manual",
    reason: "系统架构的深度打磨直接催生了群岛原则的高阶精力管理决策",
    reason_zh: "系统架构的深度打磨直接催生了群岛原则的高阶精力管理决策",
    reason_en: "Deep architectural craftsmanship directly catalyzed the Archipelago Principle for high-leverage focus",
    status: "confirmed",
    created_at: getOffsetIso(0, 10, 0),
  },
  {
    id: "rel_demo_03",
    from_memory_id: "mem_demo_01",
    to_memory_id: "mem_demo_09",
    type: "decision_outcome",
    origin: "manual",
    reason: "对本地优先与隐私保护的追求导向了基于 Git 树的去中心化持久化架构",
    reason_zh: "对本地优先与隐私保护的追求导向了基于 Git 树的去中心化持久化架构",
    reason_en: "The pursuit of local-first privacy led to the decentralized Git-tree storage architecture",
    status: "confirmed",
    created_at: getOffsetIso(6, 14, 0),
  },
  {
    id: "rel_demo_04",
    from_memory_id: "mem_demo_01",
    to_memory_id: "mem_demo_07",
    type: "same_topic",
    origin: "rule_based",
    reason: "通感界面美学与机械音效构成了 AetherOS 温暖人机交互的前端表现层",
    reason_zh: "通感界面美学与机械音效构成了 AetherOS 温暖人机交互的前端表现层",
    reason_en: "Tactile synesthesia and mechanical soundscapes define the warm human-interface layer of AetherOS",
    status: "confirmed",
    created_at: getOffsetIso(4, 18, 0),
  },
  {
    id: "rel_demo_05",
    from_memory_id: "mem_demo_02",
    to_memory_id: "mem_demo_05",
    type: "same_topic",
    origin: "rule_based",
    reason: "群岛深度工作原则与高信噪比极简沟通在认知精力管理上同频共振",
    reason_zh: "群岛深度工作原则与高信噪比极简沟通在认知精力管理上同频共振",
    reason_en: "The Archipelago deep work rule and high-density communication share identical cognitive focus foundations",
    status: "confirmed",
    created_at: getOffsetIso(2, 15, 0),
  },
  {
    id: "rel_demo_06",
    from_memory_id: "mem_demo_03",
    to_memory_id: "mem_demo_11",
    type: "semantic_similarity",
    origin: "ai_suggested",
    reason: "GitHub 边界压测验证与分布式系统第一性原理降维均强调摒弃盲从、实测为王",
    reason_zh: "GitHub 边界压测验证与分布式系统第一性原理降维均强调摒弃盲从、实测为王",
    reason_en: "GitHub stress testing and distributed systems reduction both reject hype in favor of empirical reality",
    status: "confirmed",
    created_at: getOffsetIso(8, 17, 0),
  },
  {
    id: "rel_demo_07",
    from_memory_id: "mem_demo_04",
    to_memory_id: "mem_demo_09",
    type: "decision_outcome",
    origin: "ai_suggested",
    reason: "智识自主权与反垄断底层价值观直接奠定了坚守用户私有数据主权的核心信条",
    reason_zh: "智识自主权与反垄断底层价值观直接奠定了坚守用户私有数据主权的核心信条",
    reason_en: "Intellectual autonomy and anti-monopoly values directly established the creed of sovereign data ownership",
    status: "confirmed",
    created_at: getOffsetIso(6, 15, 0),
  },
  {
    id: "rel_demo_08",
    from_memory_id: "mem_demo_04",
    to_memory_id: "mem_demo_11",
    type: "same_topic",
    origin: "rule_based",
    reason: "第一性原理思辨是系统架构降维与识别虚假复杂度的根本思维工具",
    reason_zh: "第一性原理思辨是系统架构降维与识别虚假复杂度的根本思维工具",
    reason_en: "First-principles reasoning serves as the primary cognitive lever for deconstructing system complexity",
    status: "confirmed",
    created_at: getOffsetIso(8, 17, 30),
  },
  {
    id: "rel_demo_09",
    from_memory_id: "mem_demo_05",
    to_memory_id: "mem_demo_12",
    type: "temporal_sequence",
    origin: "ai_suggested",
    reason: "极简沟通法则指导了周度复盘时对冗余低价值节点的果断修剪",
    reason_zh: "极简沟通法则指导了周度复盘时对冗余低价值节点的果断修剪",
    reason_en: "High-density minimalism directly governs the ruthless pruning of low-signal nodes during weekly reviews",
    status: "confirmed",
    created_at: getOffsetIso(9, 20, 0),
  },
  {
    id: "rel_demo_10",
    from_memory_id: "mem_demo_06",
    to_memory_id: "mem_demo_08",
    type: "semantic_similarity",
    origin: "ai_suggested",
    reason: "动力系统非线性凸性收敛算法直接应用于力导向图谱的能量极小化排布",
    reason_zh: "动力系统非线性凸性收敛算法直接应用于力导向图谱的能量极小化排布",
    reason_en: "Non-linear dynamic convergence mathematics are directly applied to energy-minimization force-directed graph layouts",
    status: "confirmed",
    created_at: getOffsetIso(5, 16, 30),
  },
  {
    id: "rel_demo_11",
    from_memory_id: "mem_demo_07",
    to_memory_id: "mem_demo_10",
    type: "temporal_sequence",
    origin: "rule_based",
    reason: "实体纸张与按键阻尼的通感设计为晨间无阻力倾泻提供了沉浸的心流场",
    reason_zh: "实体纸张与按键阻尼的通感设计为晨间无阻力倾泻提供了沉浸的心流场",
    reason_en: "Tactile paper aesthetics and keystroke acoustics provide an immersive flow state for morning reflections",
    status: "confirmed",
    created_at: getOffsetIso(0, 8, 0),
  },
  {
    id: "rel_demo_12",
    from_memory_id: "mem_demo_08",
    to_memory_id: "mem_demo_12",
    type: "references",
    origin: "manual",
    reason: "自主研发的图谱编译引擎为每周日晚的认知拓扑复盘提供了结构化诊断工具",
    reason_zh: "自主研发的图谱编译引擎为每周日晚的认知拓扑复盘提供了结构化诊断工具",
    reason_en: "The compiled knowledge graph serves as the primary topological diagnostics tool during weekly retrospectives",
    status: "confirmed",
    created_at: getOffsetIso(9, 20, 30),
  },
  {
    id: "rel_demo_13",
    from_memory_id: "mem_demo_03",
    to_memory_id: "mem_demo_01",
    type: "decision_outcome",
    origin: "manual",
    reason: "严谨的开源技术选型 SOP 严格指导了 AetherOS 核心组件的技术栈落地",
    reason_zh: "严谨的开源技术选型 SOP 严格指导了 AetherOS 核心组件的技术栈落地",
    reason_en: "The empirical technology evaluation SOP strictly governed the selection of core libraries for AetherOS",
    status: "confirmed",
    created_at: getOffsetIso(1, 17, 0),
  },
  {
    id: "rel_demo_14",
    from_memory_id: "mem_demo_02",
    to_memory_id: "mem_demo_12",
    type: "same_topic",
    origin: "rule_based",
    reason: "周度复盘机制定期检验群岛原则在日常事务中的执行纯度与偏离度",
    reason_zh: "周度复盘机制定期检验群岛原则在日常事务中的执行纯度与偏离度",
    reason_en: "The weekly review cadence regularly audits adherence to the Archipelago deep work principle",
    status: "confirmed",
    created_at: getOffsetIso(9, 21, 0),
  },
  {
    id: "rel_demo_15",
    from_memory_id: "mem_demo_10",
    to_memory_id: "mem_demo_01",
    type: "same_project",
    origin: "manual",
    reason: "晨间无滤镜意识流小票是构建个人数字分身最鲜活的原生微观切片",
    reason_zh: "晨间无滤镜意识流小票是构建个人数字分身最鲜活的原生微观切片",
    reason_en: "Morning unfiltered stream slips supply the raw cognitive atoms for training the digital sub-myself",
    status: "confirmed",
    created_at: getOffsetIso(0, 8, 30),
  },
  {
    id: "rel_demo_16",
    from_memory_id: "mem_demo_06",
    to_memory_id: "mem_demo_03",
    type: "same_topic",
    origin: "ai_suggested",
    reason: "数值计算的严苛收敛检验与工程选型的基准实测理念一脉相承",
    reason_zh: "数值计算的严苛收敛检验与工程选型的基准实测理念一脉相承",
    reason_en: "Mathematical convergence testing and empirical engineering benchmarking share the exact same verification mindset",
    status: "confirmed",
    created_at: getOffsetIso(3, 12, 0),
  },
  {
    id: "rel_demo_17",
    from_memory_id: "mem_demo_09",
    to_memory_id: "mem_demo_08",
    type: "same_project",
    origin: "manual",
    reason: "本地 Markdown 与 Git 版本树为双向链接图谱提供了白盒、透明的物理存储载体",
    reason_zh: "本地 Markdown 与 Git 版本树为双向链接图谱提供了白盒、透明的物理存储载体",
    reason_en: "Local Markdown and Git trees provide the transparent, white-box physical substrate for the knowledge graph",
    status: "confirmed",
    created_at: getOffsetIso(6, 14, 30),
  },
  {
    id: "rel_demo_18",
    from_memory_id: "mem_demo_07",
    to_memory_id: "mem_demo_05",
    type: "semantic_similarity",
    origin: "ai_suggested",
    reason: "界面美学的克制留白与语言沟通的去冗余包装在美学本质上高度统一",
    reason_zh: "界面美学的克制留白与语言沟通的去冗余包装在美学本质上高度统一",
    reason_en: "Restrained visual whitespace and no-fluff communication share the exact same aesthetic essence of subtraction",
    status: "confirmed",
    created_at: getOffsetIso(4, 18, 30),
  },
];

/**
 * 为长尾记忆自动推导连线。
 *
 * 为什么需要：长尾生成的 124 条记忆原先 `relations: []`，而手写关系只有 18 条，
 * 于是图谱是「136 个节点 / 18 条边」—— 力导向布局没有弹簧，节点只能互相排斥，
 * 最后散成一片尘点，fit-to-screen 缩到 15% 触发「点模式」，整个图谱看起来是空的。
 * 这是我在 audit-ui 里截图才发现的，单测完全看不出来。
 *
 * 规则：按 topic 分组，把同组记忆按时间串成链（组内相邻相连）。
 * 这样天然形成「以主题为中心」的簇，视觉上是有结构的星团而不是随机散布。
 *
 * 刻意保持确定性（用 id 组合做种子），否则每次刷新图谱形状都会变，
 * 演示视频没法复现。
 */
function deriveTopicRelationships(
  memories: CanonicalMemory[],
  existing: Relationship[]
): Relationship[] {
  const out: Relationship[] = [...existing];
  const seen = new Set(
    existing.map((r) =>
      r.from_memory_id < r.to_memory_id
        ? `${r.from_memory_id}__${r.to_memory_id}`
        : `${r.to_memory_id}__${r.from_memory_id}`
    )
  );

  // topic → 该主题下的记忆（按时间升序）
  const byTopic = new Map<string, CanonicalMemory[]>();
  for (const m of memories) {
    for (const t of m.topics) {
      const list = byTopic.get(t);
      if (list) list.push(m);
      else byTopic.set(t, [m]);
    }
  }

  // 主题按成员数降序，让信息量大的主题先连
  const topics = [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [topic, group] of topics) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

    // 组内相邻相连；用 id 对做种子，跳过约 35% 避免变成一条死板的链
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const key = a.id < b.id ? `${a.id}__${b.id}` : `${b.id}__${a.id}`;
      if (seen.has(key)) continue;

      const rnd = seededRandom(`edge:${key}`);
      if (rnd() > 0.65) continue;

      seen.add(key);
      out.push({
        id: `rel_seed_${a.id}_${b.id}`,
        from_memory_id: a.id,
        to_memory_id: b.id,
        type: "same_topic",
        origin: "rule_based",
        reason: `共同属于 #${topic} 思考流`,
        reason_zh: `共同属于 #${topic} 思考流`,
        reason_en: `Shared stream #${topic}`,
        status: "confirmed",
        created_at: a.occurred_at,
      });
    }
  }

  return out;
}

/**
 * 组装演示数据集。
 *
 * 两个表示必须同步：`relationships`（图谱的边）和每条记忆自己的 `relations`
 * （T2 卡片上「相关节点」的 chip）。历史上只填了前者，所以 T2 的 chip 永远是空的。
 * 这里从同一份边集反向回填，保证两边永远一致。
 */
function buildDemoGraph() {
  const memories: CanonicalMemory[] = [
    ...getDynamicSeedMemories(),
    ...getLongTailSeedMemories(),
  ];

  const relationships = deriveTopicRelationships(memories, HANDWRITTEN_RELATIONSHIPS);

  const byId = new Map(memories.map((m) => [m.id, m]));
  for (const m of memories) {
    m.relations = Array.from(new Set(m.relations)); // 手写的那 12 条已有关系，先去重
  }
  for (const rel of relationships) {
    const from = byId.get(rel.from_memory_id);
    const to = byId.get(rel.to_memory_id);
    if (from && !from.relations.includes(rel.to_memory_id)) {
      from.relations.push(rel.to_memory_id);
    }
    if (to && !to.relations.includes(rel.from_memory_id)) {
      to.relations.push(rel.from_memory_id);
    }
  }

  return { memories, relationships };
}

const DEMO_GRAPH = buildDemoGraph();

export const SEED_MEMORIES: CanonicalMemory[] = DEMO_GRAPH.memories;
export const SEED_RELATIONSHIPS: Relationship[] = DEMO_GRAPH.relationships;

export const SEED_COLLECTIONS: Collection[] = [
  {
    id: "col_aether_os",
    name: "AetherOS 系统与数字分身",
    name_zh: "AetherOS 系统与数字分身",
    name_en: "AetherOS Architecture & Digital Twin",
    description: "AetherOS 产品架构实践、Human-in-the-Loop 工作流与精力管理决策。",
    description_zh: "AetherOS 产品架构实践、Human-in-the-Loop 工作流与精力管理决策。",
    description_en: "AetherOS system architecture, Human-in-the-Loop workflows, and deep work prioritization.",
    slug: "aether-os",
    memory_ids: ["mem_demo_01", "mem_demo_02", "mem_demo_08", "mem_demo_10"],
    color: "#C97A63",
    created_at: getOffsetIso(0, 16, 0),
  },
  {
    id: "col_methodology",
    name: "技术选型与认知方法论",
    name_zh: "技术选型与认知方法论",
    name_en: "Technology Selection & Methodologies",
    description: "GitHub 压测选型 SOP、独立思考底层价值观与本地优先数据主权。",
    description_zh: "GitHub 压测选型 SOP、独立思考底层价值观与本地优先数据主权。",
    description_en: "Empirical GitHub stress testing SOP, intellectual autonomy values, and local-first data sovereignty.",
    slug: "methodology",
    memory_ids: ["mem_demo_03", "mem_demo_04", "mem_demo_09", "mem_demo_11"],
    color: "#5B7B94",
    created_at: getOffsetIso(1, 17, 30),
  },
  {
    id: "col_aesthetics_cognition",
    name: "通感设计与认知演进",
    name_zh: "通感设计与认知演进",
    name_en: "Synesthetic Design & Cognitive Evolution",
    description: "纸张触感与机械微音效通感美学、算法凸性推演与周度复盘演进体系。",
    description_zh: "纸张触感与机械微音效通感美学、算法凸性推演与周度复盘演进体系。",
    description_en: "Tactile paper acoustics, dynamic system convexity, and weekly knowledge evolution cadence.",
    slug: "aesthetics-evolution",
    memory_ids: ["mem_demo_05", "mem_demo_06", "mem_demo_07", "mem_demo_12"],
    color: "#C49A56",
    created_at: getOffsetIso(2, 15, 30),
  },
];
