import { describe, it, expect } from "vitest";
import { CanonicalMemory, getLocalizedTitle, getLocalizedContent } from "../types/memory";
import { ensureBilingualMemoryFields } from "../lib/translator";

describe("Strict Bilingual Independence & Default Auto-Translation", () => {
  const sampleMemory: CanonicalMemory = {
    schema_version: "1.0",
    id: "mem_bilingual_test",
    type: "idea",
    title: "Primary Title",
    title_zh: "设计系统与色块构建",
    title_en: "Design Systems & Color Plane Construction",
    content: "Primary Content",
    content_zh: "基于蒙德里安几何美学搭建个人第二大脑。",
    content_en: "Building a personal second brain based on Mondrian aesthetics.",
    language: "zh",
    occurred_at: new Date().toISOString(),
    recorded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    topics: ["design", "architecture"],
    source_ids: [],
    relations: [],
    confidence: 0.95,
    status: "active",
    provenance: { capture_method: "manual", ai_generated: false },
  };

  it("should return 100% English in EN mode and 100% Chinese in ZH mode", () => {
    expect(getLocalizedTitle(sampleMemory, "en")).toBe("Design Systems & Color Plane Construction");
    expect(getLocalizedTitle(sampleMemory, "zh")).toBe("设计系统与色块构建");

    expect(getLocalizedContent(sampleMemory, "en")).toBe(
      "Building a personal second brain based on Mondrian aesthetics."
    );
    expect(getLocalizedContent(sampleMemory, "zh")).toBe(
      "基于蒙德里安几何美学搭建个人第二大脑。"
    );
  });

  it("should preserve Chinese and English independently without mutual overwrite", () => {
    // Simulate user editing Chinese only
    const editedChinese: CanonicalMemory = {
      ...sampleMemory,
      title_zh: "单独修改中文标题（不应影响英文）",
      content_zh: "单独修改中文阐述内容。",
    };

    expect(getLocalizedTitle(editedChinese, "zh")).toBe("单独修改中文标题（不应影响英文）");
    expect(getLocalizedTitle(editedChinese, "en")).toBe("Design Systems & Color Plane Construction");
    expect(getLocalizedContent(editedChinese, "zh")).toBe("单独修改中文阐述内容。");
    expect(getLocalizedContent(editedChinese, "en")).toBe(
      "Building a personal second brain based on Mondrian aesthetics."
    );

    // Simulate user editing English only
    const editedEnglish: CanonicalMemory = {
      ...editedChinese,
      title_en: "Independently edited English title",
      content_en: "Independently edited English content.",
    };

    expect(getLocalizedTitle(editedEnglish, "zh")).toBe("单独修改中文标题（不应影响英文）");
    expect(getLocalizedTitle(editedEnglish, "en")).toBe("Independently edited English title");
    expect(getLocalizedContent(editedEnglish, "zh")).toBe("单独修改中文阐述内容。");
    expect(getLocalizedContent(editedEnglish, "en")).toBe("Independently edited English content.");
  });

  it("should auto-fill bilingual fields when user only fills one language", async () => {
    // Only Chinese provided
    const zhOnly = await ensureBilingualMemoryFields({
      title_zh: "晨间咖啡与阳台掠过的秋风",
      content_zh: "喝一杯黑咖啡，看着落叶发呆。",
      currentLang: "zh",
    });

    expect(zhOnly.title_zh).toBe("晨间咖啡与阳台掠过的秋风");
    expect(zhOnly.title_en).toBeDefined();
    expect(zhOnly.title_en.length).toBeGreaterThan(0);
    expect(zhOnly.content_zh).toBe("喝一杯黑咖啡，看着落叶发呆。");
    expect(zhOnly.content_en).toBeDefined();

    // Only English provided
    const enOnly = await ensureBilingualMemoryFields({
      title_en: "Reading notes: Cal Newport on Pseudo-Productivity",
      content_en: "Knowledge work needs visible output reduction.",
      currentLang: "en",
    });

    expect(enOnly.title_en).toBe("Reading notes: Cal Newport on Pseudo-Productivity");
    expect(enOnly.title_zh).toBeDefined();
    expect(enOnly.title_zh.length).toBeGreaterThan(0);
    expect(enOnly.content_en).toBe("Knowledge work needs visible output reduction.");
    expect(enOnly.content_zh).toBeDefined();
  });

  it("should not overwrite existing fields when both languages are present", async () => {
    const customZh = "我的定制中文标题";
    const customEn = "My Custom English Title";

    const preserved = await ensureBilingualMemoryFields({
      title_zh: customZh,
      title_en: customEn,
      content_zh: "定制中文内容",
      content_en: "Custom English content",
      currentLang: "en",
    });

    expect(preserved.title_zh).toBe(customZh);
    expect(preserved.title_en).toBe(customEn);
    expect(preserved.content_zh).toBe("定制中文内容");
    expect(preserved.content_en).toBe("Custom English content");
  });

  it("should NOT pollute the target-language field when translation is unavailable", async () => {
    // translateText 在无网络 / 无 Key 时会原样返回入参。
    // 这里断言：绝不能把中文原样写进 *_en，否则数据层就被污染了。
    const zhOnly = await ensureBilingualMemoryFields({
      title_zh: "一条翻译服务没覆盖到的中文标题",
      content_zh: "一段翻译服务没覆盖到的中文正文。",
      currentLang: "zh",
    });

    expect(zhOnly.title_zh).toBe("一条翻译服务没覆盖到的中文标题");
    expect(zhOnly.content_zh).toBe("一段翻译服务没覆盖到的中文正文。");
    expect(zhOnly.title_en).not.toBe("一条翻译服务没覆盖到的中文标题");
    expect(zhOnly.content_en).not.toBe("一段翻译服务没覆盖到的中文正文。");
  });

  it("should explicitly mark untranslated content in EN mode instead of silently showing Chinese", () => {
    // 关键：这条内容必须是「词典里没有、翻译服务也不可用」的用户自建内容。
    // 若用 SEED/FALLBACK_EN_DICT 里已有的句子，会走真实英文分支，测的就不是这个行为了。
    const chineseOnly: CanonicalMemory = {
      ...sampleMemory,
      id: "mem_user_untracked_zh_only",
      title: "周三下午在徐汇滨江走了很久",
      title_zh: "周三下午在徐汇滨江走了很久",
      title_en: "",
      content: "江风很大，把耳机里的播客吹得听不清，但心情意外地好。",
      content_zh: "江风很大，把耳机里的播客吹得听不清，但心情意外地好。",
      content_en: "",
      language: "zh",
    };

    expect(getLocalizedTitle(chineseOnly, "en")).toContain("[未翻译]");
    expect(getLocalizedContent(chineseOnly, "en")).toContain("[未翻译]");
    // 中文模式下不受影响
    expect(getLocalizedTitle(chineseOnly, "zh")).toBe("周三下午在徐汇滨江走了很久");
  });

  it("should NOT flag a mostly-English string that merely contains a stray CJK fragment", () => {
    // 回归用例：曾经的 [未翻译] 判据是「只要含中文就打标」，
    // 结果 "Fullstack engineering preference (置信度: 80%)" 被误判成未翻译。
    const mixed: CanonicalMemory = {
      ...sampleMemory,
      id: "mem_user_mixed_ratio",
      title: "Preference for 全栈 engineering roles",
      title_zh: "",
      title_en: "",
      content: "I prefer fullstack work over 单一职责 splits.",
      content_zh: "",
      content_en: "",
      language: "en",
    };

    expect(getLocalizedTitle(mixed, "en")).not.toContain("[未翻译]");
    expect(getLocalizedContent(mixed, "en")).not.toContain("[未翻译]");
  });

  it("should sanitize emojis and confidence labels from titles and contents", () => {
    const memoryWithEmojis: CanonicalMemory = {
      ...sampleMemory,
      title: "## 🧠 思维模式 (Cognitive Patterns)",
      title_zh: "## 🧠 思维模式 (Cognitive Patterns)",
      title_en: "## 🧠 Cognitive Patterns",
      content: "【💼 职业与专业导向】偏好全栈开发 (置信度: 80%)",
      content_zh: "【💼 职业与专业导向】偏好全栈开发 (置信度: 80%)",
      content_en: "Fullstack engineering preference (置信度: 80%)",
    };

    expect(getLocalizedTitle(memoryWithEmojis, "zh")).toBe("## 思维模式 (Cognitive Patterns)");
    expect(getLocalizedTitle(memoryWithEmojis, "en")).toBe("## Cognitive Patterns");
    expect(getLocalizedContent(memoryWithEmojis, "zh")).toBe("【职业与专业导向】偏好全栈开发");
    expect(getLocalizedContent(memoryWithEmojis, "en")).toBe("Fullstack engineering preference");
  });

  it("should ensure 100% of seed memories return pure English in 'en' mode and Chinese in 'zh' mode", async () => {
    const { SEED_MEMORIES, SEED_RELATIONSHIPS, SEED_COLLECTIONS } = await import("../lib/seed");
    const { getLocalizedReason, getLocalizedCollectionName, getLocalizedCollectionDesc } = await import("../types/memory");

    expect(SEED_MEMORIES.length).toBeGreaterThan(0);

    for (const mem of SEED_MEMORIES) {
      const enTitle = getLocalizedTitle(mem, "en");
      const enContent = getLocalizedContent(mem, "en");
      const zhTitle = getLocalizedTitle(mem, "zh");
      const zhContent = getLocalizedContent(mem, "zh");

      // In English mode, titles & contents must contain ZERO Chinese characters (except allowed bilingual brand names like You+)
      const hasChineseInEnTitle = /[\u4e00-\u9fa5]/.test(enTitle);
      const hasChineseInEnContent = /[\u4e00-\u9fa5]/.test(enContent);
      expect(hasChineseInEnTitle, `Memory ${mem.id} enTitle leaked Chinese: ${enTitle}`).toBe(false);
      expect(hasChineseInEnContent, `Memory ${mem.id} enContent leaked Chinese: ${enContent}`).toBe(false);

      // In Chinese mode, titles & contents must contain Chinese characters
      expect(/[\u4e00-\u9fa5]/.test(zhTitle), `Memory ${mem.id} zhTitle missing Chinese: ${zhTitle}`).toBe(true);
      expect(/[\u4e00-\u9fa5]/.test(zhContent), `Memory ${mem.id} zhContent missing Chinese: ${zhContent}`).toBe(true);
    }

    // Verify relationships reasons
    for (const rel of SEED_RELATIONSHIPS) {
      const enReason = getLocalizedReason(rel, "en");
      const zhReason = getLocalizedReason(rel, "zh");
      expect(/[\u4e00-\u9fa5]/.test(enReason), `Rel ${rel.id} enReason leaked Chinese: ${enReason}`).toBe(false);
      expect(/[\u4e00-\u9fa5]/.test(zhReason), `Rel ${rel.id} zhReason missing Chinese: ${zhReason}`).toBe(true);
    }

    // Verify collections
    for (const col of SEED_COLLECTIONS) {
      const enName = getLocalizedCollectionName(col, "en");
      const zhName = getLocalizedCollectionName(col, "zh");
      const enDesc = getLocalizedCollectionDesc(col, "en");
      const zhDesc = getLocalizedCollectionDesc(col, "zh");
      expect(/[\u4e00-\u9fa5]/.test(enName), `Col ${col.id} enName leaked Chinese: ${enName}`).toBe(false);
      expect(/[\u4e00-\u9fa5]/.test(enDesc), `Col ${col.id} enDesc leaked Chinese: ${enDesc}`).toBe(false);
      expect(/[\u4e00-\u9fa5]/.test(zhName), `Col ${col.id} zhName missing Chinese: ${zhName}`).toBe(true);
      expect(/[\u4e00-\u9fa5]/.test(zhDesc), `Col ${col.id} zhDesc missing Chinese: ${zhDesc}`).toBe(true);
    }
  });
});
