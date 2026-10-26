"use client";

import React from "react";
import { useMemory } from "@/lib/memory-context";
import { BoogieMatrixCanvas } from "./BoogieMatrixCanvas";

import { getMemoryLevel } from "@/types/memory";
import { dateKeyOf } from "@/lib/date";

export function MemoryCanvas() {
  const {
    memories,
    temporalLevel,
    selectedDate,
    searchQuery,
  } = useMemory();

  // Filter memories: Daily Canvas is the Obsidian Daily Journal layer (Ground Truth)
  // Everything written on the selected date is completely preserved and visible here first.
  const filteredMemories = memories.filter((m) => {

    // 1. Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle =
        (m.title || "").toLowerCase().includes(q) ||
        (m.title_zh || "").toLowerCase().includes(q) ||
        (m.title_en || "").toLowerCase().includes(q);
      const matchContent =
        (m.content || "").toLowerCase().includes(q) ||
        (m.content_zh || "").toLowerCase().includes(q) ||
        (m.content_en || "").toLowerCase().includes(q);
      const matchTopic = m.topics.some((topic) => topic.toLowerCase().includes(q));
      const matchType = m.type.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchTopic && !matchType) return false;
    }

    // 2. Temporal zoom filter
    // 之前 day 分支直接 return true（不过滤），只有 12 条 seed 时看不出来；
    // 数据量上来之后会让「今日记录」一次刷出全部记忆，所以必须真的按日过滤。
    const key = m.occurred_at ? dateKeyOf(m.occurred_at) : "";
    if (temporalLevel === "day") {
      return key === selectedDate;
    } else if (temporalLevel === "month") {
      return key.startsWith(selectedDate.slice(0, 7)); // YYYY-MM
    } else if (temporalLevel === "year") {
      return key.startsWith(selectedDate.slice(0, 4)); // YYYY
    }

    return true; // "all"
  });

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <BoogieMatrixCanvas memories={filteredMemories} />
    </div>
  );
}
