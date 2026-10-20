import { describe, it, expect } from "vitest";
import { CanonicalMemorySchema, DEFAULT_TYPE_COLORS, MORANDI_PIGMENTS } from "../types/memory";

describe("Living & Evolving Memory Architecture", () => {
  it("should validate timeline_logs schema and multi-day append structure", () => {
    const memoryWithLogs = {
      schema_version: "1.0",
      id: "mem_nuochat_assistant",
      title: "诺chat的新模块（我的助理）",
      type: "plan",
      content: "周一：打通企业微信api连接、封装成mcp\n\n---\n**[2026-10-14 15:30 演进记录]**\n周二：我的助理板块UI设计初版完成",
      occurred_at: "2026-10-14T15:30:00+08:00",
      recorded_at: "2026-10-13T10:00:00+08:00",
      updated_at: "2026-10-14T15:30:00+08:00",
      topics: ["assistant", "mcp", "ui"],
      timeline_logs: [
        {
          id: "log_1",
          timestamp: "2026-10-13T10:00:00+08:00",
          content: "打通企业微信api连接、封装成mcp，让我们可以获取用户的未读消息等信息，方便我们信息获取。",
        },
        {
          id: "log_2",
          timestamp: "2026-10-14T15:30:00+08:00",
          content: "我的助理板块UI设计初版完成。",
        },
      ],
    };

    const parsed = CanonicalMemorySchema.safeParse(memoryWithLogs);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.timeline_logs).toHaveLength(2);
      expect(parsed.data.timeline_logs?.[0].content).toContain("企业微信api");
      expect(parsed.data.timeline_logs?.[1].content).toContain("UI设计初版");
    }
  });

  it("should have distinct default Morandi mineral colors for standard types", () => {
    expect(DEFAULT_TYPE_COLORS["idea"]).toBe("#C97A63");
    expect(DEFAULT_TYPE_COLORS["learning"]).toBe("#5B7B94");
    expect(DEFAULT_TYPE_COLORS["moment"]).toBe("#C49A56");
    expect(DEFAULT_TYPE_COLORS["plan"]).toBe("#608066");
    expect(MORANDI_PIGMENTS.length).toBeGreaterThanOrEqual(8);
  });
});
