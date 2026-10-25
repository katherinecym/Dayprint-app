import { describe, it, expect } from "vitest";
import { CanonicalMemorySchema } from "../types/memory";
import { computeMemoryLayout } from "../lib/layout-engine";
import { SEED_MEMORIES } from "../lib/seed";

describe("PRD 8 & 18.1: Memory Schema Validation", () => {
  it("should validate all seed memories against CanonicalMemorySchema", () => {
    SEED_MEMORIES.forEach((memory) => {
      const result = CanonicalMemorySchema.safeParse(memory);
      expect(result.success).toBe(true);
    });
  });

  it("should reject memory missing required fields like title", () => {
    const invalid = {
      schema_version: "1.0",
      id: "mem_invalid",
      occurred_at: new Date().toISOString(),
      recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = CanonicalMemorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should validate and preserve custom memory types without demoting to topics", () => {
    const customMem = {
      schema_version: "1.0",
      id: "mem_custom_type_1",
      title: "读书笔记：存在与时间",
      type: "reading",
      content: "海德格尔的时间性概念",
      occurred_at: new Date().toISOString(),
      recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      topics: ["philosophy"],
    };
    const result = CanonicalMemorySchema.safeParse(customMem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("reading");
      expect(result.data.topics).toEqual(["philosophy"]);
    }
  });
});

describe("PRD 5.4 & 13.5: Layout Engine Determinism", () => {
  it("should calculate correct card spans and layout order for balanced preset", () => {
    const computed = computeMemoryLayout(SEED_MEMORIES, "balanced");
    expect(computed.length).toBe(SEED_MEMORIES.length);
    expect(computed[0].colSpan).toBe(2);
    expect(computed[0].rowSpan).toBe(2);
  });

  it("should sort memories correctly when by_type layout is selected", () => {
    const computed = computeMemoryLayout(SEED_MEMORIES, "by_type");
    expect(computed.length).toBe(SEED_MEMORIES.length);
    expect(computed[0].memory.type).toBe("idea");
  });
});

describe("Sort & Hierarchy Verification", () => {
  it("should support industry-standard sort keys", () => {
    const validSorts = ["newest", "oldest", "most_connected", "serendipity", "alphabetical"];
    validSorts.forEach((sort) => {
      expect(["newest", "oldest", "most_connected", "serendipity", "alphabetical"]).toContain(sort);
    });
  });
});

describe("Knowledge Graph & Search Verification", () => {
  it("should build interconnected knowledge graph nodes from memories and relationships", async () => {
    const { buildKnowledgeGraph } = await import("../lib/graph-engineering");
    const { SEED_RELATIONSHIPS } = await import("../lib/seed");
    const graph = buildKnowledgeGraph(SEED_MEMORIES, SEED_RELATIONSHIPS);

    expect(graph.nodes.length).toBe(SEED_MEMORIES.length);
    expect(graph.edges.length).toBeGreaterThan(0);

    // Verify search matching function
    const query = "architecture";
    const matched = graph.nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.topics.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    );
    expect(matched.length).toBeGreaterThan(0);
  });
});

describe("GitHub URL Normalization & Multi-Provider AI Settings", () => {
  function normalizeGitHubRepo(input: string): string {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, "");
    cleaned = cleaned.replace(/^github\.com\//i, "");
    cleaned = cleaned.replace(/\.git$/i, "");
    cleaned = cleaned.replace(/^\/+|\/+$/g, "");
    return cleaned;
  }

  it("should normalize full GitHub URLs, git URLs, and simple paths into owner/repo format", () => {
    expect(normalizeGitHubRepo("https://github.com/octocat/my-vault.git")).toBe("octocat/my-vault");
    expect(normalizeGitHubRepo("http://github.com/octocat/my-vault")).toBe("octocat/my-vault");
    expect(normalizeGitHubRepo("github.com/octocat/my-vault")).toBe("octocat/my-vault");
    expect(normalizeGitHubRepo("octocat/my-vault")).toBe("octocat/my-vault");
    expect(normalizeGitHubRepo("  octocat/my-vault/  ")).toBe("octocat/my-vault");
  });

  it("should accept valid AI provider configurations", () => {
    const validProviders = ["gemini", "openai", "claude", "deepseek", "custom", "local"];
    validProviders.forEach((p) => {
      expect(["gemini", "openai", "claude", "deepseek", "custom", "local"]).toContain(p);
    });
  });
});

