/**
 * Client & Server Translator Utility for Dayprint
 * Provides bidirectional translation (EN <-> ZH).
 * Ensures that editing one language does not overwrite the other,
 * and if only one language is supplied, the other is automatically generated.
 */

const OFFLINE_TRANSLATION_DICT: Record<string, string> = {
  // EN -> ZH
  "Broadway Boogie Woogie as an Information Grid": "作为离散信息网格的百老汇爵士乐",
  "Morning coffee & autumn breeze over the balcony": "晨间咖啡与阳台掠过的秋风",
  "GitHub as Canonical Storage instead of Postgres": "以 GitHub 为主数据存储而非 Postgres",
  "Reading notes: Cal Newport on Pseudo-Productivity": "读书笔记：卡尔·纽波特论伪生产力",
  "Mondrian primary color scheme implementation": "蒙德里安三原色设计系统的工程实现",
  "Deep Focus & Serendipitous Wandering": "深度专注与灵感漫步的心流节律",
  "Obsidian Vault Two-Way Sync": "本地 Obsidian 双向同步验证",
  "Spatial Memory Canvas Architecture": "四向全景空间记忆画布架构",
  "Knowledge Graph Engineering": "知识图谱关系工程",
  "Personal Memory Hub Dossier": "个人专属记忆中枢档案",
  "Personal LLM Wiki Dossier": "个人专属记忆中枢档案",
  "Daily Memory Receipt": "每日记忆小票",
  "Design Systems": "设计系统",
  "Architecture": "系统架构",
  "First Principles": "第一性原理",
  "Cognitive Ledger": "认知中枢",
  "Core Values": "核心价值观",
  "Skills & Habits": "技能与偏好习惯",
  "STAR Experience": "STAR 经历",
  "Raw Stream": "时空感知日志",
  // Reverse (ZH -> EN)
  "作为离散信息网格的百老汇爵士乐": "Broadway Boogie Woogie as an Information Grid",
  "晨间咖啡与阳台掠过的秋风": "Morning coffee & autumn breeze over the balcony",
  "以 GitHub 为主数据存储而非 Postgres": "GitHub as Canonical Storage instead of Postgres",
  "读书笔记：卡尔·纽波特论伪生产力": "Reading notes: Cal Newport on Pseudo-Productivity",
  "蒙德里安三原色设计系统的工程实现": "Mondrian primary color scheme implementation",
  "心流节律与专注环境偏好": "Deep Flow Rhythm & Focus Environment Preferences",
  "第一性原理与工程极简信条": "First Principles & Minimalist Engineering Creed",
  "严谨自驱的探究者画像": "Rigorous Self-Driven Inquirer Persona",
};

export async function translateText(
  text: string,
  targetLang: "en" | "zh"
): Promise<string> {
  if (!text || text.trim() === "") return "";
  const trimmed = text.trim();

  // 1. Direct dictionary match
  if (OFFLINE_TRANSLATION_DICT[trimmed]) {
    return OFFLINE_TRANSLATION_DICT[trimmed];
  }

  // 2. Client-side network call to Next.js API route
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, targetLang }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.translation) {
          return data.translation;
        }
      }
    } catch (e) {
      console.warn("Translation request failed, using original text:", e);
    }
  }

  return trimmed;
}

/**
 * Ensures both Chinese and English fields exist.
 * If user filled both, neither is overwritten (they do not interfere).
 * If user only filled one, the other is automatically translated by default.
 */
export async function ensureBilingualMemoryFields(input: {
  title?: string;
  title_zh?: string;
  title_en?: string;
  content?: string;
  content_zh?: string;
  content_en?: string;
  currentLang?: "en" | "zh";
}): Promise<{
  title: string;
  title_zh: string;
  title_en: string;
  content: string;
  content_zh: string;
  content_en: string;
}> {
  let titleZh = (input.title_zh || "").trim();
  let titleEn = (input.title_en || "").trim();
  let contentZh = (input.content_zh || "").trim();
  let contentEn = (input.content_en || "").trim();

  // If title was provided in single field
  if (!titleZh && !titleEn && input.title) {
    if (input.currentLang === "zh") {
      titleZh = input.title.trim();
    } else {
      titleEn = input.title.trim();
    }
  }

  // If content was provided in single field
  if (!contentZh && !contentEn && input.content) {
    if (input.currentLang === "zh") {
      contentZh = input.content.trim();
    } else {
      contentEn = input.content.trim();
    }
  }

  // Auto-translate missing title
  if (titleZh && !titleEn) {
    titleEn = await translateText(titleZh, "en");
  } else if (titleEn && !titleZh) {
    titleZh = await translateText(titleEn, "zh");
  }

  // Auto-translate missing content
  if (contentZh && !contentEn) {
    contentEn = await translateText(contentZh, "en");
  } else if (contentEn && !contentZh) {
    contentZh = await translateText(contentEn, "zh");
  }

  const primaryTitle = input.currentLang === "zh" ? (titleZh || titleEn) : (titleEn || titleZh);
  const primaryContent = input.currentLang === "zh" ? (contentZh || contentEn) : (contentEn || contentZh);

  return {
    title: primaryTitle || "Untitled Memory",
    title_zh: titleZh || titleEn,
    title_en: titleEn || titleZh,
    content: primaryContent,
    content_zh: contentZh || contentEn,
    content_en: contentEn || contentZh,
  };
}
