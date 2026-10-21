import { z } from "zod";

export const BuiltinMemoryTypeEnum = z.enum([
  "moment",
  "idea",
  "learning",
  "decision",
  "plan",
  "achievement",
  "collection",
  "receipt",
  "generic",
  "fact",
]);

export const MemoryTypeSchema = z.string().min(1).default("moment");
export const MemoryTypeEnum = MemoryTypeSchema;
export type MemoryType = string;

export const MemoryTimelineLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  content: z.string(),
  media_url: z.string().optional(),
});
export type MemoryTimelineLog = z.infer<typeof MemoryTimelineLogSchema>;

export const MORANDI_PIGMENTS = [
  { hex: "#C97A63", nameZh: "陶土砖红", nameEn: "Terracotta Red" },
  { hex: "#C49A56", nameZh: "琥珀姜黄", nameEn: "Amber Ochre" },
  { hex: "#5B7B94", nameZh: "冰海雾蓝", nameEn: "Fjord Blue" },
  { hex: "#7C6F93", nameZh: "暮山紫藤", nameEn: "Twilight Violet" },
  { hex: "#608066", nameZh: "苍翠鼠尾", nameEn: "Sage Green" },
  { hex: "#5A7D8F", nameZh: "烟灰石青", nameEn: "Slate Cyan" },
  { hex: "#8A7968", nameZh: "暖沙驼褐", nameEn: "Warm Taupe" },
  { hex: "#4A6B82", nameZh: "暮霭黛蓝", nameEn: "Deep Indigo" },
  { hex: "#A0707E", nameZh: "烟粉灰玫", nameEn: "Dusty Rose" },
  { hex: "#A66B4E", nameZh: "焦糖暖赭", nameEn: "Warm Ochre" },
];

export const DEFAULT_TYPE_COLORS: Record<string, string> = {
  idea: "#C97A63",
  learning: "#5B7B94",
  moment: "#C49A56",
  decision: "#7C6F93",
  plan: "#608066",
  achievement: "#A66B4E",
  collection: "#5A7D8F",
  receipt: "#4A423D",
  generic: "#78716C",
  fact: "#4A6B82",
};

export const BUILTIN_TYPE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  idea: { bg: "bg-[#C97A63]", text: "text-white", hex: "#C97A63" },
  learning: { bg: "bg-[#5B7B94]", text: "text-white", hex: "#5B7B94" },
  moment: { bg: "bg-[#C49A56]", text: "text-white", hex: "#C49A56" },
  decision: { bg: "bg-[#7C6F93]", text: "text-white", hex: "#7C6F93" },
  plan: { bg: "bg-[#608066]", text: "text-white", hex: "#608066" },
  achievement: { bg: "bg-[#A66B4E]", text: "text-white", hex: "#A66B4E" },
  collection: { bg: "bg-[#5A7D8F]", text: "text-white", hex: "#5A7D8F" },
  receipt: { bg: "bg-[#4A423D]", text: "text-white", hex: "#4A423D" },
  generic: { bg: "bg-[#78716C]", text: "text-white", hex: "#78716C" },
  fact: { bg: "bg-[#4A6B82]", text: "text-white", hex: "#4A6B82" },
};

export function getMemoryTypeBadgeStyle(
  type: string,
  customColorMap?: Record<string, string>
): { bgClass: string; hex: string } {
  const norm = (type || "").toLowerCase().trim();
  if (customColorMap && customColorMap[norm]) {
    const hex = customColorMap[norm];
    return {
      bgClass: "text-white",
      hex,
    };
  }
  if (BUILTIN_TYPE_COLORS[norm]) {
    return {
      bgClass: `${BUILTIN_TYPE_COLORS[norm].bg} ${BUILTIN_TYPE_COLORS[norm].text}`,
      hex: BUILTIN_TYPE_COLORS[norm].hex,
    };
  }
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const color = MORANDI_PIGMENTS[Math.abs(hash) % MORANDI_PIGMENTS.length];
  return {
    bgClass: "text-white",
    hex: color.hex,
  };
}

export const ProvenanceSchema = z.object({
  capture_method: z.enum(["manual", "ai_assisted", "import", "quick_add"]).default("manual"),
  ai_generated: z.boolean().default(false),
  original_prompt: z.string().optional(),
  source: z.string().optional(),
});

export const MemoryLevelEnum = z.enum(["L0", "L1", "L2", "L3", "L4"]);
export type MemoryLevel = z.infer<typeof MemoryLevelEnum>;

export interface MemoryLevelMeta {
  code: MemoryLevel;
  name: string;
  nameEn: string;
  nameZh: string;
  shortZh: string;
  shortEn: string;
  descZh: string;
  descEn: string;
  color: string;
  bgBadge: string;
}

export const MEMORY_LEVELS_META: Record<MemoryLevel, MemoryLevelMeta> = {
  L0: {
    code: "L0",
    name: "Raw Stream",
    nameEn: "Raw Stream",
    nameZh: "原始日志",
    shortZh: "流水",
    shortEn: "Raw",
    descZh: "生活碎片、瞬时灵感、随手记日记与工作流水",
    descEn: "Raw stream of daily moments, fleeting thoughts, and unfiltered notes",
    color: "#C49A56",
    bgBadge: "bg-[#C49A56] text-white",
  },
  L1: {
    code: "L1",
    name: "Key Events",
    nameEn: "Key Events",
    nameZh: "关键经历",
    shortZh: "经历",
    shortEn: "Events",
    descZh: "关键项目推进、重要决策、胜仗与里程碑事件",
    descEn: "Milestones, pivotal decisions, achievements, and key life events",
    color: "#C97A63",
    bgBadge: "bg-[#C97A63] text-white",
  },
  L2: {
    code: "L2",
    name: "Habits & SOPs",
    nameEn: "Habits & SOPs",
    nameZh: "习惯准则",
    shortZh: "习惯",
    shortEn: "Habits",
    descZh: "验证过的工作法、个人习惯偏好、技术 SOP 与行为准则",
    descEn: "Personal habits, technical SOPs, reusable workflows, and rules",
    color: "#5B7B94",
    bgBadge: "bg-[#5B7B94] text-white",
  },
  L3: {
    code: "L3",
    name: "Mental Models",
    nameEn: "Mental Models",
    nameZh: "心智模型",
    shortZh: "心智",
    shortEn: "Models",
    descZh: "核心沟通风格、认知心智模型、深度思考框架与处事模式",
    descEn: "Cognitive frameworks, thinking heuristics, and mental models",
    color: "#3A4B58",
    bgBadge: "bg-[#3A4B58] text-white",
  },
  L4: {
    code: "L4",
    name: "Core Principles",
    nameEn: "Core Principles",
    nameZh: "核心原则",
    shortZh: "原则",
    shortEn: "Principles",
    descZh: "第一性原理、底层价值观、不可妥协的人生信条与判断底线",
    descEn: "First principles, foundational beliefs, and core life values",
    color: "#7C6F93",
    bgBadge: "bg-[#7C6F93] text-white",
  },
};

export function getMemoryLevelBadge(level: MemoryLevel | string, lang: "zh" | "en" = "zh"): string {
  const meta = MEMORY_LEVELS_META[level as MemoryLevel];
  if (!meta) return lang === "zh" ? "原文" : "Raw";
  return lang === "zh" ? meta.shortZh : meta.shortEn;
}

export const MemoryStarImpactSchema = z.object({
  situation: z.string().optional(),
  task: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  raw_notes: z.string().optional(),
});
export type MemoryStarImpact = z.infer<typeof MemoryStarImpactSchema>;

export const CanonicalMemorySchema = z.object({
  schema_version: z.literal("1.0").default("1.0"),
  id: z.string(),
  type: MemoryTypeSchema.default("moment"),
  title: z.string().min(1, "Title is required"),
  title_zh: z.string().optional(),
  title_en: z.string().optional(),
  content: z.string().default(""),
  content_zh: z.string().optional(),
  content_en: z.string().optional(),
  language: z.enum(["en", "zh"]).default("en"),
  occurred_at: z.string(), // ISO string
  recorded_at: z.string(), // ISO string
  updated_at: z.string(), // ISO string
  topics: z.array(z.string()).default([]),
  source_ids: z.array(z.string()).default([]),
  relations: z.array(z.string()).default([]),
  confidence: z.number().nullable().default(null),
  status: z.enum(["active", "archived", "deleted"]).default("active"),
  provenance: ProvenanceSchema.default({ capture_method: "manual", ai_generated: false }),
  pinned: z.boolean().optional(),
  color_accent: z.string().optional(),
  media_url: z.string().optional(),
  memory_level: MemoryLevelEnum.optional(),
  timeline_logs: z.array(MemoryTimelineLogSchema).default([]).optional(),
  star: MemoryStarImpactSchema.optional(),
});

export type CanonicalMemory = z.infer<typeof CanonicalMemorySchema>;

// Offline Chinese dictionary fallback for canonical and common concepts
const FALLBACK_ZH_DICT: Record<string, string> = {
  // Titles
  "Broadway Boogie Woogie as an Information Grid": "作为离散信息网格的百老汇爵士乐",
  "Morning coffee & autumn breeze over the balcony": "晨间咖啡与阳台掠过的秋风",
  "GitHub as Canonical Storage instead of Postgres": "以 GitHub 为主数据存储而非 Postgres",
  "Sonia Delaunay's Orphism & Simultaneity": "索尼亚·德劳内的俄耳甫斯主义与同时性对比",
  "Implement Time Travel Zoom Engine (Year-Month-Day)": "实现时空穿梭缩放引擎 (年-月-日)",
  "Vintage poster hunt in Daikanyama bookstore": "代官山旧书店的复古海报淘金记",
  "Ray & Charles Eames 'Powers of Ten' Philosophy": "伊姆斯夫妇《十的次方》哲学",
  "Daily Receipt as an Editorial Souvenir": "作为生活特刊的每日记忆小票",
  "Bilingual First: English & Simplified Chinese Equality": "双语平权：英文与简体中文独立演进",
  "Mid-autumn lantern festival along the canal": "运河两岸的中秋灯会",
  "Personal Life Archive as Geometric De Stijl Canvas": "作为蒙德里安新造型画卷的个人档案馆",
  "Why local-first & user-owned sync is liberating": "本地优先与数据主权带来的解放感",
  "Design Systems & Color Plane Construction": "设计系统与色块构建",
  "Reading notes: Cal Newport on Pseudo-Productivity": "读书笔记：卡尔·纽波特论伪生产力",
  "Mondrian primary color scheme implementation": "蒙德里安三原色设计系统的工程实现",
  "Deep Flow Rhythm & Focus Environment Preferences": "心流节律与专注环境偏好",
  "First Principles & Minimalist Engineering Creed": "第一性原理与工程极简信条",
  "Rigorous Self-Driven Inquirer Persona": "严谨自驱的探究者画像",
  "You+ Cognitive Digital Sub-Myself Architecture & Human-in-the-Loop": "You+ 个人认知与数字分身系统架构实践",
  "Product Architecture Focus & Deep Work Over Low-Density Socializing": "产品架构聚焦与高阶精力管理：拒绝低效社交",
  "Katherine's Technology Selection Framework & Verification SOP": "技术选型 SOP：GitHub 活跃度与本地压测验证",
  "Core Value: Intellectual Autonomy Over Conforming to Authority": "底层价值观：独立思考比盲从权威重要得多",
  "Personal Habit: High-Density & Direct Communication": "个人偏好与习惯：高信息密度的极简交流",
  "Reading Notes: Semi-Annual Bond Pricing, Convexity & YTM": "读书笔记：《固定收益证券》债券定价公式与 YTM 凸性反求",
  "Reading Notes: Sensorial Synesthesia in Li Bai & Vico's 'Senses of Humanity'": "读书笔记：《惊艳唐诗》李白诗歌与通感联觉、维科论诗人",
  "Obsidian Bi-directional Graph & Local White-Box Vault Integration": "Obsidian 双向链接与白盒本地第二大脑构建",
  "GitHub & Local Markdown as Canonical Storage Over Cloud Blackboxes": "以 GitHub 与 Local Markdown 为主数据存储而非云端黑盒",
  // Contents
  "Mondrian's Broadway Boogie Woogie isn't just jazz on canvas; it is a discrete packetized information network. Small blocks of primary colors represent rhythm, pauses, and syncopated thoughts. We should structure memory items as living visual pulses.":
    "蒙德里安的《百老汇爵士乐》不仅是画布上的爵士乐，更是一个离散分包的信息网络。三原色小方块代表节拍、休止与切分思绪。我们应当将记忆条目构建为有呼吸的视觉脉冲。",
  "7:45 AM. The sky was an immaculate cobalt blue. Felt that crisp October shift in the air. Reminded me why intentional slow mornings yield 10x better creative clarity.":
    "清晨 7:45。天空呈现澄澈的钴蓝色，空气中透着十月的清冽爽朗。这提醒了我：从容克制的晨间节律往往能带来十倍清晰的创造力。",
  "Decided to use GitHub Git tree & raw markdown/json files as user-owned persistence. Tradeoff: higher write latency, but zero lock-in, free version control history, and full sovereignty.":
    "决定采用 GitHub Git 树和原始 Markdown/JSON 文件作为用户自驱存储。虽然牺牲了微秒级写入延迟，但换来了零锁定、永久版本树与数据自主权。",
  "Discovered Delaunay's simultaneous contrast theory: colors placed side-by-side create optical motion and vibration without physical movement. Applying this to memory proximity makes adjacent cards resonate.":
    "领悟德劳内的同时性对比理论：并置的色彩无需物理位移即可在视网膜上产生振颤与动态。将其应用于记忆卡片排列，相邻记忆将自然产生概念共鸣。",
  "Design seamless semantic zoom: All Time overview displays harmonic mosaic clusters, zooming in unfolds monthly distribution, then day-level memory canvas.":
    "设计无缝语义缩放：全景视图呈现和谐的马赛克聚类，推近展开月份分布，微观落入日级记忆画布。",
  "Found an original 1968 Constructivism typography print. The stark red diagonal slash against raw newsprint paper gave immediate inspiration for Dayprint's card badges.":
    "淘到一张 1968 年构成主义排版印刷原作。原色粗报纸上鲜艳的红色对角线，为 Dayprint 的标签与构图带来了直接灵感。",
  "Zooming out reveals overarching life patterns; zooming in reveals immediate tactile sensations. The UI must preserve the observer's spatial anchor across all scales.":
    "远眺显现人生宏观脉络，近察触碰瞬时肌理触感。界面必须在所有尺度变换中始终保持观察者的空间锚点。",
  "At the end of each day, synthesize memories into a ticket/receipt format: thermal receipt typography, perforated edges, highlights of moments, decisions, and tomorrow's open loops.":
    "在每晚将当日记忆凝练为生活小票格式：热敏票据排版、锯齿裂边、高光碎片与明日计划，沉淀为有温度的回响。",
  "Support seamless toggle between English and Simplified Chinese without cross-pollution. Each language can be refined independently, ensuring native phrasing in both.":
    "支持英文与简体中文无缝切换，两种语言版本各自独立校准演进，互不干扰，确保两种语境下皆具备原生自然表达。",
  "The water reflected hundreds of warm floating paper lanterns. Stood there for forty minutes listening to the gentle murmur of the crowd. A memory of profound quietude.":
    "运河水面映照着数百盏漂浮的暖黄纸灯。静静伫立四十分钟聆听细语，是一段沉静深刻的个人记忆。",
  "Why are personal knowledge tools either nested folders or graph webs with chaotic force-directed physics? De Stijl brings order, clean balance, and human beauty to personal retrospection.":
    "为何个人工具往往走向层级文件夹或混沌乱动的图谱？新造型主义为个人的回响沉淀赋予了严谨秩序、克制平衡与美学温度。",
  "Read the Local-First software manifesto. The feeling of never having your private thoughts held hostage by cloud subscription gates or proprietary binary databases is priceless.":
    "精读本地优先软件宣言。私密思绪永远不会被云端订阅门槛或专有私有数据库所劫持，这种掌控感无可替代。",
};

// Offline English dictionary fallback (ZH -> EN)
const FALLBACK_EN_DICT: Record<string, string> = {
  // Titles
  "作为离散信息网格的百老汇爵士乐": "Broadway Boogie Woogie as an Information Grid",
  "晨间咖啡与阳台掠过的秋风": "Morning coffee & autumn breeze over the balcony",
  "以 GitHub 为主数据存储而非 Postgres": "GitHub as Canonical Storage instead of Postgres",
  "索尼亚·德劳内的俄耳甫斯主义与同时性对比": "Sonia Delaunay's Orphism & Simultaneity",
  "实现时空穿梭缩放引擎 (年-月-日)": "Implement Time Travel Zoom Engine (Year-Month-Day)",
  "代官山旧书店的复古海报淘金记": "Vintage poster hunt in Daikanyama bookstore",
  "伊姆斯夫妇《十的次方》哲学": "Ray & Charles Eames 'Powers of Ten' Philosophy",
  "作为生活特刊的每日记忆小票": "Daily Receipt as an Editorial Souvenir",
  "双语平权：英文与简体中文独立演进": "Bilingual First: English & Simplified Chinese Equality",
  "运河两岸的中秋灯会": "Mid-autumn lantern festival along the canal",
  "作为蒙德里安新造型画卷的个人档案馆": "Personal Life Archive as Geometric De Stijl Canvas",
  "本地优先与数据主权带来的解放感": "Why local-first & user-owned sync is liberating",
  "设计系统与色块构建": "Design Systems & Color Plane Construction",
  "读书笔记：卡尔·纽波特论伪生产力": "Reading notes: Cal Newport on Pseudo-Productivity",
  "蒙德里安三原色设计系统的工程实现": "Mondrian primary color scheme implementation",
  "心流节律与专注环境偏好": "Deep Flow Rhythm & Focus Environment Preferences",
  "第一性原理与工程极简信条": "First Principles & Minimalist Engineering Creed",
  "严谨自驱的探究者画像": "Rigorous Self-Driven Inquirer Persona",
  "You+ 个人认知与数字分身系统架构实践": "You+ Cognitive Digital Sub-Myself Architecture & Human-in-the-Loop",
  "产品架构聚焦与高阶精力管理：拒绝低效社交": "Product Architecture Focus & Deep Work Over Low-Density Socializing",
  "技术选型 SOP：GitHub 活跃度与本地压测验证": "Katherine's Technology Selection Framework & Verification SOP",
  "底层价值观：独立思考比盲从权威重要得多": "Core Value: Intellectual Autonomy Over Conforming to Authority",
  "个人偏好与习惯：高信息密度的极简交流": "Personal Habit: High-Density & Direct Communication",
  "读书笔记：《固定收益证券》债券定价公式与 YTM 凸性反求": "Reading Notes: Semi-Annual Bond Pricing, Convexity & YTM",
  "读书笔记：《惊艳唐诗》李白诗歌与通感联觉、维科论诗人": "Reading Notes: Sensorial Synesthesia in Li Bai & Vico's 'Senses of Humanity'",
  "Obsidian 双向链接与白盒本地第二大脑构建": "Obsidian Bi-directional Graph & Local White-Box Vault Integration",
  "以 GitHub 与 Local Markdown 为主数据存储而非云端黑盒": "GitHub & Local Markdown as Canonical Storage Over Cloud Blackboxes",
};

const SEED_MEMORIES_ZH_MAP: Record<string, { title: string; content: string }> = {
  mem_you_01: {
    title: "You+ 个人认知与数字分身系统架构实践",
    content: "规划并主导 You+ 个人认知系统的整体产品架构。采用飞书作为用户交互前端，底层基于 Python 与 Gemini LLM 构建数字分身大脑。设计 Human-in-the-Loop 记忆提炼流：用户发送日常消息 -> 大模型智能提炼记忆卡片 -> 飞书交互卡片主动推送 -> 用户通过快捷指令（确认/1）沉淀入库，实现零干扰、可控性强的个人知识资产闭环。",
  },
  mem_you_02: {
    title: "产品架构聚焦与高阶精力管理：拒绝低效社交",
    content: "早期开发中职责边界不清晰容易导致精力分散，需明确产品架构师的核心专注点。明确自身核心定位为产品架构与交互设计（Product Architecture & UX），后端编码由系统工具与开发者配合完成。系统性拒绝无意义的低效社交聚会，将 100% 精力倾注于核心产品逻辑打磨与知识沉淀，显著提升了 You+ 系统的产品迭代速率与交互质量。",
  },
  mem_you_03: {
    title: "技术选型 SOP：GitHub 活跃度与本地压测验证",
    content: "形成了一套实用的技术选型流程：1. 先查看 GitHub star 长期增长趋势与分叉活跃度；2. 评估 issue 活跃度与 PR 合并速度，判断社区维护质量；3. 编写本地 demo 进行极限压测验证真实表现。核心准则与禁忌：坚决不盲从官方宣传与营销宣讲，不迷信文档承诺，一切用真实硬件基准与代码表现说话。",
  },
  mem_you_04: {
    title: "底层价值观：独立思考比盲从权威重要得多",
    content: "认为独立思考比盲从权威重要得多。在信息爆炸与大模型同质化泛滥的时代，外界观点极其廉价，唯有基于第一性原理推导的心智模型和亲身实证才能构成个人护城河。打算在 3 年内独立创业做一个兼具极简美学、白盒可控性与真正用户数据主权的 AI 工具。",
  },
  mem_you_05: {
    title: "个人偏好与习惯：高信息密度的极简交流",
    content: "倾向于极简、高信息密度的交流方式。厌恶低信噪比的繁复客套与冗余包装，主张直击问题根源、逻辑闭环与因果链条。“少即是多（Less is more）”，无论在沟通、代码、设计还是生活日程中，删除冗余都是最高阶的优雅。",
  },
  mem_you_06: {
    title: "读书笔记：《固定收益证券》债券定价公式与 YTM 凸性反求",
    content: "半年付息固定利率债券定价公式：P = ∑(j=1 to 2n) [M × (c/2) / (1 + x/2)^j] + [M / (1 + x/2)^(2n)]。\n\n感悟要点：\n1. 反求收益率（YTM）本质：债券市价 P 与到期收益率 x 呈反向非线性凸性（Convexity）关系。二级市场上给定的通常是交易市价 P，必须通过数值方法（如牛顿迭代法或内插逼近法）反求内部报酬率 x。\n2. 付息频率校准：国内与美债市场多采用半年付息（Semi-annual compounding），在计算久期（Macaulay Duration）及基点价值（DV01）时，需严格将半期贴现率折半并乘以 2 进行年化校准。",
  },
  mem_you_07: {
    title: "读书笔记：《惊艳唐诗》李白诗歌与通感联觉、维科论诗人",
    content: "意大利学者维科在《新科学》中论述：“诗人们首先凭凡俗智慧感受到的有多少，后来哲学家们凭玄奥智慧未理解的也就有多少，所以诗人们可以说就是人类的感官，而哲学家们就是人类的理智。”\n\n个人感悟：李白诗中的通感（联觉），不仅是修辞技法，更是感官经验的互渗与重组。当视觉、嗅觉、触觉在诗意中融为一体，并叠加上“雨露恩泽”等传统文化的隐喻时，诗歌便超越了单一知觉，铸就出兼具感官张力与历史厚度的复合美感造型。优秀的界面设计同样遵循通感原则——通过纸张纹理、毛玻璃透光与温润音效唤醒指尖触感。",
  },
  mem_you_08: {
    title: "Obsidian 双向链接与白盒本地第二大脑构建",
    content: "通过 Markdown Frontmatter 与 [[Wiki-Links]] 构建个人第二大脑：涵盖 01_Persona、02_Work、03_Learning、04_Preferences、05_Reading 五大核心目录。实体包括 Python、飞书、Gemini、Product Architecture Design 与 You+，实现了人设、技能、工作产出与知识阅读的立交桥式全息关联，摆脱任何云端专有数据库劫持。",
  },
  mem_you_09: {
    title: "以 GitHub 与 Local Markdown 为主数据存储而非云端黑盒",
    content: "坚定采用用户自有的本地 Markdown 树和 GitHub Git 树作为主数据存储。虽然牺牲了微秒级写入延迟，但彻底换取了零厂商锁定、不可篡改的版本树历史、与 Obsidian/VSCode 的天然兼容性，以及 100% 的个人数据主权。",
  },
  mem_20261013_today_01: {
    title: "作为离散信息网格的百老汇爵士乐",
    content: "蒙德里安的《百老汇爵士乐》不仅是画布上的爵士乐，更是一个离散分包的信息网络。三原色小方块代表节拍、休止与切分思绪。我们应当将记忆条目构建为有呼吸的视觉脉冲。",
  },
  mem_20261013_today_02: {
    title: "晨间咖啡与阳台掠过的秋风",
    content: "清晨 7:45。天空呈现澄澈的钴蓝色，空气中透着十月的清冽爽朗。这提醒了我：从容克制的晨间节律往往能带来十倍清晰的创造力。",
  },
  mem_20261012_01: {
    title: "以 GitHub 为主数据存储而非 Postgres",
    content: "决定采用 GitHub Git 树和原始 Markdown/JSON 文件作为用户自驱存储。虽然牺牲了微秒级写入延迟，但换来了零锁定、永久版本树与数据自主权。",
  },
  mem_20261012_02: {
    title: "索尼亚·德劳内的俄耳甫斯主义与同时性对比",
    content: "领悟德劳内的同时性对比理论：并置的色彩无需物理位移即可在视网膜上产生振颤与动态。将其应用于记忆卡片排列，相邻记忆将自然产生概念共鸣。",
  },
  mem_20261011_01: {
    title: "实现时空穿梭缩放引擎 (年-月-日)",
    content: "设计无缝语义缩放：全景视图呈现和谐的马赛克聚类，推近展开月份分布，微观落入日级记忆画布。",
  },
  mem_20261010_01: {
    title: "代官山旧书店的复古海报淘金记",
    content: "淘到一张 1968 年构成主义排版印刷原作。原色粗报纸上鲜艳的红色对角线，为 Dayprint 的标签与构图带来了直接灵感。",
  },
  mem_20261010_02: {
    title: "伊姆斯夫妇《十的次方》哲学",
    content: "远眺显现人生宏观脉络，近察触碰瞬时肌理触感。界面必须在所有尺度变换中始终保持观察者的空间锚点。",
  },
  mem_20261010_03: {
    title: "作为生活特刊的每日记忆小票",
    content: "在每晚将当日记忆凝练为生活小票格式：热敏票据排版、锯齿裂边、高光碎片与明日计划，沉淀为有温度的回响。",
  },
  mem_20260928_01: {
    title: "双语平权：英文与简体中文独立演进",
    content: "支持英文与简体中文无缝切换，两种语言版本各自独立校准演进，互不干扰，确保两种语境下皆具备原生自然表达。",
  },
  mem_20260915_01: {
    title: "运河两岸的中秋灯会",
    content: "运河水面映照着数百盏漂浮的暖黄纸灯。静静伫立四十分钟聆听细语，是一段沉静深刻的个人记忆。",
  },
  mem_20260821_01: {
    title: "作为蒙德里安新造型画卷的个人档案馆",
    content: "为何个人工具往往走向层级文件夹或混沌乱动的图谱？新造型主义为个人的回响沉淀赋予了严谨秩序、克制平衡与美学温度。",
  },
  mem_20260704_01: {
    title: "本地优先与数据主权带来的解放感",
    content: "精读本地优先软件宣言。私密思绪永远不会被云端订阅门槛或专有私有数据库所劫持，这种掌控感无可替代。",
  },
};

const SEED_MEMORIES_EN_MAP: Record<string, { title: string; content: string }> = {
  mem_you_01: {
    title: "You+ Cognitive Digital Sub-Myself Architecture & Human-in-the-Loop",
    content: "Architected the You+ personal cognitive operating system. Utilized Feishu as the conversational frontend with Python and Gemini LLM as the cognitive brain. Designed a Human-in-the-Loop workflow: user chats casually -> LLM distills structured memory fragments -> interactive Feishu card prompts verification -> one-click confirmation persists into local Obsidian vault.",
  },
  mem_you_02: {
    title: "Product Architecture Focus & Deep Work Over Low-Density Socializing",
    content: "Clarified core positioning as Product Architect & UX Designer, focusing on macro system logic, user journey, and high-leverage product decisions. Systematically eliminated low-density social obligations to achieve deep focus on product craftsmanship, dramatically accelerating You+ system iterations.",
  },
  mem_you_03: {
    title: "Katherine's Technology Selection Framework & Verification SOP",
    content: "Established a rigorous technology selection framework: 1. Inspect GitHub star growth trends and fork health; 2. Evaluate issue triage velocity and PR merge latency; 3. Write local testbed demos and run stress testing to verify real performance. Core taboo: Never rely solely on marketing hype or vendor documentation claims.",
  },
  mem_you_04: {
    title: "Core Value: Intellectual Autonomy Over Conforming to Authority",
    content: "Firm belief that independent critical thinking vastly outweighs obedience to conventional authority. In an era of AI homogenization, external opinions are cheap; only proprietary mental models and empirical first-principles reasoning form a durable moat. Intends to launch an independent AI product within 3 years.",
  },
  mem_you_05: {
    title: "Personal Habit: High-Density & Direct Communication",
    content: "Prefers concise, high-density communication with zero conversational fluff. Cuts straight to root causes, empirical evidence, and causal chains. Deletion is the ultimate sophistication in dialogue, code, and daily routines.",
  },
  mem_you_06: {
    title: "Reading Notes: Semi-Annual Bond Pricing, Convexity & YTM",
    content: "Semi-annual coupon bond pricing: P = ∑ [M*(c/2) / (1 + x/2)^j] + [M / (1 + x/2)^(2n)]. Bond price P and YTM x share an inverse non-linear convex relationship. Numerical solvers (Newton-Raphson) are required to back-solve yield from market price. Macaulay duration and DV01 require rigorous semi-annual compounding calibration.",
  },
  mem_you_07: {
    title: "Reading Notes: Sensorial Synesthesia in Li Bai & Vico's 'Senses of Humanity'",
    content: "From Giambattista Vico's New Science: 'Poets were the senses, philosophers the intellect of humanity.' Li Bai's synesthetic poetry is an interpenetration of sensory experiences. When sight, sound, and touch merge with historical metaphors, it achieves multidimensional aesthetic depth. Exceptional UI design follows the same principle, using paper textures, frosted glass blurs, and tactile sound.",
  },
  mem_you_08: {
    title: "Obsidian Bi-directional Graph & Local White-Box Vault Integration",
    content: "Built a local second brain vault with Obsidian [[Wiki-Links]] and structured Markdown across 5 core modules (Persona, Work, Learning, Habits, Reading). Connected entities across Python, Feishu, Gemini, and Product Architecture Design into an interoperable knowledge graph.",
  },
  mem_you_09: {
    title: "GitHub & Local Markdown as Canonical Storage Over Cloud Blackboxes",
    content: "Adopted local Markdown and GitHub repositories as the primary persistence layer. Traded away microsecond cloud latency for zero vendor lock-in, tamper-evident commit history, and complete data sovereignty.",
  },
  mem_20261013_today_01: {
    title: "Broadway Boogie Woogie as an Information Grid",
    content: "Mondrian's Broadway Boogie Woogie isn't just jazz on canvas; it is a discrete packetized information network. Small blocks of primary colors represent rhythm, pauses, and syncopated thoughts. We should structure memory items as living visual pulses.",
  },
  mem_20261013_today_02: {
    title: "Morning coffee & autumn breeze over the balcony",
    content: "7:45 AM. The sky was an immaculate cobalt blue. Felt that crisp October shift in the air. Reminded me why intentional slow mornings yield 10x better creative clarity.",
  },
  mem_20261012_01: {
    title: "GitHub as Canonical Storage instead of Postgres",
    content: "Decided to use GitHub Git tree & raw markdown/json files as user-owned persistence. Tradeoff: higher write latency, but zero lock-in, free version control history, and full sovereignty.",
  },
  mem_20261012_02: {
    title: "Sonia Delaunay's Orphism & Simultaneity",
    content: "Discovered Delaunay's simultaneous contrast theory: colors placed side-by-side create optical motion and vibration without physical movement. Applying this to memory proximity makes adjacent cards resonate.",
  },
  mem_20261011_01: {
    title: "Implement Time Travel Zoom Engine (Year-Month-Day)",
    content: "Design seamless semantic zoom: All Time overview displays harmonic mosaic clusters, zooming in unfolds monthly distribution, then day-level memory canvas.",
  },
  mem_20261010_01: {
    title: "Vintage poster hunt in Daikanyama bookstore",
    content: "Found an original 1968 Constructivism typography print. The stark red diagonal slash against raw newsprint paper gave immediate inspiration for Dayprint's card badges.",
  },
  mem_20261010_02: {
    title: "Ray & Charles Eames 'Powers of Ten' Philosophy",
    content: "Zooming out reveals overarching life patterns; zooming in reveals immediate tactile sensations. The UI must preserve the observer's spatial anchor across all scales.",
  },
  mem_20261010_03: {
    title: "Daily Receipt as an Editorial Souvenir",
    content: "At the end of each day, synthesize memories into a ticket/receipt format: thermal receipt typography, perforated edges, highlights of moments, decisions, and tomorrow's open loops.",
  },
  mem_20260928_01: {
    title: "Bilingual First: English & Simplified Chinese Equality",
    content: "Support seamless toggle between English and Simplified Chinese without cross-pollution. Each language can be refined independently, ensuring native phrasing in both.",
  },
  mem_20260915_01: {
    title: "Mid-autumn lantern festival along the canal",
    content: "The water reflected hundreds of warm floating paper lanterns. Stood there for forty minutes listening to the gentle murmur of the crowd. A memory of profound quietude.",
  },
  mem_20260821_01: {
    title: "Personal Life Archive as Geometric De Stijl Canvas",
    content: "Why are personal knowledge tools either nested folders or graph webs with chaotic force-directed physics? De Stijl brings order, clean balance, and human beauty to personal retrospection.",
  },
  mem_20260704_01: {
    title: "Why local-first & user-owned sync is liberating",
    content: "Read the Local-First software manifesto. The feeling of never having your private thoughts held hostage by cloud subscription gates or proprietary binary databases is priceless.",
  },
};

/**
 * Sanitizes memory text by removing AI-cliché emojis, star symbols, and obsolete confidence labels.
 */
export function sanitizeMemoryText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦★]/gu, "")
    .replace(/\(?\s*置信度[：:]\s*\d+%?\s*\)?/gi, "")
    .replace(/【\s+/g, "【")
    .replace(/\s+】/g, "】")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Returns localized title based on current language mode.
 * Strictly guarantees English-only in "en" mode, and Chinese-only in "zh" mode.
 */
export function getLocalizedTitle(m: CanonicalMemory, lang: "en" | "zh"): string {
  let title = "";
  if (lang === "en") {
    // 1. Prefer explicit title_en if it does not leak untranslated Chinese
    const enCand = m.title_en?.trim();
    if (enCand && (!/[\u4e00-\u9fa5]/.test(enCand) || !m.title_zh)) {
      title = enCand;
    } else if (SEED_MEMORIES_EN_MAP[m.id]?.title) {
      title = SEED_MEMORIES_EN_MAP[m.id].title;
    } else if (m.title && FALLBACK_EN_DICT[m.title]) {
      title = FALLBACK_EN_DICT[m.title];
    } else if (m.title_zh && FALLBACK_EN_DICT[m.title_zh]) {
      title = FALLBACK_EN_DICT[m.title_zh];
    } else if (m.language === "en" && m.title && !/[\u4e00-\u9fa5]/.test(m.title)) {
      title = m.title;
    } else {
      title = enCand || m.title || "Untitled Memory";
    }
  } else {
    // 1. Prefer explicit title_zh
    const zhCand = m.title_zh?.trim();
    if (zhCand) {
      title = zhCand;
    } else if (SEED_MEMORIES_ZH_MAP[m.id]?.title) {
      title = SEED_MEMORIES_ZH_MAP[m.id].title;
    } else if (m.title && FALLBACK_ZH_DICT[m.title]) {
      title = FALLBACK_ZH_DICT[m.title];
    } else if (m.title_en && FALLBACK_ZH_DICT[m.title_en]) {
      title = FALLBACK_ZH_DICT[m.title_en];
    } else if (m.language === "zh" && m.title) {
      title = m.title;
    } else {
      title = zhCand || m.title || "未命名记录";
    }
  }
  return sanitizeMemoryText(title);
}

/**
 * Returns localized content based on current language mode.
 * Strictly guarantees English-only in "en" mode, and Chinese-only in "zh" mode.
 */
export function getLocalizedContent(m: CanonicalMemory, lang: "en" | "zh"): string {
  let content = "";
  if (lang === "en") {
    const enCand = m.content_en?.trim();
    if (enCand && (!/[\u4e00-\u9fa5]/.test(enCand) || !m.content_zh)) {
      content = enCand;
    } else if (SEED_MEMORIES_EN_MAP[m.id]?.content) {
      content = SEED_MEMORIES_EN_MAP[m.id].content;
    } else if (m.content && FALLBACK_EN_DICT[m.content]) {
      content = FALLBACK_EN_DICT[m.content];
    } else if (m.content_zh && FALLBACK_EN_DICT[m.content_zh]) {
      content = FALLBACK_EN_DICT[m.content_zh];
    } else if (m.language === "en" && m.content && !/[\u4e00-\u9fa5]/.test(m.content)) {
      content = m.content;
    } else {
      content = enCand || m.content || "";
    }
  } else {
    const zhCand = m.content_zh?.trim();
    if (zhCand) {
      content = zhCand;
    } else if (SEED_MEMORIES_ZH_MAP[m.id]?.content) {
      content = SEED_MEMORIES_ZH_MAP[m.id].content;
    } else if (m.content && FALLBACK_ZH_DICT[m.content]) {
      content = FALLBACK_ZH_DICT[m.content];
    } else if (m.content_en && FALLBACK_ZH_DICT[m.content_en]) {
      content = FALLBACK_ZH_DICT[m.content_en];
    } else if (m.language === "zh" && m.content) {
      content = m.content;
    } else {
      content = zhCand || m.content || "";
    }
  }
  return sanitizeMemoryText(content);
}

export function getMemoryLevel(m: CanonicalMemory): MemoryLevel {
  if (m.memory_level) return m.memory_level;
  const topicsStr = (m.topics || []).join(" ").toLowerCase();
  const titleLower = (m.title || "").toLowerCase();
  const contentLower = (m.content || "").toLowerCase();

  // L4: Core Values & Deep Beliefs
  if (
    topicsStr.includes("value") ||
    topicsStr.includes("信念") ||
    topicsStr.includes("价值观") ||
    titleLower.includes("价值观") ||
    titleLower.includes("信念") ||
    contentLower.includes("核心价值观")
  ) {
    return "L4";
  }

  // L3: Persona & Mental Models
  if (
    topicsStr.includes("persona") ||
    topicsStr.includes("cognitive_pattern") ||
    topicsStr.includes("人设") ||
    topicsStr.includes("pattern") ||
    titleLower.includes("认知模式") ||
    titleLower.includes("人设") ||
    titleLower.includes("思维模式")
  ) {
    return "L3";
  }

  // L2: Semantic Skills, Habits & Preferences, Reading Notes
  if (
    topicsStr.includes("preference") ||
    topicsStr.includes("habit") ||
    topicsStr.includes("skill") ||
    topicsStr.includes("sop") ||
    topicsStr.includes("reading") ||
    topicsStr.includes("偏好") ||
    topicsStr.includes("技能") ||
    titleLower.includes("读书摘抄") ||
    titleLower.includes("读书笔记") ||
    m.type === "learning"
  ) {
    return "L2";
  }

  // L1: Structured Experiences, STAR Projects, Decisions, Work Wins
  if (
    topicsStr.includes("project") ||
    topicsStr.includes("experience") ||
    topicsStr.includes("achievement") ||
    topicsStr.includes("win") ||
    topicsStr.includes("成就") ||
    topicsStr.includes("胜仗") ||
    topicsStr.includes("经历") ||
    topicsStr.includes("architecture") ||
    titleLower.includes("项目") ||
    titleLower.includes("实践") ||
    titleLower.includes("成就") ||
    titleLower.includes("胜仗") ||
    m.type === "achievement" ||
    m.type === "decision" ||
    m.type === "plan"
  ) {
    return "L1";
  }

  // Default: L0 (Raw stream)
  return "L0";
}

export const RelationTypeEnum = z.enum([
  "same_topic",
  "same_project",
  "semantic_similarity",
  "temporal_sequence",
  "decision_outcome",
  "user_linked",
  "references",
]);

export type RelationType = z.infer<typeof RelationTypeEnum>;

export const RelationStatusEnum = z.enum(["suggested", "confirmed", "rejected"]);
export type RelationStatus = z.infer<typeof RelationStatusEnum>;

export const RelationshipSchema = z.object({
  id: z.string(),
  from_memory_id: z.string(),
  to_memory_id: z.string(),
  type: RelationTypeEnum,
  origin: z.enum(["manual", "ai_suggested", "rule_based"]).default("manual"),
  reason: z.string().default(""),
  reason_zh: z.string().optional(),
  reason_en: z.string().optional(),
  status: RelationStatusEnum.default("confirmed"),
  created_at: z.string(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

export function getLocalizedReason(rel: Relationship, lang: "en" | "zh"): string {
  if (lang === "en") {
    return rel.reason_en || (rel.reason && !/[\u4e00-\u9fa5]/.test(rel.reason) ? rel.reason : (rel.reason_en || rel.reason));
  }
  return rel.reason_zh || rel.reason;
}

export const LayoutTypeEnum = z.enum([
  "boogie_matrix",
  "spatial",
  "stream",
  "balanced",
  "thematic",
  "by_type",
  "by_connection",
  "chronological",
  "compact",
  "focus",
  "custom",
]);

export type LayoutType = z.infer<typeof LayoutTypeEnum>;

export const SortOrderEnum = z.enum([
  "newest",
  "oldest",
  "most_connected",
  "serendipity",
  "alphabetical",
  "balanced",
  "chronological",
  "by_type",
  "by_connection",
  "thematic",
]);

export type SortOrder = z.infer<typeof SortOrderEnum>;

export interface CardGridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SavedCompositionSchema = z.object({
  id: z.string(),
  name: z.string(),
  layout_type: LayoutTypeEnum,
  memory_ids: z.array(z.string()),
  positions: z.record(
    z.string(),
    z.object({
      col: z.number(),
      row: z.number(),
      colSpan: z.number().default(1),
      rowSpan: z.number().default(1),
    })
  ),
  zoom_level: z.string().default("day"),
  filters: z.record(z.string(), z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SavedComposition = z.infer<typeof SavedCompositionSchema>;

export interface Collection {
  id: string;
  name: string;
  name_zh?: string;
  name_en?: string;
  description: string;
  description_zh?: string;
  description_en?: string;
  slug: string;
  memory_ids: string[];
  color?: string;
  created_at: string;
}

export function getLocalizedCollectionName(c: Collection, lang: "en" | "zh"): string {
  if (lang === "en") return c.name_en || (c.name && !/[\u4e00-\u9fa5]/.test(c.name) ? c.name : (c.name_en || c.name));
  return c.name_zh || c.name;
}

export function getLocalizedCollectionDesc(c: Collection, lang: "en" | "zh"): string {
  if (lang === "en") return c.description_en || (c.description && !/[\u4e00-\u9fa5]/.test(c.description) ? c.description : (c.description_en || c.description));
  return c.description_zh || c.description;
}

export interface DailyReceipt {
  id: string;
  date: string; // YYYY-MM-DD (unique key per day)
  moments: string[];
  ideas: string[];
  learning: string[];
  decisions: string[];
  tomorrow: string[];
  open_loops: string[];
  referenced_memory_ids: string[];
  created_at: string;
  custom_reflection?: string; // Optional user editorial note
  mood?: string; // Optional day mood: e.g. 陶土红 · 热情, 冰海蓝 · 澄澈
}

export interface AISettings {
  provider: "gemini" | "openai" | "claude" | "deepseek" | "custom" | "local";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AppSettings {
  language: "en" | "zh";
  github: {
    connected: boolean;
    repo: string;
    owner: string;
    branch: string;
    pat?: string;
    last_sync?: string;
    auto_sync?: boolean;
  };
  ai?: AISettings;
  default_layout: LayoutType;
  time_zone: string;
  reduced_motion: boolean;
  theme: "boogie-paper" | "obsidian-dark" | "studio-light";
}

/**
 * Deterministic timestamp formatting that matches identically across server and client
 * preventing any SSR hydration locale or timezone mismatch.
 */
export function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const datePart = iso.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  }
  return datePart;
}

export function formatDisplayTime(iso: string): string {
  if (!iso || !iso.includes("T")) return "";
  return iso.split("T")[1].slice(0, 5);
}

