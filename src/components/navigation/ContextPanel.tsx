"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  Clock,
  Receipt,
  Trash2,
  Award,
  Sprout,
  BookOpen,
  Smile,
  PenTool,
  Check,
  PanelRightClose,
} from "lucide-react";
import confetti from "canvas-confetti";
import { getLocalizedTitle, getLocalizedContent, formatDisplayTime } from "@/types/memory";
import { MemoryActivityHeatmap } from "@/components/canvas/MemoryActivityHeatmap";
import { MOOD_PRESETS, resolveMood } from "@/lib/moods";


interface ContextPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenReceipt: () => void;
  onOpenWeeklyDigest?: () => void;
  onOpenCareerStudio?: () => void;
  onOpenConstellation: () => void;
  onOpenArchive: () => void;
  onOpenGitHubSettings?: () => void;
}

export function ContextPanel({
  onClose,
  onOpenReceipt,
  onOpenWeeklyDigest,
  onOpenCareerStudio,
  onOpenConstellation,
  onOpenArchive,
  onOpenGitHubSettings,
}: ContextPanelProps) {
  const {
    memories,
    selectedDate,
    setSelectedDate,
    setSelectedMemoryId,
    setViewMode,
    language,
    t,
    settings,
    appMode,
    deleteMemory,
    getTypeColor,
    getDailyReceipt,
    saveDailyReceipt,
    storedReceipts,
  } = useMemory();

  // Local reflection text synced with selectedDate
  const defaultMood = language === "zh" ? "陶土红 · 热情" : "Terracotta · Energized";
  const currentMood =
    (language === "en" ? storedReceipts[selectedDate]?.mood_en : (storedReceipts[selectedDate]?.mood_zh || storedReceipts[selectedDate]?.mood)) ||
    storedReceipts[selectedDate]?.mood ||
    defaultMood;
  const currentReflection =
    (language === "en"
      ? storedReceipts[selectedDate]?.custom_reflection_en || storedReceipts[selectedDate]?.custom_reflection
      : storedReceipts[selectedDate]?.custom_reflection_zh || storedReceipts[selectedDate]?.custom_reflection) ||
    "";

  const [reflectionText, setReflectionText] = useState(currentReflection);
  const [syncedTip, setSyncedTip] = useState(false);

  useEffect(() => {
    const text =
      (language === "en"
        ? storedReceipts[selectedDate]?.custom_reflection_en || storedReceipts[selectedDate]?.custom_reflection
        : storedReceipts[selectedDate]?.custom_reflection_zh || storedReceipts[selectedDate]?.custom_reflection) ||
      "";
    setReflectionText(text);
  }, [selectedDate, storedReceipts, language]);

  const handleReflectionChange = (val: string) => {
    setReflectionText(val);
    const receipt = getDailyReceipt(selectedDate);
    saveDailyReceipt({
      ...receipt,
      custom_reflection: val,
      ...(language === "en" ? { custom_reflection_en: val } : { custom_reflection_zh: val }),
      mood: currentMood,
    });
    setSyncedTip(true);
    setTimeout(() => setSyncedTip(false), 2000);
  };

  const handleMoodSelect = (moodStr: string) => {
    const receipt = getDailyReceipt(selectedDate);
    saveDailyReceipt({
      ...receipt,
      custom_reflection: reflectionText,
      ...(language === "en" ? { custom_reflection_en: reflectionText } : { custom_reflection_zh: reflectionText }),
      mood: moodStr,
    });
    setSyncedTip(true);
    setTimeout(() => setSyncedTip(false), 2000);
  };

  // Get memories of the selected day (newest recorded first so latest additions appear at the top)
  const todayMemories = memories
    .filter((m) => m.occurred_at.startsWith(selectedDate))
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  const handleCelebrate = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#C97A63", "#5B7B94", "#C49A56", "#608066", "#7C6F93"],
    });
  };

  return (
    <aside className="w-full lg:w-80 border-l border-[var(--grid-line)] bg-[var(--panel-bg)] p-4 flex flex-col gap-4 overflow-y-auto select-none transition-colors duration-200 shrink-0">
      {/* Panel Masthead */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--grid-line)]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
          <Clock className="w-3.5 h-3.5 text-[#C97A63]" />
          <span>{language === "zh" ? "今日时间轴与存根" : "Timeline & Notes"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono-meta bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
            {todayMemories.length} {language === "zh" ? "条碎片" : "items"}
          </span>
          {todayMemories.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(language === "zh" ? "确定要清空今日的碎片记录吗？" : "Clear today's notes?")) {
                  todayMemories.forEach((m) => deleteMemory(m.id));
                }
              }}
              className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-stone-200/50 transition-colors cursor-pointer"
              title={language === "zh" ? "清空今日记录" : "Clear today's notes"}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer ml-0.5"
              title={language === "zh" ? "折叠伴随面板 (专注画卷)" : "Collapse companion panel"}
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Daily Auto-Saved Souvenir Slip & Reflection Hub */}
      <div className="bg-[var(--card-white)] border border-[var(--grid-line)] shadow-2xs rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono-meta uppercase font-bold text-[var(--ink-secondary)] flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#C97A63]" />
            {language === "zh" ? "今日生活存根" : t.daily_receipt_title}
          </span>
          {appMode === "demo" ? (
            <span
              className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded font-mono-meta font-medium flex items-center gap-1"
              title={language === "zh" ? "演示模式下个人数据不会持久化保存" : "Personal changes are not saved in demo mode"}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {language === "zh" ? "演示预览中 (不保存)" : "Demo (Not Saved)"}
            </span>
          ) : !settings.github.connected ? (
            <span
              className="text-[9px] bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded font-mono-meta font-medium flex items-center gap-1"
              title={language === "zh" ? "未配置 GitHub 仓库，数据仅保留在当前浏览器中" : "GitHub disconnected; notes are cached in this browser only"}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              {language === "zh" ? "仅浏览器缓存" : "Browser Only"}
            </span>
          ) : (
            <span
              className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono-meta font-medium flex items-center gap-1"
              title={language === "zh" ? "已连接 GitHub 私有仓库，实时自动提交存盘" : "Synced directly with your private GitHub repository"}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === "zh" ? "GitHub 实时存盘" : "GitHub Synced"}
            </span>
          )}
        </div>

        {/* Daily Mood Wash Selector on Home Page */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-stone-100">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-[#C97A63]" />
              <span>{language === "zh" ? "今日水彩心情:" : "Mood Wash:"}</span>
            </span>
            <div className="flex items-center gap-1">
              {MOOD_PRESETS.map((m) => {
                const moodStr = language === "zh" ? m.label : m.labelEn;
                const isSelected = currentMood.includes(m.id) || currentMood.includes(m.color) || currentMood === moodStr;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMoodSelect(moodStr)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-stone-900 ring-offset-1 scale-110 shadow-2xs"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: m.color }}
                    title={`${moodStr} - ${language === "zh" ? m.descZh : m.descEn}`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mood Explicit Indicator & Slip Tint Explanation */}
          {(() => {
            const activePreset = resolveMood(currentMood);

            return (
              <div
                className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border transition-all text-stone-700"
                style={{
                  backgroundColor: `${activePreset.color}0D`,
                  borderColor: `${activePreset.color}35`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0 shadow-2xs"
                      style={{ backgroundColor: activePreset.color }}
                    />
                    <span
                      className="text-xs font-bold tracking-tight"
                      style={{ color: activePreset.color }}
                    >
                      {language === "zh" ? activePreset.label : activePreset.labelEn}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono-meta text-stone-400">
                    {language === "zh" ? "• 浸染存根底色" : "• Slip Tint"}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 pl-3.5 leading-snug">
                  {language === "zh" ? activePreset.descZh : activePreset.descEn}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Daily Reflection Input on Home Page */}
        <div className="flex flex-col gap-1 pt-1 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-700 flex items-center gap-1">
              <PenTool className="w-3 h-3 text-[#C97A63]" />
              <span>{language === "zh" ? "今日复盘与结语 (Reflection):" : "Daily Reflection:"}</span>
            </span>
            {syncedTip && (
              <span className="text-[9px] text-emerald-600 font-mono flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                <span>{language === "zh" ? "已同步存根" : "Synced"}</span>
              </span>
            )}
          </div>
          <textarea
            value={reflectionText}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder={
              language === "zh"
                ? "写下今日复盘反思或晚安结语，自动印刻在今日生活存根上..."
                : "Write today's closing reflection or thoughts (auto-printed on stub)..."
            }
            rows={2}
            className="w-full text-xs p-2 bg-[var(--canvas-paper)] border border-stone-200 rounded-lg resize-none font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#C97A63] focus:ring-1 focus:ring-[#C97A63]/30 transition-all leading-relaxed"
          />
        </div>

        <button
          onClick={() => {
            handleCelebrate();
            onOpenReceipt();
          }}
          className="w-full mt-1 px-3 py-1.5 bg-[#C97A63] text-white hover:bg-[#b86b55] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{language === "zh" ? "查阅 / 导出今日生活存根" : "View / Export Life Stub"}</span>
        </button>

        {onOpenWeeklyDigest && (
          <button
            onClick={onOpenWeeklyDigest}
            className="w-full px-3 py-1.5 bg-[#608066]/10 hover:bg-[#608066]/20 text-[#334D38] rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#608066]/30 shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#608066]" />
            <span>{language === "zh" ? "周度复盘与维护" : "Weekly Digest & Maintenance"}</span>
          </button>
        )}

        {onOpenCareerStudio && (
          <button
            onClick={onOpenCareerStudio}
            className="w-full px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200/80 shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-[#A66B4E]" />
            <span>{language === "zh" ? "履历与成果库" : "Work Reports & Resume Studio"}</span>
          </button>
        )}
      </div>

      {/* 2. Today's Stream (Independent Card with dedicated scroll container) */}
      <div className="bg-[var(--card-white)] border border-[var(--grid-line)] shadow-2xs rounded-xl p-3.5 flex flex-col gap-2 flex-1 min-h-[180px] overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-dashed border-[var(--border-subtle)] shrink-0">
          <h4 className="text-xs font-bold uppercase tracking-tight text-[var(--ink-primary)] flex items-center gap-1.5 font-mono-meta">
            <Clock className="w-3 h-3 text-[#C97A63]" />
            {language === "zh" ? "今日时间流" : "Today's Stream"} ({todayMemories.length})
          </h4>
          <span className="text-[10px] font-mono-meta text-[var(--ink-muted)]">{selectedDate}</span>
        </div>

        {/* Dedicated Scroll Container for Today's Notes */}
        <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          {todayMemories.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] italic py-10 text-center font-mono-meta">
              {language === "zh" ? "今天还没有任何碎片，在左侧书写即可自动沉淀" : "No memories recorded yet today"}
            </p>
          ) : (
            todayMemories.map((m) => {
              const timeStr = formatDisplayTime(m.occurred_at);
              const typeColor = getTypeColor(m.type);

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemoryId(m.id)}
                  style={{ borderLeftColor: typeColor, borderLeftWidth: "3px" }}
                  className="p-2.5 border border-[var(--border-subtle)] hover:border-[#5B7B94] bg-[var(--canvas-paper)] hover:bg-white cursor-pointer transition-all rounded-lg group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-meta text-[#C97A63] font-medium bg-[#C97A63]/10 px-1.5 py-0.5 rounded">
                      {timeStr}
                    </span>
                    <div className="flex items-center gap-1">
                      {m.timeline_logs && m.timeline_logs.length > 1 && (
                        <span className="text-[9px] px-1 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200/50 flex items-center gap-0.5">
                          <Sprout className="w-2.5 h-2.5 text-emerald-600 inline" />
                          <span>{m.timeline_logs.length}</span>
                        </span>
                      )}
                      <span
                        style={{ backgroundColor: `${typeColor}18`, color: typeColor, borderColor: `${typeColor}40` }}
                        className="text-[9px] uppercase px-1.5 py-0.5 border font-mono-meta font-medium rounded"
                      >
                        {t[`memory_type_${m.type}` as keyof typeof t] || m.type}
                      </span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-[var(--ink-primary)] group-hover:text-[#5B7B94] mt-1.5 line-clamp-1 leading-snug transition-colors">
                    {getLocalizedTitle(m, language)}
                  </h5>

                  {m.content && (
                    <p className="text-[11px] text-[var(--ink-secondary)] mt-1 line-clamp-2 leading-relaxed font-sans">
                      {getLocalizedContent(m, language)}
                    </p>
                  )}

                  {/* Thumbnail preview on the right sidebar */}
                  {m.media_url && (
                    <div className="mt-2 h-20 w-full overflow-hidden border border-[var(--grid-line)] bg-black/5 rounded-md">
                      <img
                        src={m.media_url}
                        alt={getLocalizedTitle(m, language)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Memory Activity Heatmap (Distinct Independent Module docked at bottom) */}
      <div className="shrink-0">
        <MemoryActivityHeatmap />
      </div>
    </aside>
  );
}
