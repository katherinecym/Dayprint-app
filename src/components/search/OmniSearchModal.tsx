"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Compass,
  Command,
  ArrowRight,
  BookOpen,
  Network,
  Sun,
  Moon,
  Laptop,
  Check,
  Calendar,
  Link2,
} from "lucide-react";
import { useMemory } from "@/lib/memory-context";
import {
  CanonicalMemory,
  MemoryLevel,
  MEMORY_LEVELS_META,
  getMemoryLevel,
  getLocalizedTitle,
  getLocalizedContent,
} from "@/types/memory";

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScoredMemory {
  memory: CanonicalMemory;
  score: number;
  matchedReason: string;
  matchedLevel: MemoryLevel;
  similarityPercent: number;
}

export function OmniSearchModal({ isOpen, onClose }: OmniSearchModalProps) {
  const {
    memories,
    setSelectedMemoryId,
    setViewMode,
    settings,
    updateSettings,
    language,
    selectedDate,
  } = useMemory();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Global hotkey ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Hybrid Retrieval Simulation: Keyword + Semantic Intent Matching
  const searchResults: ScoredMemory[] = useMemo(() => {
    if (!query.trim()) {
      // Default: Return the most recent 6 memories with cognitive levels
      return memories.slice(0, 7).map((m, idx) => ({
        memory: m,
        score: 100 - idx,
        matchedReason: language === "zh" ? "最近记忆" : "Recent Memory",
        matchedLevel: getMemoryLevel(m),
        similarityPercent: 95 - idx * 2,
      }));
    }

    const q = query.toLowerCase().trim();
    const scored: ScoredMemory[] = [];

    // Semantic intent detectors
    const isHabitIntent = q.includes("习惯") || q.includes("偏好") || q.includes("habit") || q.includes("preference") || q.includes("喜好");
    const isPersonaIntent = q.includes("画像") || q.includes("人设") || q.includes("性格") || q.includes("特质") || q.includes("persona");
    const isBeliefIntent = q.includes("信念") || q.includes("信条") || q.includes("价值观") || q.includes("原则") || q.includes("belief") || q.includes("value");
    const isVisionIntent = q.includes("愿景") || q.includes("目标") || q.includes("规划") || q.includes("未来") || q.includes("goal") || q.includes("vision");
    const isIdeaIntent = q.includes("灵感") || q.includes("想法") || q.includes("点子") || q.includes("idea");
    const isTodayIntent = q.includes("今天") || q.includes("今日") || q.includes("today");

    memories.forEach((m) => {
      let score = 0;
      let reason = language === "zh" ? "模糊检索" : "Fuzzy Match";
      const lvl = getMemoryLevel(m);

      const titleLower = (m.title || "").toLowerCase();
      const titleZh = (m.title_zh || "").toLowerCase();
      const titleEn = (m.title_en || "").toLowerCase();
      const contentLower = (m.content || "").toLowerCase();
      const contentZh = (m.content_zh || "").toLowerCase();
      const contentEn = (m.content_en || "").toLowerCase();
      const topicsLower = (m.topics || []).join(" ").toLowerCase();

      // 1. Direct Keyword Match
      if (titleLower.includes(q) || titleZh.includes(q) || titleEn.includes(q)) {
        score += 65;
        reason = language === "zh" ? "标题精准匹配" : "Title Match";
      }
      if (contentLower.includes(q) || contentZh.includes(q) || contentEn.includes(q)) {
        score += 35;
        if (score < 50) reason = language === "zh" ? "正文内容匹配" : "Content Match";
      }
      if (topicsLower.includes(q)) {
        score += 45;
        reason = language === "zh" ? "主题标签匹配" : "Topic Tag Match";
      }

      // 2. Semantic Intent Boosting
      if (isHabitIntent && lvl === "L2") {
        score += 55;
        reason = language === "zh" ? "命中习惯偏好" : "Habit Intent";
      }
      if (isPersonaIntent && (lvl === "L1" || lvl === "L3")) {
        score += 60;
        reason = language === "zh" ? "命中心智画像" : "Persona Intent";
      }
      if (isBeliefIntent && lvl === "L4") {
        score += 70;
        reason = language === "zh" ? "命中核心信条" : "Belief Intent";
      }
      if (isVisionIntent && lvl === "L3") {
        score += 60;
        reason = language === "zh" ? "命中长期愿景" : "Vision Intent";
      }
      if (isIdeaIntent && m.type === "idea") {
        score += 40;
        reason = language === "zh" ? "灵感分类匹配" : "Idea Type Match";
      }
      if (isTodayIntent && m.occurred_at.startsWith(selectedDate)) {
        score += 50;
        reason = language === "zh" ? "今日碎片记录" : "Today's Fragment";
      }

      if (score > 0) {
        const similarityPercent = Math.min(99, Math.max(68, Math.round(55 + score * 0.45)));
        scored.push({
          memory: m,
          score,
          matchedReason: reason,
          matchedLevel: lvl,
          similarityPercent,
        });
      }
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [memories, query, language, selectedDate]);

  // Handle keyboard navigation (Arrow Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = searchResults[selectedIndex];
      if (target) {
        setSelectedMemoryId(target.memory.id);
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-neutral-900 shadow-2xl overflow-hidden flex flex-col font-sans"
          >
            {/* 1. Search Header Bar */}
            <div className="flex items-center px-4 py-3 border-b border-black bg-[#FAF7EE] gap-3">
              <Search className="w-5 h-5 text-neutral-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === "zh"
                    ? "输入自然语言、关键词或意图（如：我关于设计的思考、习惯、咖啡...）"
                    : "Semantic search across all memories, habits, and beliefs..."
                }
                className="w-full bg-transparent text-sm font-bold text-black placeholder:text-neutral-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-neutral-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono-meta font-bold bg-white border border-black shadow-xs">
                ESC
              </kbd>
            </div>

            {/* 2. Semantic Intent & Suggestions Pill Bar */}
            <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono-meta">
              <span className="text-neutral-500 font-bold shrink-0 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#1D45B8]" />
                <span>{language === "zh" ? "语义联想:" : "SUGGESTIONS:"}</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {(language === "zh"
                  ? [
                      { label: "灵感与思考", q: "灵感" },
                      { label: "习惯偏好", q: "偏好习惯" },
                      { label: "心智画像", q: "画像特质" },
                      { label: "核心信条", q: "信念价值观" },
                    ]
                  : [
                      { label: "Ideas & Thoughts", q: "idea" },
                      { label: "Habits & Skills", q: "habit" },
                      { label: "Mental Persona", q: "persona" },
                      { label: "Core Beliefs", q: "belief" },
                    ]
                ).map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setQuery(item.q);
                      setSelectedIndex(0);
                    }}
                    className="px-2 py-0.5 bg-white border border-neutral-300 hover:border-black hover:bg-black hover:text-white transition-colors text-[10px] font-bold"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Search Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1.5">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <p className="text-sm font-bold">
                    {language === "zh" ? "没有匹配到相关记忆碎片" : "No matching memories found"}
                  </p>
                  <p className="text-xs mt-1">
                    {language === "zh"
                      ? "可以尝试换用自然语言表述或意图关键词"
                      : "Try different search keywords or natural language query"}
                  </p>
                </div>
              ) : (
                searchResults.map((res, idx) => {
                  const isSelected = selectedIndex === idx;
                  const lvlMeta = MEMORY_LEVELS_META[res.matchedLevel];

                  return (
                    <div
                      key={res.memory.id}
                      onClick={() => {
                        setSelectedMemoryId(res.memory.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#FAF7EE] border-black ring-1 ring-black"
                          : "bg-white border-neutral-200 hover:border-black"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {/* Meta Header */}
                        <div className="flex items-center gap-1.5 mb-1 font-mono-meta text-[10px]">
                          <span
                            style={{ backgroundColor: lvlMeta.color }}
                            className="text-white font-bold px-1.5 py-0.2 border border-black uppercase text-[9px]"
                          >
                            {res.matchedLevel}
                          </span>
                          <span className="font-bold text-neutral-600 uppercase bg-neutral-100 px-1 py-0.2 border border-neutral-300">
                            {res.memory.type}
                          </span>
                          <span className="text-neutral-400">
                            {res.memory.occurred_at.slice(0, 10)}
                          </span>
                          <span className="ml-auto text-[#1D45B8] font-bold bg-[#E5EBFA] px-1.5 py-0.2 border border-[#1D45B8]/30">
                            {res.matchedReason} ({res.similarityPercent}%)
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-black truncate leading-snug">
                          {getLocalizedTitle(res.memory, language)}
                        </h4>

                        {/* Content snippet */}
                        {res.memory.content && (
                          <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 font-sans">
                            {getLocalizedContent(res.memory, language)}
                          </p>
                        )}
                      </div>

                      <ArrowRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? "text-black translate-x-0.5" : "text-neutral-300"
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. Footer Quick Actions & Hotkeys */}
            <div className="p-3 bg-[#181818] text-white border-t-2 border-black flex flex-wrap items-center justify-between gap-2 font-mono-meta text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[11px]">
                  {language === "zh" ? "快捷直达:" : "QUICK JUMP:"}
                </span>
                <button
                  onClick={() => {
                    setViewMode("daily");
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-black border border-neutral-600 hover:border-white text-[10px] font-bold"
                >
                  {language === "zh" ? "今日原文日志" : "Today's Raw Stream"}
                </button>
                <button
                  onClick={() => {
                    setViewMode("memory_os");
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-[#1D45B8] border border-white text-[10px] font-bold text-white cursor-pointer"
                >
                  {language === "zh" ? "记忆中枢" : "Memory OS"}
                </button>
                <button
                  onClick={() => {
                    setViewMode("graph");
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-[#DD2E1E] border border-white text-[10px] font-bold text-white"
                >
                  {language === "zh" ? "关系图谱 (Graph)" : "Knowledge Graph"}
                </button>
              </div>

              {/* Theme Switcher Quick Controls */}
              <div className="flex items-center gap-1 border border-neutral-700 bg-black p-0.5">
                {[
                  { id: "boogie-paper", label: language === "zh" ? "米黄" : "Paper", icon: Sun },
                  { id: "obsidian-dark", label: language === "zh" ? "暗黑" : "Dark", icon: Moon },
                  { id: "studio-light", label: language === "zh" ? "极简白" : "Light", icon: Laptop },
                ].map((th) => {
                  const isActive = settings.theme === th.id;
                  const Icon = th.icon;
                  return (
                    <button
                      key={th.id}
                      onClick={() => updateSettings({ theme: th.id as any })}
                      className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        isActive ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      <span>{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
