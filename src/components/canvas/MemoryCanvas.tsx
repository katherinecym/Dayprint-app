"use client";

import React from "react";
import { useMemory } from "@/lib/memory-context";
import { BoogieMatrixCanvas } from "./BoogieMatrixCanvas";

import { getMemoryLevel } from "@/types/memory";

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
    if (temporalLevel === "day") {
      return true;
    } else if (temporalLevel === "month") {
      const targetMonth = selectedDate.slice(0, 7); // YYYY-MM
      return m.occurred_at.startsWith(targetMonth);
    } else if (temporalLevel === "year") {
      const targetYear = selectedDate.slice(0, 4); // YYYY
      return m.occurred_at.startsWith(targetYear);
    }

    return true; // "all"
  });

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <BoogieMatrixCanvas memories={filteredMemories} />
    </div>
  );
}
