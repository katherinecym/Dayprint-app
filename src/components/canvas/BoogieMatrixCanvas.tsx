"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import { CanonicalMemory, SortOrder, getLocalizedTitle, getLocalizedContent, getMemoryTypeBadgeStyle, formatDisplayDate, formatDisplayTime, getMemoryLevel, MEMORY_LEVELS_META } from "@/types/memory";
import { TodayEditor } from "./TodayEditor";
import { DailyMuseSlip } from "./DailyMuseSlip";
import { motion } from "framer-motion";
import {
  Shuffle,
  Link2,
  Calendar,
  Filter,
  ArrowUpDown,
  Plus,
  BookOpen,
  Sprout,
  Award,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface BoogieMatrixCanvasProps {
  memories: CanonicalMemory[];
}

export function BoogieMatrixCanvas({ memories }: BoogieMatrixCanvasProps) {
  const {
    setSelectedMemoryId,
    setConnectionModalMemoryId,
    t,
    language,
    sortOrder,
    setSortOrder,
    relationships,
    memories: allMemories,
    availableTypes,
    getTypeColor,
    typeColors,
    settings,
    appMode,
    loadDemoData,
  } = useMemory();

  const [shuffleSeed, setShuffleSeed] = useState(0);

  const handleShuffle = () => {
    setSortOrder("serendipity");
    setShuffleSeed((prev) => prev + 1);
  };

  // Paper Pattern Switcher: dot-grid (default), graph-grid, lined, plain
  const [paperPattern, setPaperPattern] = useState<"dot-grid" | "graph-grid" | "lined" | "plain">("dot-grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dayprint_paper_pattern");
      if (saved && ["dot-grid", "graph-grid", "lined", "plain"].includes(saved)) {
        setPaperPattern(saved as any);
      }
    } catch {}
  }, []);

  const handleSelectPaperPattern = (next: "dot-grid" | "graph-grid" | "lined" | "plain") => {
    setPaperPattern(next);
    try {
      localStorage.setItem("dayprint_paper_pattern", next);
    } catch {}
  };

  const [insertedPrompt, setInsertedPrompt] = useState<string>("");

  // Filter state: "all" | memory type | "linked"
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filterItems = useMemo(() => {
    const baseIds = ["idea", "learning", "moment", "decision", "plan"];
    const allKnownTypes = Array.from(new Set([...baseIds, ...availableTypes]));
    return allKnownTypes
      .map((typeId) => {
        const count = memories.filter((m) => m.type === typeId).length;
        const colorHex = getTypeColor(typeId);
        const label = t[`memory_type_${typeId}` as keyof typeof t] || typeId;
        return {
          id: typeId,
          label,
          colorHex,
          count,
        };
      })
      .filter((item) => item.count > 0);
  }, [availableTypes, memories, t, typeColors, getTypeColor]);

  // Check if any memories have links
  const hasLinkedMemories = useMemo(() => {
    return memories.some(
      (m) =>
        (m.relations && m.relations.length > 0) ||
        relationships.some((r) => r.from_memory_id === m.id || r.to_memory_id === m.id)
    );
  }, [memories, relationships]);

  // Hover states for cross-card linked illumination
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);

  // Helper to get connected memories for any memory
  const getConnectedMemories = (mem: CanonicalMemory): CanonicalMemory[] => {
    const targetIds = new Set<string>();
    (mem.relations || []).forEach((id) => targetIds.add(id));
    relationships.forEach((rel) => {
      if (rel.from_memory_id === mem.id) targetIds.add(rel.to_memory_id);
      if (rel.to_memory_id === mem.id) targetIds.add(rel.from_memory_id);
    });
    targetIds.delete(mem.id);
    return allMemories.filter((m) => targetIds.has(m.id));
  };

  // Set of memory IDs connected to the currently hovered card
  const activeConnectedIds = useMemo(() => {
    if (!hoveredCardId) return new Set<string>();
    const hoveredMem = allMemories.find((m) => m.id === hoveredCardId);
    if (!hoveredMem) return new Set<string>();
    const ids = new Set<string>();
    (hoveredMem.relations || []).forEach((id) => ids.add(id));
    relationships.forEach((rel) => {
      if (rel.from_memory_id === hoveredCardId) ids.add(rel.to_memory_id);
      if (rel.to_memory_id === hoveredCardId) ids.add(rel.from_memory_id);
    });
    ids.delete(hoveredCardId);
    return ids;
  }, [hoveredCardId, allMemories, relationships]);

  // Filter and Sort memories (Are.na + Notion standard)
  const sortedAndFilteredMemories = useMemo(() => {
    let list = [...memories];

    // 1. Filter
    if (activeFilter === "linked") {
      list = list.filter((m) => getConnectedMemories(m).length > 0);
    } else if (activeFilter !== "all") {
      list = list.filter((m) => m.type === activeFilter);
    }

    // 2. Sort
    if (sortOrder === "newest" || sortOrder === "chronological") {
      list.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    } else if (sortOrder === "oldest") {
      list.sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    } else if (sortOrder === "most_connected" || sortOrder === "by_connection") {
      list.sort((a, b) => getConnectedMemories(b).length - getConnectedMemories(a).length);
    } else if (sortOrder === "alphabetical") {
      list.sort((a, b) => getLocalizedTitle(a, language).localeCompare(getLocalizedTitle(b, language)));
    } else if (sortOrder === "serendipity") {
      list.sort((a, b) => {
        const hashA = (a.id + shuffleSeed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hashB = (b.id + shuffleSeed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return ((hashA * 9301 + 49297) % 233280) - ((hashB * 9301 + 49297) % 233280);
      });
    } else if (sortOrder === "by_type") {
      const typeRank: Record<string, number> = {
        idea: 1,
        learning: 2,
        moment: 3,
        decision: 4,
        plan: 5,
        collection: 6,
        receipt: 7,
      };
      list.sort((a, b) => (typeRank[a.type] || 99) - (typeRank[b.type] || 99));
    } else if (sortOrder === "thematic") {
      list.sort((a, b) => (a.topics[0] || "").localeCompare(b.topics[0] || ""));
    }

    return list;
  }, [memories, activeFilter, sortOrder, relationships, allMemories, shuffleSeed, language]);

  // Tactile Editorial Paper Stock Presets (eliminates flat monotone feel)
  const PAPER_STOCK_PRESETS: Record<string, { bg: string; border: string; tape: string }> = {
    idea: { bg: "#FDF3EF", border: "#F0DDD4", tape: "rgba(192, 90, 70, 0.45)" }, // 暖杏和纸
    learning: { bg: "#EFF4F8", border: "#D8E4ED", tape: "rgba(91, 123, 148, 0.45)" }, // 冰海方格纸
    moment: { bg: "#FBF5E8", border: "#EDE2CC", tape: "rgba(196, 154, 86, 0.45)" }, // 琥珀牛皮纸
    decision: { bg: "#F4F1F8", border: "#DFD9E8", tape: "rgba(124, 111, 147, 0.45)" }, // 暮山紫笺
    plan: { bg: "#EFF4EE", border: "#D8E4D6", tape: "rgba(96, 128, 102, 0.45)" }, // 鼠尾草植物纸
    achievement: { bg: "#F8EFEA", border: "#E8D8CF", tape: "rgba(166, 107, 78, 0.45)" }, // 焦糖复古纸
    collection: { bg: "#EFF3F5", border: "#D4DEE2", tape: "rgba(90, 125, 143, 0.45)" }, // 烟灰石青纸
  };

  // Craft.do & Pinterest Editorial Scrapbook Paper Themes synchronized with Type Colors
  const getScrapbookTheme = (type: string, index: number) => {
    const tilts = ["rotate-[-0.6deg]", "rotate-[0.7deg]", "rotate-[-0.4deg]", "rotate-[0.8deg]", "rotate-[-0.8deg]"];
    const tilt = tilts[index % tilts.length];
    const typeColor = getTypeColor(type);
    const isDark = settings?.theme === "obsidian-dark";

    const stock = PAPER_STOCK_PRESETS[type] || {
      bg: isDark ? "var(--card-white)" : `${typeColor}18`,
      border: `${typeColor}45`,
      tape: `${typeColor}50`,
    };

    return {
      bg: isDark ? "var(--card-white)" : stock.bg,
      cardBorder: isDark ? "var(--border-subtle)" : stock.border,
      accentBar: typeColor,
      textColor: isDark ? "var(--ink-primary)" : "#1F1D1B",
      metaColor: isDark ? "var(--ink-secondary)" : "#57524E",
      badgeBg: typeColor,
      badgeText: "#FFFFFF",
      tapeColor: stock.tape,
      tapeRotate: index % 2 === 0 ? "-1.2deg" : "1.1deg",
      tilt,
    };
  };

  return (
    <div className={`w-full flex-1 min-h-full overflow-y-auto flex flex-col select-none relative paper-${paperPattern} notebook-spine-shadow transition-all`}>
      {/* 1. TOP FROSTED GLASS CONTROL RIBBON (Filter, Sort, Paper Texture) - Flush to top edge with 0 gap */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-6 md:px-8 py-2.5 bg-[var(--canvas-paper)]/95 backdrop-blur-md border-b border-[var(--grid-line)] shadow-2xs transition-colors">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          {/* Left: Filter Pills (Smart: Only show types with count > 0) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[var(--ink-secondary)] font-medium flex items-center gap-1 text-[11px] mr-0.5">
              <Filter className="w-3 h-3 text-[var(--ink-primary)]" />
              <span>{language === "zh" ? "筛选:" : "FILTER:"}</span>
            </span>

            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 border border-[var(--grid-line)] font-medium transition-all rounded-md cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[var(--ink-primary)] text-[var(--card-white)] shadow-xs"
                  : "bg-[var(--card-white)] text-[var(--ink-primary)] hover:bg-[var(--panel-bg)]"
              }`}
            >
              {language === "zh" ? "全部" : "ALL"} ({memories.length})
            </button>

            {filterItems.map((item) => {
              const isActive = activeFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFilter(isActive ? "all" : item.id)}
                  style={
                    isActive
                      ? { backgroundColor: item.colorHex, color: "#fff", borderColor: item.colorHex }
                      : { borderLeftColor: item.colorHex, borderLeftWidth: "3px" }
                  }
                  className={`px-2.5 py-1 border border-[var(--grid-line)] font-medium transition-all rounded-md cursor-pointer ${
                    isActive
                      ? "shadow-xs"
                      : "bg-[var(--card-white)] text-[var(--ink-primary)] hover:bg-[var(--panel-bg)]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="ml-1 opacity-70 text-[10px]">({item.count})</span>
                </button>
              );
            })}

            {hasLinkedMemories && (
              <button
                onClick={() => setActiveFilter(activeFilter === "linked" ? "all" : "linked")}
                className={`px-2.5 py-1 border border-[var(--grid-line)] font-medium transition-all flex items-center gap-1 rounded-md cursor-pointer ${
                  activeFilter === "linked"
                    ? "bg-[#5B7B94] text-white shadow-xs border-[#5B7B94]"
                    : "bg-[var(--card-white)] text-[var(--ink-primary)] hover:bg-[var(--panel-bg)]"
                }`}
                title={language === "zh" ? "仅显示已建立关联的记忆节点" : "Show memories with connections only"}
              >
                <Link2 className={`w-3 h-3 ${activeFilter === "linked" ? "text-white" : "text-[#5B7B94]"}`} />
                <span>{language === "zh" ? "仅关联" : "Linked"}</span>
              </button>
            )}
          </div>

          {/* Right: Compact Sort & Paper Pattern Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Compact Sort Control */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--ink-secondary)] font-medium flex items-center gap-1 text-[11px]">
                <ArrowUpDown className="w-3 h-3 text-[var(--ink-primary)]" />
                <span className="hidden sm:inline">{language === "zh" ? "排序:" : "SORT:"}</span>
              </span>

              <select
                value={sortOrder === "chronological" ? "newest" : sortOrder === "by_connection" ? "most_connected" : sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs bg-[var(--card-white)] border border-[var(--grid-line)] text-[var(--ink-primary)] rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-[var(--ink-secondary)] transition-colors shadow-2xs font-medium"
              >
                <option value="newest">{language === "zh" ? "最新时间" : "Newest"}</option>
                <option value="oldest">{language === "zh" ? "最早起源" : "Oldest"}</option>
                <option value="most_connected">{language === "zh" ? "最多连结" : "Most Linked"}</option>
                <option value="alphabetical">{language === "zh" ? "字母排序" : "A-Z"}</option>
              </select>

              <button
                onClick={handleShuffle}
                className={`p-1.5 rounded-lg border border-[var(--grid-line)] transition-colors cursor-pointer shadow-2xs ${
                  sortOrder === "serendipity"
                    ? "bg-[#C49A56] text-white"
                    : "bg-[var(--card-white)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--panel-bg)]"
                }`}
                title={language === "zh" ? "随机打乱排序，灵感漫步" : "Shuffle cards order for serendipity"}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact Paper Texture Selector */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--grid-line)]">
              <span className="text-[11px] font-medium text-[var(--ink-secondary)] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#C49A56]" />
                <span className="hidden sm:inline">{language === "zh" ? "纸张:" : "PAPER:"}</span>
              </span>

              <select
                value={paperPattern}
                onChange={(e) => handleSelectPaperPattern(e.target.value as any)}
                className="text-xs bg-[var(--card-white)] border border-[var(--grid-line)] text-[var(--ink-primary)] rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-[var(--ink-secondary)] transition-colors shadow-2xs font-medium"
              >
                <option value="dot-grid">{language === "zh" ? "点阵纸" : "Dot Grid"}</option>
                <option value="graph-grid">{language === "zh" ? "方格纸" : "Graph Paper"}</option>
                <option value="lined">{language === "zh" ? "横线纸" : "Ruled"}</option>
                <option value="plain">{language === "zh" ? "纯白纸" : "Plain"}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PADDED SCROLLABLE CONTENT BODY */}
      <div className="w-full flex-1 p-3 sm:p-5 md:p-8 flex flex-col gap-6">
        {/* TOP FOCUSED WRITING DESK (Daily Muse Slip + Today Journal Editor) */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 relative pt-1">
          {/* Daily Muse Prompt Slip */}
          <DailyMuseSlip onInsertPrompt={(prompt) => setInsertedPrompt(prompt)} />

          {/* Today Journal Editor */}
          <TodayEditor initialPrompt={insertedPrompt} />
        </div>

      {/* 3. THE MEMORY STREAM (Scrapbook Multi-Column Masonry or Empty State) */}
      <div className="w-full">
        {sortedAndFilteredMemories.length === 0 ? (
          <div className="w-full max-w-xl mx-auto my-10 p-8 text-center bg-[#FAF6EE] border-2 border-dashed border-[#DDD2C1] rounded-2xl shadow-xs">
            {activeFilter !== "all" ? (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-3xl">🔍</span>
                <h3 className="text-base font-bold text-stone-800">
                  {language === "zh" ? "未找到筛选结果" : "No matching memories"}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm">
                  {language === "zh"
                    ? `分类「${activeFilter}」下暂无记忆。`
                    : `No memories found for category "${activeFilter}".`}
                </p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  {language === "zh" ? "清除筛选" : "Clear filter"}
                </button>
              </div>
            ) : appMode === "production" ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F0EA] border border-[#C5D9CA] flex items-center justify-center text-[#2D5A3C] text-2xl font-mono-meta font-bold">
                  🌱
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  {language === "zh" ? "正式个人手账 · 纯净画卷" : "Personal Journal · Fresh Canvas"}
                </h3>
                <p className="text-xs text-stone-600 max-w-md leading-relaxed">
                  {language === "zh"
                    ? "当前为正式版纯净状态。在上方输入框写下今天的生活微光、灵感随笔或心智决策，打造属于你的独家心智知识库。"
                    : "Your personal journal is ready. Capture today's sparks, thoughts, or decisions above to build your private knowledge ledger."}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  <button
                    onClick={() => loadDemoData()}
                    className="px-4 py-2 rounded-xl bg-white border border-[#DDD2C1] hover:border-amber-400 hover:bg-amber-50/60 text-stone-700 text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === "zh" ? "载入 Hackathon 评测演示数据" : "Load Hackathon Demo Mock Data"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-3xl">✨</span>
                <h3 className="text-base font-bold text-stone-800">
                  {language === "zh" ? "画布为空" : "No memories yet"}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm">
                  {language === "zh"
                    ? "你可以直接在上方输入你的第一条记录，或一键载入演示数据体验完整功能。"
                    : "Write your first entry above or load demo memories to explore."}
                </p>
                <button
                  onClick={() => loadDemoData()}
                  className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "zh" ? "载入官方演示数据" : "Load Demo Mock Data"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Full-Width Multi-Column Masonry Memory Stream (Generous breathing space) */
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 2xl:columns-5 gap-5">
            {sortedAndFilteredMemories.map((mem, index) => {
            const theme = getScrapbookTheme(mem.type, index);
            const connectedMems = getConnectedMemories(mem);

            const isCardSelfHovered = hoveredCardId === mem.id;
            const isCardDirectTarget = hoveredTargetNodeId === mem.id;
            const isCardConnectedToHovered = activeConnectedIds.has(mem.id);
            const hasAnyHover = Boolean(hoveredCardId || hoveredTargetNodeId);
            const isCardDimmed =
              hasAnyHover && !isCardSelfHovered && !isCardDirectTarget && !isCardConnectedToHovered;

            let interactionClass = "hover:border-[#C4BAAC]";
            if (isCardDirectTarget) {
              interactionClass = "ring-2 ring-[#C49A56] z-20 shadow-md";
            } else if (isCardConnectedToHovered) {
              interactionClass = "ring-2 ring-[#5B7B94] z-10 shadow-sm";
            } else if (isCardDimmed) {
              interactionClass = "opacity-35";
            }

            return (
              <div
                key={mem.id}
                onClick={() => setSelectedMemoryId(mem.id)}
                onMouseEnter={() => setHoveredCardId(mem.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{
                  backgroundColor: theme.bg,
                  borderColor: theme.cardBorder,
                  borderTopColor: theme.accentBar,
                  borderTopWidth: "4px",
                  color: theme.textColor,
                }}
                className={`break-inside-avoid [break-inside:avoid-column] mb-5 relative p-4 sm:p-5 border rounded-sm shadow-xs ${theme.tilt} transform-gpu backface-hidden will-change-transform hover:shadow-md ${interactionClass} transition-[opacity,box-shadow,border-color] duration-150 cursor-pointer select-none group flex flex-col justify-between`}
              >
                {/* Washi Tape Strip at Top */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4.5 pointer-events-none z-10 shadow-xs"
                  style={{
                    backgroundColor: theme.tapeColor,
                    transform: `translateX(-50%) rotate(${theme.tapeRotate})`,
                    clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
                    backdropFilter: "blur(2px)",
                  }}
                />

                {/* Card Top: Type Badge, Level, Star & Date Stamp */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                        }}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-xs tracking-wide uppercase shadow-2xs"
                      >
                        {t[`memory_type_${mem.type}` as keyof typeof t] || mem.type}
                      </span>

                      {/* L0-L4 Cognitive Level Badge */}
                      {(() => {
                        const level = getMemoryLevel(mem);
                        const meta = MEMORY_LEVELS_META[level];
                        if (!meta) return null;
                        return (
                          <span
                            className="text-[9.5px] font-mono px-1.5 py-0.2 border rounded-xs font-semibold shadow-2xs"
                            style={{
                              borderColor: `${meta.color}50`,
                              color: meta.color,
                              backgroundColor: `${meta.color}14`,
                            }}
                            title={language === "zh" ? `${meta.code} · ${meta.nameZh}: ${meta.descZh}` : `${meta.code} · ${meta.nameEn}`}
                          >
                            {meta.code} · {language === "zh" ? meta.shortZh : meta.shortEn}
                          </span>
                        );
                      })()}

                      {/* STAR Win Stamp Badge */}
                      {mem.star && (
                        <span
                          className="flex items-center gap-0.5 text-[9.5px] bg-amber-50 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 font-medium rounded-xs shadow-2xs"
                          title={language === "zh" ? "职场胜仗与 STAR 成果" : "STAR Achievement"}
                        >
                          <Award className="w-2.5 h-2.5 text-amber-700" />
                          <span>STAR</span>
                        </span>
                      )}

                      {mem.timeline_logs && mem.timeline_logs.length > 1 && (
                        <span
                          className="flex items-center gap-1 text-[10px] bg-emerald-50/90 text-emerald-800 border border-emerald-300/60 px-1.5 py-0.5 font-medium rounded-xs shadow-2xs"
                          title={language === "zh" ? `多日沉淀，共 ${mem.timeline_logs.length} 次演进更新` : `${mem.timeline_logs.length} timeline logs`}
                        >
                          <Sprout className="w-3 h-3 text-emerald-600 inline" />
                          <span>{mem.timeline_logs.length} {language === "zh" ? "次演进" : "updates"}</span>
                        </span>
                      )}

                      {connectedMems.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-white/80 text-[var(--ink-secondary)] px-1.5 py-0.5 border border-[#E0D8CB] font-medium rounded-xs">
                          <Link2 className="w-2.5 h-2.5 text-[#5B7B94]" />
                          {connectedMems.length} {language === "zh" ? "连结" : "linked"}
                        </span>
                      )}
                    </div>

                    {/* Postal Mark Tag */}
                    <span className="text-[9px] font-mono text-[var(--ink-muted)] opacity-75">
                      #{mem.id.slice(-4)}
                    </span>
                  </div>

                  {/* Title (Editorial Style) */}
                  <h4
                    style={{ color: theme.textColor }}
                    className="font-bold text-[14.5px] tracking-tight leading-snug font-sans group-hover:text-[var(--ink-primary)] transition-colors"
                  >
                    {getLocalizedTitle(mem, language)}
                  </h4>

                  {/* Body Content (Natural length, not clamped harshly!) */}
                  {mem.content && (
                    <p
                      style={{ color: theme.metaColor }}
                      className="mt-1.5 leading-relaxed font-sans text-xs font-normal"
                    >
                      {getLocalizedContent(mem, language)}
                    </p>
                  )}

                  {/* Visual Attachment Preview (Polaroid Style Paper Cutout) */}
                  {mem.media_url && (
                    <div className="mt-3 p-1.5 pb-3.5 bg-white border border-[#E5DFD4] shadow-xs rotate-[-0.8deg] group-hover:rotate-0 transition-transform duration-200">
                      <img
                        src={mem.media_url}
                        alt={getLocalizedTitle(mem, language)}
                        className="w-full h-auto object-cover max-h-56"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Relationship Nodes */}
                  {connectedMems.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 mt-3">
                      <span
                        style={{ color: theme.metaColor }}
                        className="text-[9px] font-mono-meta font-bold flex items-center gap-0.5 mr-0.5"
                      >
                        <Link2 className="w-2.5 h-2.5 text-[#5B7B94]" />
                        <span>NODE:</span>
                      </span>

                      {connectedMems.slice(0, 3).map((target) => (
                        <button
                          key={target.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemoryId(target.id);
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setHoveredTargetNodeId(target.id);
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            setHoveredTargetNodeId(null);
                          }}
                          className="text-[10px] font-sans px-1.5 py-0.5 border border-[#E0D8CB] bg-white/90 text-[var(--ink-secondary)] hover:bg-[var(--ink-primary)] hover:text-white flex items-center gap-1 font-medium rounded-xs shadow-2xs transition-colors"
                          title={
                            language === "zh"
                              ? `点击跳转到关联节点: ${getLocalizedTitle(target, language)}`
                              : `Jump to linked node: ${getLocalizedTitle(target, language)}`
                          }
                        >
                          <span>[[{getLocalizedTitle(target, language)}]]</span>
                        </button>
                      ))}

                      {connectedMems.length > 3 && (
                        <span
                          style={{ color: theme.metaColor }}
                          className="text-[9px] font-sans font-medium self-center"
                        >
                          +{connectedMems.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectionModalMemoryId(mem.id);
                        }}
                        className="text-[10px] font-sans px-1.5 py-0.5 border border-dashed border-[#B8AEA0] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)] flex items-center gap-1 bg-white/50 rounded-xs transition-colors"
                        title={language === "zh" ? "连结新记忆节点" : "Link new node"}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{language === "zh" ? "连结节点" : "Link Node"}</span>
                      </button>
                    </div>
                  )}

                  {/* Topic Hashtags */}
                  {mem.topics && mem.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {mem.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="text-[9.5px] font-sans px-1.5 py-0.2 rounded-xs border border-[#E5DFD4] bg-white/60 text-[var(--ink-muted)] font-normal"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Date & Stamp */}
                <div
                  style={{ borderColor: theme.cardBorder }}
                  className="mt-3 pt-2 border-t border-dashed flex items-center justify-between text-[10px] font-sans text-[var(--ink-muted)]"
                >
                  <span className="flex items-center gap-1.5" suppressHydrationWarning>
                    <Calendar className="w-3 h-3 text-[var(--ink-muted)]" />
                    <span>{formatDisplayDate(mem.occurred_at)}</span>
                    <span className="opacity-75 font-mono">{formatDisplayTime(mem.occurred_at)}</span>
                  </span>

                  <span className="text-[9px] tracking-widest uppercase opacity-60">STAMP</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
      </div>
    </div>
  );
}
