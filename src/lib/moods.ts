/**
 * Single source of truth for the five mood presets.
 *
 * Previously this array existed twice — `ContextPanel.tsx` and
 * `DailyReceiptModal.tsx` — and the two copies had drifted: ContextPanel had
 * `descEn` but no `shortZh/shortEn/wash`, DailyReceipt had the shorts and the
 * wash color but had dropped `descEn`. Adding a sixth mood meant editing two
 * files and silently losing a field in one of them. This module is the superset;
 * each consumer reads the fields it actually renders.
 */

export interface MoodPreset {
  /** Stable key persisted into receipts — never rename. */
  id: string;
  /** Full label, Chinese. e.g. "陶土红 · 热情" */
  label: string;
  /** Full label, English. e.g. "Terracotta · Energized" */
  labelEn: string;
  /** Short chip label, Chinese. e.g. "热情" */
  shortZh: string;
  /** Short chip label, English. e.g. "Energized" */
  shortEn: string;
  /** One-line description, Chinese. */
  descZh: string;
  /** One-line description, English. */
  descEn: string;
  /** Solid pigment, used for dots, borders, bars. */
  color: string;
  /** Low-alpha wash, used for the receipt background tint. */
  wash: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "terracotta",
    label: "陶土红 · 热情",
    labelEn: "Terracotta · Energized",
    shortZh: "热情",
    shortEn: "Energized",
    descZh: "充满干劲、活力与行动力",
    descEn: "Full of drive and vitality",
    color: "#C97A63",
    wash: "rgba(201, 122, 99, 0.24)",
  },
  {
    id: "amber",
    label: "琥珀蜜 · 灵感",
    labelEn: "Amber · Inspired",
    shortZh: "灵感",
    shortEn: "Inspired",
    descZh: "顿悟闪光、创造心流",
    descEn: "Creative flow and spark",
    color: "#C49A56",
    wash: "rgba(196, 154, 86, 0.24)",
  },
  {
    id: "sage",
    label: "苍青绿 · 平和",
    labelEn: "Sage · Calm",
    shortZh: "平和",
    shortEn: "Calm",
    descZh: "松弛从容、内心安定",
    descEn: "Tranquil and grounded",
    color: "#608066",
    wash: "rgba(96, 128, 102, 0.24)",
  },
  {
    id: "fjord",
    label: "冰海蓝 · 澄澈",
    labelEn: "Fjord · Focused",
    shortZh: "澄澈",
    shortEn: "Focused",
    descZh: "清醒理性、专注沉浸",
    descEn: "Crystal clear and focused",
    color: "#5B7B94",
    wash: "rgba(91, 123, 148, 0.24)",
  },
  {
    id: "twilight",
    label: "暮山紫 · 内省",
    labelEn: "Twilight · Reflective",
    shortZh: "内省",
    shortEn: "Reflective",
    descZh: "深度复盘、静水流深",
    descEn: "Quiet introspection and depth",
    color: "#9A8BB8",
    wash: "rgba(154, 139, 184, 0.24)",
  },
];

export const DEFAULT_MOOD_ID = MOOD_PRESETS[0].id;

/** Look up a preset by id, falling back to the first one (never returns undefined). */
export function getMoodPreset(id?: string | null): MoodPreset {
  return MOOD_PRESETS.find((m) => m.id === id) || MOOD_PRESETS[0];
}

/** Localized full label. */
export function getMoodLabel(id: string | null | undefined, lang: "zh" | "en"): string {
  const m = getMoodPreset(id);
  return lang === "en" ? m.labelEn : m.label;
}

/** Localized short chip label. */
export function getMoodShort(id: string | null | undefined, lang: "zh" | "en"): string {
  const m = getMoodPreset(id);
  return lang === "en" ? m.shortEn : m.shortZh;
}

/** Localized one-line description. */
export function getMoodDesc(id: string | null | undefined, lang: "zh" | "en"): string {
  const m = getMoodPreset(id);
  return lang === "en" ? m.descEn : m.descZh;
}

/**
 * Resolves whatever is stored in a receipt's `mood` field back to a preset.
 *
 * That field has been written in four different shapes over time — preset id,
 * raw hex color, Chinese label, English label — so every reader used to carry
 * its own fuzzy `includes()` matcher. Two copies of that matcher already drifted
 * (one checked `shortZh`, the other didn't), so it lives here now.
 */
export function resolveMood(raw?: string | null): MoodPreset {
  if (!raw) return MOOD_PRESETS[0];
  const hay = raw.trim();
  if (!hay) return MOOD_PRESETS[0];
  return (
    MOOD_PRESETS.find(
      (m) =>
        hay.includes(m.id) ||
        hay.includes(m.color) ||
        hay.includes(m.label) ||
        hay.includes(m.labelEn) ||
        hay.includes(m.shortZh) ||
        hay.includes(m.shortEn)
    ) || MOOD_PRESETS[0]
  );
}
