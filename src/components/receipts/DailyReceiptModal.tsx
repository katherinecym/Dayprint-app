"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import { getLocalizedTitle, getLocalizedContent } from "@/types/memory";
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  Save,
  PenTool,
  Plus,
  Smile,
  ExternalLink,
  Bookmark,
  Receipt,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { formatDisplayTime } from "@/types/memory";

interface DailyReceiptModalProps {
  onClose: () => void;
}

const MOOD_PRESETS = [
  { id: "terracotta", label: "陶土红 · 热情", labelEn: "Terracotta · Energized", shortZh: "热情", shortEn: "Energized", descZh: "充满干劲、活力与行动力", color: "#C97A63", wash: "rgba(201, 122, 99, 0.24)" },
  { id: "amber", label: "琥珀蜜 · 灵感", labelEn: "Amber · Inspired", shortZh: "灵感", shortEn: "Inspired", descZh: "顿悟闪光、创造心流", color: "#C49A56", wash: "rgba(196, 154, 86, 0.24)" },
  { id: "sage", label: "苍青绿 · 平和", labelEn: "Sage · Calm", shortZh: "平和", shortEn: "Calm", descZh: "松弛从容、内心安定", color: "#608066", wash: "rgba(96, 128, 102, 0.24)" },
  { id: "fjord", label: "冰海蓝 · 澄澈", labelEn: "Fjord · Focused", shortZh: "澄澈", shortEn: "Focused", descZh: "清醒理性、专注沉浸", color: "#5B7B94", wash: "rgba(91, 123, 148, 0.24)" },
  { id: "twilight", label: "暮山紫 · 内省", labelEn: "Twilight · Reflective", shortZh: "内省", shortEn: "Reflective", descZh: "深度复盘、静水流深", color: "#9A8BB8", wash: "rgba(154, 139, 184, 0.24)" },
];

export function DailyReceiptModal({ onClose }: DailyReceiptModalProps) {
  const {
    selectedDate,
    setSelectedDate,
    getDailyReceipt,
    saveDailyReceipt,
    storedReceipts,
    memories,
    language,
  } = useMemory();

  // Extract all distinct recorded dates (newest first: Today -> Yesterday -> ...)
  const allRecordedDates = useMemo(() => {
    const dates = new Set<string>();
    memories.forEach((m) => {
      if (m.occurred_at) dates.add(m.occurred_at.slice(0, 10));
    });
    Object.keys(storedReceipts).forEach((d) => dates.add(d));
    if (selectedDate) dates.add(selectedDate);

    // Ensure today's date is included
    const todayStr = new Date().toISOString().slice(0, 10);
    dates.add(todayStr);

    return Array.from(dates).sort().reverse();
  }, [memories, storedReceipts, selectedDate]);

  // Active viewing index in carousel
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const idx = allRecordedDates.indexOf(selectedDate);
    return idx >= 0 ? idx : 0;
  });

  // Mood and Reflection states per date
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [savedDay, setSavedDay] = useState<string | null>(null);

  // Sync moods and reflections from storedReceipts
  useEffect(() => {
    const defaultMood = language === "zh" ? "陶土红 · 热情" : "Terracotta · Energized";
    const moodMap: Record<string, string> = {};
    const refMap: Record<string, string> = {};
    allRecordedDates.forEach((date) => {
      const rec = storedReceipts[date];
      moodMap[date] = rec?.mood || defaultMood;
      refMap[date] = rec?.custom_reflection || "";
    });
    setMoods(moodMap);
    setReflections(refMap);
  }, [allRecordedDates, storedReceipts, language]);

  // Refs for smooth scroll & snap
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRailRef = useRef<HTMLDivElement>(null);

  // Scroll to card by index
  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= allRecordedDates.length) return;
    setActiveIndex(index);
    const container = scrollContainerRef.current;
    const targetCard = cardRefs.current[index];
    if (container && targetCard) {
      const containerWidth = container.offsetWidth;
      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      container.scrollTo({
        left: cardLeft - (containerWidth - cardWidth) / 2,
        behavior: "smooth",
      });
    }

    // Auto-scroll timeline rail pill into view
    const rail = timelineRailRef.current;
    if (rail) {
      const pill = rail.children[index] as HTMLElement;
      if (pill) {
        pill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  };

  // Initial scroll on mount
  useEffect(() => {
    const initialIndex = allRecordedDates.indexOf(selectedDate);
    const targetIdx = initialIndex >= 0 ? initialIndex : 0;
    setTimeout(() => {
      scrollToIndex(targetIdx);
    }, 80);
  }, []);

  // Keyboard navigation: Left/Right arrows & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(Math.min(allRecordedDates.length - 1, activeIndex + 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, allRecordedDates.length, onClose]);

  // Scroll spy to detect active card when user swipes/scrolls horizontally
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Save current day's receipt with reflection & mood
  const handleSaveDay = (date: string) => {
    const defaultMood = language === "zh" ? "陶土红 · 热情" : "Terracotta · Energized";
    const receipt = getDailyReceipt(date);
    saveDailyReceipt({
      ...receipt,
      custom_reflection: (reflections[date] || "").trim(),
      mood: (moods[date] || defaultMood).trim(),
    });
    setSavedDay(date);
    confetti({
      particleCount: 36,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#C97A63", "#5B7B94", "#C49A56", "#608066"],
    });
    setTimeout(() => setSavedDay(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const getDateLabel = (dateStr: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) {
      return language === "zh" ? "今天" : "Today";
    }
    if (dateStr === yesterdayStr) {
      return language === "zh" ? "昨天" : "Yesterday";
    }
    return null;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col bg-stone-900/45 backdrop-blur-xs select-none overflow-hidden"
    >
      {/* 1. Unified Editorial Top Navigation Bar */}
      <header
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[var(--card-white)] border-b border-[var(--grid-line)] text-[var(--ink-primary)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 z-30 shadow-xs"
      >
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#C97A63]/15 border border-[#C97A63]/30 flex items-center justify-center text-[#C97A63]">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--ink-primary)]">
                {language === "zh" ? "生活存根画卷" : "Life Stubs Archive"}
              </h2>
              <span className="text-[10px] font-mono-meta bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                {language === "zh"
                  ? `第 ${activeIndex + 1} / ${allRecordedDates.length} 天`
                  : `${activeIndex + 1} of ${allRecordedDates.length}`}
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] hidden sm:block">
              {language === "zh"
                ? "左右滑动翻阅每日实体生活存根，记录今日心情水彩与反思复盘"
                : "Swipe to browse physical archival slips, record daily mood & closing reflection"}
            </p>
          </div>
        </div>

        {/* Center: Unified Segmented Date Switcher Rail */}
        <div
          ref={timelineRailRef}
          className="inline-flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200/90 max-w-xl mx-2 overflow-x-auto no-scrollbar gap-1"
        >
          {allRecordedDates.map((date, idx) => {
            const label = getDateLabel(date);
            const isCurrent = idx === activeIndex;
            const hasArchive = Boolean(storedReceipts[date]);

            return (
              <button
                key={date}
                onClick={() => scrollToIndex(idx)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? "bg-white text-[var(--ink-primary)] font-semibold shadow-xs border border-stone-200/90"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                }`}
              >
                <span className="font-mono-meta">{date.slice(5)}</span>
                {label && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                      isCurrent
                        ? "bg-[#C97A63]/15 text-[#C97A63]"
                        : "bg-stone-200/80 text-stone-600"
                    }`}
                  >
                    {label}
                  </span>
                )}
                {hasArchive && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isCurrent ? "bg-[#C97A63]" : "bg-stone-400"
                    }`}
                    title="Archived"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Actions (Print & Close) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            title="Print Receipt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === "zh" ? "打印存根" : "Print"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. The Horizontal Receipt Carousel Viewport */}
      <main
        onClick={(e) => e.stopPropagation()}
        className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden"
      >
        {/* Large Floating Left Arrow */}
        <button
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="absolute left-4 sm:left-8 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center justify-center text-stone-700 hover:bg-white hover:scale-105 hover:text-stone-950 disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Previous (←)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Large Floating Right Arrow */}
        <button
          onClick={() => scrollToIndex(Math.min(allRecordedDates.length - 1, activeIndex + 1))}
          disabled={activeIndex === allRecordedDates.length - 1}
          className="absolute right-4 sm:right-8 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center justify-center text-stone-700 hover:bg-white hover:scale-105 hover:text-stone-950 disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Next (→)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full h-full flex items-center gap-6 sm:gap-10 overflow-x-auto snap-x snap-mandatory py-4 sm:py-6 px-8 sm:px-[15%] md:px-[25%] no-scrollbar scroll-smooth"
        >
          {allRecordedDates.map((date, idx) => {
            const isCurrent = idx === activeIndex;
            const isArchived = Boolean(storedReceipts[date]);
            const label = getDateLabel(date);
            const defaultMood = language === "zh" ? "陶土红 · 热情" : "Terracotta · Energized";
            const currentMood =
              moods[date] ||
              storedReceipts[date]?.mood ||
              defaultMood;

            // Memories for this specific date
            const dayMems = memories
              .filter((m) => m.occurred_at && m.occurred_at.startsWith(date))
              .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

            const activePreset =
              MOOD_PRESETS.find(
                (p) =>
                  currentMood.includes(p.id) ||
                  currentMood.includes(p.shortZh) ||
                  currentMood.includes(p.shortEn) ||
                  currentMood.includes(p.label)
              ) || MOOD_PRESETS[0];
            const dipDyeWash = activePreset.wash;

            return (
              <div
                key={date}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className={`w-[340px] sm:w-[390px] md:w-[420px] shrink-0 snap-center transition-all duration-300 flex flex-col h-[min(720px,calc(100vh-90px))] relative select-text ${
                  isCurrent
                    ? "scale-100 opacity-100 shadow-2xl border-x border-stone-300/80"
                    : "scale-95 opacity-40 hover:opacity-75 shadow-md border-x border-stone-200"
                }`}
              >
                {/* 1. TOP SAWTOOTH TEAR EDGE (Authentic Jagged Teeth) */}
                <div className="w-full h-3 shrink-0 overflow-hidden leading-none select-none flex text-[#FAF8F5] drop-shadow-xs">
                  <svg
                    className="w-full h-3"
                    preserveAspectRatio="none"
                    viewBox="0 0 240 12"
                    fill="currentColor"
                  >
                    <path d="M0,12 L6,0 L12,12 L18,0 L24,12 L30,0 L36,12 L42,0 L48,12 L54,0 L60,12 L66,0 L72,12 L78,0 L84,12 L90,0 L96,12 L102,0 L108,12 L114,0 L120,12 L126,0 L132,12 L138,0 L144,12 L150,0 L156,12 L162,0 L168,12 L174,0 L180,12 L186,0 L192,12 L198,0 L204,12 L210,0 L216,12 L222,0 L228,12 L234,0 L240,12 Z" />
                  </svg>
                </div>

                {/* 2. RECEIPT MAIN BODY (Warm Archival Paper with Dip-Dye Watercolor Wash) */}
                <div
                  style={{
                    background: `linear-gradient(180deg, #FAF8F5 65%, ${dipDyeWash} 100%)`,
                    transition: "background 0.4s ease",
                  }}
                  className="px-5 sm:px-6 py-4 flex-1 min-h-0 overflow-y-auto flex flex-col gap-3.5 font-sans text-xs relative"
                >
                  {/* Masthead Header: DATE & BRAND */}
                  <div className="text-center pb-3 border-b border-stone-200">
                    <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-mono tracking-widest uppercase font-medium">
                      <span>• DAYPRINT LIFE STUB •</span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-stone-900 tracking-tight mt-1">
                      {date}
                    </h3>

                    <div className="flex items-center justify-center gap-2 text-xs text-stone-600 mt-1 font-medium">
                      <span>
                        {new Date(date + "T00:00:00").toLocaleDateString(
                          language === "zh" ? "zh-CN" : "en-US",
                          { weekday: "long" }
                        )}
                      </span>
                      {label && (
                        <span className="bg-[#C97A63]/15 text-[#C97A63] px-2 py-0.2 rounded-full font-semibold text-[10px]">
                          {label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DAILY MOOD WASH (Selected Display Only) */}
                  <div
                    className="flex items-center justify-between py-2 px-3 rounded-xl border text-[11px] font-medium transition-colors"
                    style={{
                      backgroundColor: `${activePreset.color}10`,
                      borderColor: `${activePreset.color}35`,
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-stone-800">
                      <Smile className="w-3.5 h-3.5" style={{ color: activePreset.color }} />
                      <span>{language === "zh" ? "今日情绪水彩：" : "Daily Mood Wash:"}</span>
                    </span>
                    <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-stone-200 text-stone-800 font-semibold text-[10px] shadow-2xs">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: activePreset.color }} />
                      <span>{language === "zh" ? activePreset.label : activePreset.labelEn}</span>
                    </div>
                  </div>

                  {/* RECORDED ITEMS LIST */}
                  <div className="flex-1 py-1">
                    <div className="text-[10px] font-mono font-medium uppercase text-stone-400 pb-1.5 mb-2 border-b border-dashed border-stone-300 flex justify-between">
                      <span>{language === "zh" ? "今日记录清单" : "RECORDED SLIPS"}</span>
                      <span>TIME</span>
                    </div>

                    {dayMems.length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center gap-2 text-stone-400">
                        <p className="text-xs font-semibold text-stone-600">
                          {language === "zh" ? "当天暂无记录碎片" : "No slips recorded"}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {language === "zh"
                            ? "留白也是一种记忆 • 随时随地记上一笔"
                            : "A peaceful blank day in your archive"}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedDate(date);
                            onClose();
                          }}
                          className="mt-2 text-xs font-semibold px-3 py-1.5 bg-[#C97A63] text-white rounded-lg hover:bg-[#b86953] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === "zh" ? "去记一笔今日随想" : "Record a note"}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayMems.map((mem, i) => {
                          const timeStr = formatDisplayTime(mem.occurred_at);

                          return (
                            <div key={mem.id} className="leading-snug pb-2 border-b border-stone-200/60 last:border-b-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {String(i + 1).padStart(2, "0")}.
                                  </span>
                                  <span className="text-xs">{getLocalizedTitle(mem, language)}</span>
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                  {timeStr}
                                </span>
                              </div>

                              {mem.content && (
                                <p className="text-xs text-stone-600 pl-4 mt-0.5 line-clamp-2 leading-relaxed">
                                  {getLocalizedContent(mem, language)}
                                </p>
                              )}

                              {/* Miniature Polaroid Thumbnail */}
                              {mem.media_url && (
                                <div className="pl-4 mt-1.5">
                                  <img
                                    src={mem.media_url}
                                    alt={getLocalizedTitle(mem, language)}
                                    className="h-16 w-auto max-w-[140px] object-cover rounded-md border border-stone-200 shadow-2xs"
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {mem.topics && mem.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-4 mt-1.5">
                                  {mem.topics.map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="text-[9px] text-stone-500 font-mono bg-stone-200/50 px-1.5 py-0.5 rounded"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* TOTAL COUNT */}
                  <div className="pt-2 border-t border-dashed border-stone-300 flex items-center justify-between font-mono text-[11px] text-stone-700">
                    <span>{language === "zh" ? "TOTAL SLIPS // 碎片总数:" : "TOTAL RECORDED:"}</span>
                    <span className="bg-stone-900 text-white px-2 py-0.5 rounded font-semibold text-[10px]">
                      {dayMems.length} ITEMS
                    </span>
                  </div>

                  {/* REFLECTIONS & THOUGHTS (Displayed from Home Page) */}
                  {storedReceipts[date]?.custom_reflection || reflections[date] ? (
                    <div className="pt-2.5 border-t border-stone-200 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-stone-600 flex items-center gap-1.5 font-mono">
                        <PenTool className="w-3.5 h-3.5" style={{ color: activePreset.color }} />
                        <span>{language === "zh" ? "今日复盘与结语 (REFLECTION)：" : "DAILY REFLECTION:"}</span>
                      </span>
                      <p
                        className="text-xs text-stone-800 italic font-serif leading-relaxed pl-3 border-l-2 bg-white/70 py-2 pr-2.5 rounded-r shadow-2xs transition-colors"
                        style={{ borderLeftColor: activePreset.color }}
                      >
                        “{storedReceipts[date]?.custom_reflection || reflections[date]}”
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-dashed border-stone-200/90 text-center py-2 text-[10px] text-stone-400 font-mono">
                      {language === "zh"
                        ? "— 可在主页伴随面板中填写今日复盘与结语 —"
                        : "— Add daily reflection in the home companion panel —"}
                    </div>
                  )}

                  {/* 3. TACTILE ARCHIVED WAX / RUBBER STAMP */}
                  {(isArchived || savedDay === date) && (
                    <motion.div
                      initial={{ scale: 1.3, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 0.95, rotate: -10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      className="absolute bottom-20 right-5 border-2 rounded-lg font-mono-meta font-bold text-[10px] px-3 py-1.5 uppercase tracking-wider flex flex-col items-center justify-center pointer-events-none select-none bg-[#FAF8F5]/95 backdrop-blur-2xs shadow-xs transition-colors"
                      style={{
                        borderColor: activePreset.color,
                        color: activePreset.color,
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: activePreset.color }} />
                        <span>ARCHIVED</span>
                        <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: activePreset.color }} />
                      </div>
                      <div
                        className="text-[9px] border-t pt-0.5 mt-0.5 w-full text-center tracking-normal font-sans"
                        style={{ borderTopColor: `${activePreset.color}50` }}
                      >
                        {language === "zh" ? `${date} 已归档` : `${date} SAVED`}
                      </div>
                    </motion.div>
                  )}

                  {/* SLIP FOOTER ACTIONS */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2 mt-auto">
                    <button
                      onClick={() => {
                        setSelectedDate(date);
                        onClose();
                      }}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === "zh" ? "在主页中展开" : "View in Today"}</span>
                    </button>

                    <button
                      onClick={() => handleSaveDay(date)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                        savedDay === date
                          ? "bg-emerald-700 text-white"
                          : "bg-[#C97A63] text-white hover:bg-[#b86953]"
                      }`}
                    >
                      {savedDay === date ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {savedDay === date
                          ? language === "zh"
                            ? "已保存归档！"
                            : "Saved!"
                          : language === "zh"
                          ? "保存归档"
                          : "Archive Slip"}
                      </span>
                    </button>
                  </div>

                  {/* Clean Slip Metadata Stamp */}
                  <div className="text-center pt-1 text-[9px] text-stone-400 font-mono tracking-widest">
                    DAYPRINT SLIP #{date.replace(/-/g, "")}
                  </div>
                </div>

                {/* 4. BOTTOM SAWTOOTH TEAR EDGE (Authentic Jagged Teeth) */}
                <div className="w-full h-3 shrink-0 overflow-hidden leading-none select-none flex text-[#FAF8F5] drop-shadow-xs">
                  <svg
                    className="w-full h-3"
                    preserveAspectRatio="none"
                    viewBox="0 0 240 12"
                    fill="currentColor"
                  >
                    <path d="M0,0 L6,12 L12,0 L18,12 L24,0 L30,12 L36,0 L42,12 L48,0 L54,12 L60,0 L66,12 L72,0 L78,12 L84,0 L90,12 L96,0 L102,12 L108,0 L114,12 L120,0 L126,12 L132,0 L138,12 L144,0 L150,12 L156,0 L162,12 L168,0 L174,12 L180,0 L186,12 L192,0 L198,12 L204,0 L210,12 L216,0 L222,12 L228,0 L234,12 L240,0 Z" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
