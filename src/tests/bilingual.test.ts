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
});
