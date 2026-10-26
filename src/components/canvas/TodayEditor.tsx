"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import { compressImage } from "@/lib/image";
import { Calendar, Send, Tag, Layers, Clock, Image as ImageIcon, X, Hourglass, Palette, CornerDownLeft, Link2, Check, Plus, GitMerge, Sparkles, Loader2, Undo2, Award, Zap, Sprout, ArrowLeftRight, FileUp, Lightbulb, ChevronUp, PenTool } from "lucide-react";
import { MemoryType, MemoryLevel, getLocalizedTitle, getMemoryTypeBadgeStyle, MORANDI_PIGMENTS, MemoryStarImpact, CanonicalMemory } from "@/types/memory";
import { playKeyClick, playWaxStampSound } from "@/lib/sound";
import confetti from "canvas-confetti";
import { SmartDocumentIngestModal } from "./SmartDocumentIngestModal";

interface TodayEditorProps {
  initialPrompt?: string;
}

export function TodayEditor({ initialPrompt }: TodayEditorProps) {
  const {
    addMemory,
    appendToMemory,
    t,
    language,
    selectedDate,
    setSelectedDate,
    memories,
    addRelationship,
    availableTypes,
    addCustomType,
    getTypeColor,
    updateTypeColor,
    settings,
  } = useMemory();
  const [activeTab, setActiveTab] = useState<"zh" | "en">(language);
  const [editorMode, setEditorMode] = useState<"create" | "append">("create");
  const [targetMemoryId, setTargetMemoryId] = useState<string>("");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const [titleZh, setTitleZh] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [contentEn, setContentEn] = useState("");

  const [type, setType] = useState<MemoryType>("idea");
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [tags, setTags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [echoWeaved, setEchoWeaved] = useState(false);

  // AI Polish states
  const [isPolishing, setIsPolishing] = useState(false);
  const [extractedStar, setExtractedStar] = useState<MemoryStarImpact | null>(null);
  const [originalBackup, setOriginalBackup] = useState<{ title: string; content: string } | null>(null);
  const [isDocIngestOpen, setIsDocIngestOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (initialPrompt) setIsExpanded(true);
  }, [initialPrompt]);

  // Today reference date for backfill detection (deferred to useEffect for Next.js 16 SSR safety)
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setTodayStr(`${year}-${month}-${day}`);
  }, []);

  const isBackfilling = Boolean(todayStr && selectedDate && selectedDate !== todayStr);

  // Natural Cognitive Fast-Track / Direct Injection (WorkBuddy pattern)
  // e.g. "记住：我偏好...", "偏好：...", "原则：...", "心智：...", "remember: ..."
  const cognitiveInjection = useMemo(() => {
    const rawText = (activeTab === "zh" ? (contentZh || titleZh) : (contentEn || titleEn)).trim();
    if (!rawText) return null;

    // L4: Core Beliefs & First Principles (原则/信条/底层信念/principle/belief)
    if (/^(原则|底层信念|核心信条|信念|principle|belief)[:：]/i.test(rawText)) {
      return {
        level: "L4" as MemoryLevel,
        dimensionZh: "底层信念",
        dimensionEn: "Core Beliefs",
        badgeColor: "#7C6F93",
        cleanText: rawText.replace(/^(原则|底层信念|核心信条|信念|principle|belief)[:：]\s*/i, ""),
        autoTopic: language === "zh" ? "核心信念" : "belief",
      };
    }

    // L3: Mental Models & Thinking Style (心智/思维模型/认知人设/mental/persona)
    if (/^(心智|思维模型|认知模式|人设|mental|persona)[:：]/i.test(rawText)) {
      return {
        level: "L3" as MemoryLevel,
        dimensionZh: "心智模型",
        dimensionEn: "Mental Models",
        badgeColor: "#52575E",
        cleanText: rawText.replace(/^(心智|思维模型|认知模式|人设|mental|persona)[:：]\s*/i, ""),
        autoTopic: language === "zh" ? "心智模型" : "mental_model",
      };
    }

    // L2: Habits & Skills (WorkBuddy "记住：", "偏好：", "SOP：", "remember:", "pref:")
    if (/^(记住|偏好|习惯|SOP|技能|方法论|remember|pref|preference)[:：]/i.test(rawText)) {
      return {
        level: "L2" as MemoryLevel,
        dimensionZh: "习惯与技能",
        dimensionEn: "Habits & Skills",
        badgeColor: "#5B7B94",
        cleanText: rawText.replace(/^(记住|偏好|习惯|SOP|技能|方法论|remember|pref|preference)[:：]\s*/i, ""),
        autoTopic: language === "zh" ? "习惯技能" : "habit",
      };
    }

    return null;
  }, [activeTab, contentZh, titleZh, contentEn, titleEn, language]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If initialPrompt changes, insert into editor
  useEffect(() => {
    if (!initialPrompt) return;
    if (language === "zh") {
      setTitleZh((prev) => (prev ? prev : initialPrompt.replace(/^“|”$/g, "")));
    } else {
      setTitleEn((prev) => (prev ? prev : initialPrompt.replace(/^“|”$/g, "")));
    }
  }, [initialPrompt, language]);

  // Sync tab with global language on mount or language toggle
  React.useEffect(() => {
    setActiveTab(language);
  }, [language]);

  // Customizable Time state (defaults to current time in useEffect)
  const [customTime, setCustomTime] = useState<string>("12:00");
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  React.useEffect(() => {
    const d = new Date();
    setCustomTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }, []);

  // Serendipity Memory Echo: find a memory older than 7 days (computed in useEffect to satisfy Next.js prerender rules)
  const [pastMemoryEcho, setPastMemoryEcho] = useState<CanonicalMemory | null>(null);

  useEffect(() => {
    const nowTime = Date.now();
    const older = memories.filter((m) => {
      if (!m.occurred_at) return false;
      const diffDays = (nowTime - new Date(m.occurred_at).getTime()) / (1000 * 3600 * 24);
      return diffDays >= 7;
    });
    setPastMemoryEcho(older.length > 0 ? older[Math.floor(Math.random() * older.length)] : null);
  }, [memories]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const compressed = await compressImage(file);
      setMediaUrl(compressed);
    } catch {
      console.error("Failed to process image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Support pasting image directly from clipboard into the editor
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            setIsUploading(true);
            const compressed = await compressImage(file);
            setMediaUrl(compressed);
          } catch {
            console.error("Failed to process pasted image");
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    }
  };

  const handleConfirmNewType = () => {
    const clean = newTypeInput.trim();
    if (clean) {
      addCustomType(clean);
      setType(clean);
      setIsAddingCustomType(false);
      setNewTypeInput("");
    }
  };

  // Fuzzy candidate detection for evolving existing memories
  const matchedMemory = useMemo(() => {
    if (editorMode === "append") return null;
    const query = (titleZh || titleEn || contentZh || contentEn).trim().toLowerCase();
    if (query.length < 2) return null;
    return memories.find((m) => {
      const mTitle = (m.title + " " + (m.title_zh || "") + " " + (m.title_en || "")).toLowerCase();
      if (mTitle.length >= 2 && (query.includes(mTitle) || mTitle.includes(query))) return true;
      if (m.topics.some((t) => t.length > 1 && query.includes(t.toLowerCase()))) return true;
      const words = query.split(/[\s,，、。！？\n\t]+/);
      return words.some((w) => w.length >= 2 && mTitle.includes(w));
    });
  }, [titleZh, titleEn, contentZh, contentEn, memories, editorMode]);

  const selectedTargetMem = useMemo(() => {
    if (!targetMemoryId) return null;
    return memories.find((m) => m.id === targetMemoryId) || null;
  }, [targetMemoryId, memories]);

  // AI Polish & STAR Extraction
  const handlePolish = async () => {
    const currentText = (activeTab === "zh" ? contentZh : contentEn).trim();
    const currentTitle = (activeTab === "zh" ? titleZh : titleEn).trim();
    if (!currentText && !currentTitle) {
      alert(language === "zh" ? "请先在内容框中写下你的随手记（例如：搞定企业微信api连接，封装成mcp...）" : "Please type your rough notes first.");
      return;
    }

    try {
      setIsPolishing(true);
      playKeyClick();
      setOriginalBackup({
        title: currentTitle,
        content: currentText,
      });

      const res = await fetch("/api/memory/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentText,
          title: currentTitle,
          language,
          provider: settings?.ai?.provider || "gemini",
          apiKey: settings?.ai?.apiKey || "",
          baseUrl: settings?.ai?.baseUrl || "",
          model: settings?.ai?.model || "",
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (activeTab === "zh") {
          setTitleZh(data.polished_title);
          setContentZh(data.polished_statement);
        } else {
          setTitleEn(data.polished_title);
          setContentEn(data.polished_statement);
        }
        setType("achievement");
        if (data.topics && data.topics.length > 0) {
          setTags(data.topics.join(", "));
        }
        setExtractedStar(data.star);
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error("Polish failed:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleUndoPolish = () => {
    if (!originalBackup) return;
    playKeyClick();
    if (activeTab === "zh") {
      setTitleZh(originalBackup.title);
      setContentZh(originalBackup.content);
    } else {
      setTitleEn(originalBackup.title);
      setContentEn(originalBackup.content);
    }
    setOriginalBackup(null);
    setExtractedStar(null);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasAnyContent = Boolean(titleZh.trim() || contentZh.trim() || titleEn.trim() || contentEn.trim() || mediaUrl);
    if (!hasAnyContent) return;

    const topicsArray = tags
      .split(/[,， ]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Merge custom date and custom time
    const timeToUse = customTime || "12:00";
    const formattedOccurredAt = `${selectedDate}T${timeToUse}:00+08:00`;

    // Mode B: Append & Evolve existing memory
    if (editorMode === "append" && targetMemoryId) {
      const updateNote = (language === "zh"
        ? (contentZh.trim() || titleZh.trim() || contentEn.trim())
        : (contentEn.trim() || titleEn.trim() || contentZh.trim())) || "";

      appendToMemory(targetMemoryId, {
        note: updateNote,
        occurred_at: formattedOccurredAt,
        media_url: mediaUrl || undefined,
        topics: topicsArray,
      });

      setTitleZh("");
      setContentZh("");
      setTitleEn("");
      setContentEn("");
      setTags("");
      setMediaUrl("");
      setExtractedStar(null);
      setOriginalBackup(null);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
      return;
    }

    // Mode A: Create fresh standalone memory
    const defaultTitle = language === "zh" ? "今日碎片" : "Today's Fragment";
    const currentTitle = language === "zh"
      ? (titleZh.trim() || titleEn.trim() || contentZh.trim().slice(0, 36) || defaultTitle)
      : (titleEn.trim() || titleZh.trim() || contentEn.trim().slice(0, 36) || defaultTitle);

    const effectiveTopics = [...topicsArray];
    if (cognitiveInjection?.autoTopic && !effectiveTopics.includes(cognitiveInjection.autoTopic)) {
      effectiveTopics.push(cognitiveInjection.autoTopic);
    }

    const initialRelations = echoWeaved && pastMemoryEcho ? [pastMemoryEcho.id] : [];

    const createdMemory = addMemory({
      title: currentTitle,
      title_zh: titleZh.trim() || (language === "zh" ? currentTitle : undefined),
      title_en: titleEn.trim() || (language === "en" ? currentTitle : undefined),
      content: (language === "zh" ? (contentZh.trim() || contentEn.trim()) : (contentEn.trim() || contentZh.trim())) || "",
      content_zh: contentZh.trim() || (language === "zh" ? (contentZh.trim() || contentEn.trim()) : undefined),
      content_en: contentEn.trim() || (language === "en" ? (contentEn.trim() || contentZh.trim()) : undefined),
      language,
      type: cognitiveInjection && type === "moment" ? "learning" : type,
      topics: effectiveTopics.length > 0 ? effectiveTopics : ["today"],
      occurred_at: formattedOccurredAt,
      media_url: mediaUrl || undefined,
      color_accent: getTypeColor(type),
      memory_level: cognitiveInjection ? cognitiveInjection.level : undefined,
      star: extractedStar || undefined,
      provenance: cognitiveInjection ? { capture_method: "quick_add", ai_generated: false } : undefined,
      relations: initialRelations,
    });

    if (echoWeaved && pastMemoryEcho && createdMemory) {
      addRelationship({
        from_memory_id: pastMemoryEcho.id,
        to_memory_id: createdMemory.id,
        type: "semantic_similarity",
        origin: "manual",
        reason: language === "zh" ? "时空因果连线" : "Temporal Serendipity Echo",
        status: "confirmed",
      });
    }

    setEchoWeaved(false);
    setTitleZh("");
    setContentZh("");
    setTitleEn("");
    setContentEn("");
    setTags("");
    setMediaUrl("");
    setExtractedStar(null);
    setOriginalBackup(null);
    setIsSavedFeedback(true);
    setIsExpanded(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const currentTitleValue = activeTab === "zh" ? titleZh : titleEn;
  const currentContentValue = activeTab === "zh" ? contentZh : contentEn;
  const hasDraft = Boolean(titleZh.trim() || titleEn.trim() || contentZh.trim() || contentEn.trim() || mediaUrl);
  const showFullDesk = isExpanded || hasDraft;

  if (!showFullDesk) {
    return (
      <div
        onClick={() => {
          setIsExpanded(true);
          playKeyClick();
        }}
        className="w-full bg-[var(--card-white)] border border-[var(--grid-line)] hover:border-stone-400 p-3.5 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group select-none"
      >
        <div className="flex items-center gap-2.5 text-stone-500 group-hover:text-stone-800 transition-colors">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C05A46] inline-block shadow-2xs" />
          <span className="text-xs sm:text-sm font-medium">
            {language === "zh"
              ? "随手记下此刻的想法、灵感或生活碎片... (点击开始记录)"
              : "What's on your mind? Jot down a quick thought, link, or moment..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400 font-mono-meta hidden sm:inline">
            {language === "zh" ? "流式即时记录" : "Living Stream"}
          </span>
          <kbd className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-sans font-medium">
            ↵
          </kbd>
        </div>
      </div>
    );
  }

  return (
    <div
      onPaste={handlePaste}
      className="bg-[var(--card-white)] text-[var(--ink-primary)] h-full p-4 md:p-6 relative flex flex-col justify-between transition-all select-none rounded-xl border border-[var(--grid-line)] shadow-xs animate-fade-in"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header bar: Title + Collapse + Date Selector + Time Selector */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-stone-200/80 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C05A46] inline-block shadow-2xs" />
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink-primary)]">
            {t.today_card_title}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!hasDraft || window.confirm(language === "zh" ? "收起记录台？已输入的内容将继续保留为草稿。" : "Collapse editor? Your draft is preserved.")) {
                setIsExpanded(false);
              }
            }}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer text-[11px] flex items-center gap-0.5 ml-1"
            title={language === "zh" ? "收起记录台 (专注浏览画卷)" : "Collapse editor"}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === "zh" ? "收起" : "Fold"}</span>
          </button>
        </div>

        {/* Date & Time Input Controls */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* 1. Date selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg text-[var(--ink-primary)]">
            <Calendar className="w-3 h-3 text-[var(--ink-secondary)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none cursor-pointer"
            />
          </div>

          {/* 2. Custom Time selector */}
          <div
            className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg text-[var(--ink-primary)]"
            title={language === "zh" ? "自定义发生时间" : "Custom Occurred Time"}
          >
            <Clock className="w-3 h-3 text-[#5B7B94]" />
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="bg-transparent text-xs text-[var(--ink-primary)] focus:outline-none cursor-pointer w-16"
            />
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setCustomTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
              }}
              className="text-[10px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline ml-0.5"
              title={language === "zh" ? "重置为当前时间" : "Reset to current time"}
            >
              now
            </button>
          </div>
        </div>
      </div>

      {/* Backfill Alert Banner (Option A: Clear Past Date Feedback) */}
      {isBackfilling && (
        <div className="mb-3 p-2.5 px-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              {language === "zh"
                ? `正在补记 ${selectedDate} 的回忆碎片（将自动同步至当日生活存根）`
                : `Backfilling note for ${selectedDate} (auto-syncs to that day's stub)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0 ml-2"
          >
            {language === "zh" ? "一键切回今天" : "Back to Today"}
          </button>
        </div>
      )}

      {/* Top Header: Freeform Status & Subtle Language Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[var(--ink-secondary)] font-mono-meta flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{language === "zh" ? "流式即时记录 · AI 自动感知提炼" : "Freeform stream · AI auto-perceives"}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsDocIngestOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-md text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
            title={language === "zh" ? "支持飞书、Google Doc、Word (.docx)、Markdown 或长篇笔记，AI 自动切片为记忆卡片" : "Ingest from Feishu, Google Doc, Word, Markdown or long notes"}
          >
            <FileUp className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === "zh" ? "萃取长笔记/文档" : "Ingest Doc/Notes"}</span>
          </button>
        </div>

        {/* Subtle Language Pill */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "zh" ? "en" : "zh")}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 hover:bg-stone-200/70 rounded-md text-[11px] font-mono-meta text-stone-600 border border-stone-200/60 cursor-pointer transition-colors shadow-2xs"
          title={language === "zh" ? "切换中英文记录草稿" : "Toggle drafting language"}
        >
          <span className="font-semibold text-stone-800">{activeTab.toUpperCase()}</span>
          <ArrowLeftRight className="w-2.5 h-2.5 text-stone-400" />
          <span className="text-stone-500 text-[10px]">{activeTab === "zh" ? "EN" : "ZH"}</span>
          {(activeTab === "zh" ? (titleEn || contentEn) : (titleZh || contentZh)) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
          )}
        </button>
      </div>

      {/* Autonomous AI Evolution Banner (AI 智能语义感知与演进归并) */}
      {matchedMemory && (
        <div className="mb-2.5 bg-emerald-50/95 border border-emerald-300/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-emerald-900 truncate">
                {language === "zh" ? "AI 识别到与已有记忆相关：" : "AI matched existing memory: "}
                「{getLocalizedTitle(matchedMemory, language)}」
              </span>
              <span className="text-[10px] text-emerald-700/80 flex items-center gap-1">
                {language === "zh" ? (
                  targetMemoryId === matchedMemory.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 inline" />
                      <span>保存时将作为演进日志沉淀入库（累计第 {(matchedMemory.timeline_logs?.length || 1) + 1} 次演进）</span>
                    </>
                  ) : (
                    <span>点击右侧按钮可直接归并演进，或保持作为独立记忆</span>
                  )
                ) : (
                  <span>Will append as an evolution log to this memory</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {targetMemoryId === matchedMemory.id ? (
              <button
                type="button"
                onClick={() => setTargetMemoryId("")}
                className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded text-[11px] font-medium cursor-pointer transition-colors"
                title={language === "zh" ? "取消归并，作为独立新记忆保存" : "Save as independent new memory"}
              >
                {language === "zh" ? "分化为新记忆" : "Keep Independent"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTargetMemoryId(matchedMemory.id)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>⇄</span>
                <span>{language === "zh" ? "自动演进归并" : "Auto-Merge"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Main Surface */}
      <div className="flex-1 flex flex-col gap-2.5">
        <input
          type="text"
          value={currentTitleValue}
          onChange={(e) => {
            playKeyClick();
            if (activeTab === "zh") setTitleZh(e.target.value);
            else setTitleEn(e.target.value);
          }}
          placeholder={
            editorMode === "append"
              ? (language === "zh" ? "（选填）今日进展小结标题..." : "(Optional) Today's progress title...")
              : activeTab === "zh"
              ? (language === "zh" ? "简短标题（选填）..." : "Title (optional)...")
              : (language === "zh" ? "简短标题（选填）..." : "Title (optional)...")
          }
          className="w-full text-sm font-semibold border-b border-dashed border-[var(--border-subtle)] pb-1.5 focus:outline-none focus:border-[var(--grid-line)] bg-transparent text-[var(--ink-primary)] transition-colors"
        />

        {/* Integrated Textarea Container with Proximity AI Polish Button */}
        <div className="rounded-lg border border-stone-200/90 bg-stone-50/80 focus-within:border-stone-400 focus-within:bg-white transition-all shadow-2xs overflow-hidden">
          <textarea
            value={currentContentValue}
            onChange={(e) => {
              playKeyClick();
              if (activeTab === "zh") setContentZh(e.target.value);
              else setContentEn(e.target.value);
            }}
            placeholder={
              editorMode === "append"
                ? (language === "zh"
                    ? "记录今天针对此条目的新进展..."
                    : "Record today's new progress on this entry...")
                : (language === "zh"
                    ? "随手记下此刻的想法、灵感或生活碎片..."
                    : "What's on your mind? Jot down a quick thought, link, or moment...")
            }
            rows={3}
            className="w-full resize-none text-sm leading-relaxed p-3 pb-2 bg-transparent focus:outline-none text-[var(--ink-primary)] font-sans border-none"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                handleSave();
              }
            }}
          />

          {/* Intimate Action Bar: Placed directly at the bottom of the text area */}
          <div className="flex flex-col border-t border-stone-200/50 bg-stone-100/50 text-xs">
            {cognitiveInjection && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50/90 border-b border-sky-200/70 text-sky-900 text-[11px] animate-fade-in font-sans">
                <div className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-sky-600 animate-pulse shrink-0" />
                  <span>
                    {language === "zh"
                      ? `完整保存至今日日志 (Obsidian 层)，并已同步提取为「${cognitiveInjection.dimensionZh}」`
                      : `Saved to Today's Journal (Obsidian Layer) & extracted as 「${cognitiveInjection.dimensionEn}」`}
                  </span>
                </div>
                <span className="text-[10px] text-sky-700 font-mono shrink-0 ml-2">
                  {language === "zh" ? "底层归档 · 智能提取" : "Vault First · Extracted"}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[11px] text-stone-400 font-sans flex items-center gap-1">
                {currentContentValue.length > 0 ? (
                  `${currentContentValue.length} ${language === "zh" ? "字" : "chars"}`
                ) : (
                  <>
                    <Lightbulb className="w-3 h-3 text-stone-400 inline" />
                    <span>{language === "zh" ? "写下口语碎片，随时一键润色" : "Type rough notes, polish anytime"}</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={handlePolish}
                disabled={isPolishing}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm active:scale-98 disabled:opacity-50"
                title={language === "zh" ? "把当前写的大白话随笔一键润色为标准述职句式并抽取 STAR" : "Polish into professional work accomplishment and extract STAR"}
              >
                {isPolishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    <span>{language === "zh" ? "AI 润色提炼中..." : "Polishing..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span className="font-bold">{language === "zh" ? "AI 述职润色 (Polish)" : "AI Polish"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Memory Attachment Preview (Cosmos / Are.na style) */}
        {mediaUrl && (
          <div className="relative inline-flex items-center gap-2.5 border border-stone-200 p-1.5 rounded-lg bg-stone-50/80 self-start max-w-full">
            <img
              src={mediaUrl}
              alt="attachment preview"
              className="h-16 w-auto max-w-[140px] object-cover rounded border border-stone-200"
            />
            <div className="flex flex-col pr-1">
              <span className="text-[11px] font-medium text-[var(--ink-primary)]">
                {language === "zh" ? "拍立得相纸已就绪" : "Polaroid photo attached"}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">
                Scrapbook photo
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMediaUrl("")}
              className="p-1 rounded-md bg-white border border-stone-200 text-stone-500 hover:text-[#D9483B] hover:bg-red-50 transition-colors"
              title={language === "zh" ? "移除图片" : "Remove image"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Polish Result & STAR Breakdown Card */}
        {extractedStar && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 text-xs text-amber-950 flex flex-col gap-2 shadow-2xs animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === "zh" ? "AI 述职润色完成 · STAR 结构已自动提炼入库" : "STAR Structure Extracted by AI"}</span>
              </div>

              {originalBackup && (
                <button
                  type="button"
                  onClick={handleUndoPolish}
                  className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 underline cursor-pointer"
                  title={language === "zh" ? "恢复您原本输入的口语随笔" : "Revert to your original rough notes"}
                >
                  <Undo2 className="w-3 h-3" />
                  <span>{language === "zh" ? "恢复原始随笔" : "Undo Polish"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
              <div className="bg-white/90 p-2 rounded border border-amber-200/60 shadow-2xs">
                <span className="font-bold text-amber-900 block mb-0.5">
                  {language === "zh" ? "S · 挑战与痛点" : "S · Challenge & Context"}
                </span>
                <p className="text-stone-700 leading-normal">{extractedStar.situation}</p>
              </div>
              <div className="bg-white/90 p-2 rounded border border-amber-200/60 shadow-2xs">
                <span className="font-bold text-amber-900 block mb-0.5">
                  {language === "zh" ? "A · 核心攻坚行动" : "A · Core Action Taken"}
                </span>
                <p className="text-stone-700 leading-normal">{extractedStar.action}</p>
              </div>
              <div className="bg-white/90 p-2 rounded border border-amber-200/60 shadow-2xs">
                <span className="font-bold text-emerald-900 block mb-0.5">
                  {language === "zh" ? "R · 交付收益与影响" : "R · Impact & Results"}
                </span>
                <p className="text-emerald-950 leading-normal">{extractedStar.result}</p>
              </div>
            </div>
          </div>
        )}

        {/* Serendipity Memory Echo Bar (时空回响条) */}
        {pastMemoryEcho && (
          <div className="bg-[#FDF9F0] border border-[#EEDFCA] border-l-4 border-l-[#C49A56] rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Hourglass className="w-3.5 h-3.5 text-[#C49A56] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#C97A63] uppercase tracking-wide mr-1.5">
                  {language === "zh" ? "时空记忆回响" : "MEMORY ECHO"}
                </span>
                <span className="text-stone-700 truncate font-medium">
                  {language === "zh" ? "伏笔：" : "Origin: "}
                  《{getLocalizedTitle(pastMemoryEcho, language)}》
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (echoWeaved) {
                  playKeyClick();
                  setEchoWeaved(false);
                } else {
                  playWaxStampSound();
                  setEchoWeaved(true);
                }
              }}
              className={`text-[11px] px-2.5 py-1 rounded-md border transition-all shrink-0 font-medium cursor-pointer shadow-2xs flex items-center gap-1.5 group ${
                echoWeaved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                  : "bg-white text-stone-800 border-[#C49A56]/60 hover:bg-[#FAF4EF]"
              }`}
              title={
                echoWeaved
                  ? (language === "zh" ? "已连接！点击可随时取消连线" : "Weaved! Click to undo / cancel link")
                  : (language === "zh" ? "点击与伏笔记忆编织因果连线" : "Weave connection with past memory")
              }
            >
              {echoWeaved ? (
                <>
                  <span className="flex items-center gap-1 group-hover:hidden">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "zh" ? "已编织星轨连线" : "Weaved Link"}</span>
                  </span>
                  <span className="hidden group-hover:flex items-center gap-1 text-rose-600 font-semibold">
                    <X className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "取消连线" : "Cancel Link"}</span>
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-[#C49A56]" />
                  <span>{language === "zh" ? "编织因果连线" : "Weave Echo"}</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Metadata Controls: Type selection, Mood Pigments, image upload & tags */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--ink-secondary)] flex items-center gap-1 text-xs font-medium">
              <Layers className="w-3 h-3" /> Type:
            </span>
            {availableTypes.map((tType) => {
              const isSelected = type === tType;
              const tColor = getTypeColor(tType);
              const label = t[`memory_type_${tType}` as keyof typeof t] || tType;
              return (
                <button
                  key={tType}
                  type="button"
                  onClick={() => {
                    playKeyClick();
                    setType(tType);
                  }}
                  style={
                    isSelected
                      ? { backgroundColor: tColor, color: "#FFFFFF", borderColor: tColor }
                      : { borderLeftColor: tColor, borderLeftWidth: "3px" }
                  }
                  className={`px-2 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer border ${
                    isSelected
                      ? "shadow-xs"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}

            {/* Custom Type Inline Input / Button */}
            {isAddingCustomType ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmNewType();
                    } else if (e.key === "Escape") {
                      setIsAddingCustomType(false);
                      setNewTypeInput("");
                    }
                  }}
                  placeholder={language === "zh" ? "输入新类型..." : "New type..."}
                  className="px-2 py-0.5 text-xs border border-stone-300 rounded-lg bg-white w-24 text-[var(--ink-primary)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmNewType}
                  className="p-1 rounded-lg bg-[#5B7B94] text-white hover:bg-[#486377] cursor-pointer"
                  title={language === "zh" ? "确认添加类型" : "Confirm type"}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomType(false);
                    setNewTypeInput("");
                  }}
                  className="p-1 rounded-lg bg-stone-200 text-stone-600 hover:bg-stone-300 cursor-pointer"
                  title={language === "zh" ? "取消" : "Cancel"}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCustomType(true)}
                className="px-2 py-0.5 text-xs font-medium rounded-lg border border-dashed border-stone-300 text-stone-500 hover:text-stone-800 hover:border-stone-400 bg-transparent flex items-center gap-0.5 transition-colors cursor-pointer"
                title={language === "zh" ? "新增自定义类型" : "Add custom type"}
              >
                <Plus className="w-3 h-3" />
                <span>{language === "zh" ? "新增类型" : "New Type"}</span>
              </button>
            )}

            {/* Image Upload Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-2 py-0.5 text-xs font-medium rounded-lg transition-all border flex items-center gap-1.5 ${
                mediaUrl
                  ? "bg-[#5B7B94] text-white border-transparent"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
              title={language === "zh" ? "可上传或直接粘贴图片" : "Attach image or paste directly"}
            >
              <ImageIcon className="w-3 h-3" />
              <span>
                {isUploading
                  ? "..."
                  : mediaUrl
                  ? (language === "zh" ? "已附图" : "Attached")
                  : (language === "zh" ? "贴图" : "Photo")}
              </span>
            </button>
          </div>

          {/* Right: Synced Type Color Picker & Tags */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Type Color Palette & Global Sync */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white text-xs font-medium cursor-pointer shadow-2xs transition-all"
                title={language === "zh" ? "修改该类型全局绑定的专属颜色" : "Change synced color for this type"}
              >
                <Palette className="w-3 h-3 text-stone-500" />
                <span
                  className="w-3 h-3 rounded-full border border-black/15 inline-block shadow-2xs"
                  style={{ backgroundColor: getTypeColor(type) }}
                />
                <span className="text-[11px] text-stone-600 font-mono-meta">
                  {language === "zh" ? "类型色彩" : "Type Color"}
                </span>
              </button>

              {isColorPickerOpen && (
                <>
                  {/* Backdrop to close color picker on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsColorPickerOpen(false)}
                  />
                  <div className="absolute left-0 bottom-full mb-2 p-2.5 bg-white border border-stone-300 rounded-xl shadow-xl z-50 flex flex-col gap-2 w-60 max-w-[calc(100vw-3rem)] select-none">
                    <div className="flex items-center justify-between text-[11px] font-mono-meta font-bold text-stone-700 pb-1 border-b border-stone-100">
                      <span>
                        {language === "zh"
                          ? `设定「${t[`memory_type_${type}` as keyof typeof t] || type}」色彩:`
                          : `Color for ${type}:`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsColorPickerOpen(false)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-stone-50 rounded-lg">
                      {MORANDI_PIGMENTS.map((pigment) => {
                        const isSelected = getTypeColor(type).toLowerCase() === pigment.hex.toLowerCase();
                        return (
                          <button
                            key={pigment.hex}
                            type="button"
                            onClick={() => {
                              updateTypeColor(type, pigment.hex);
                              setIsColorPickerOpen(false);
                            }}
                            style={{ backgroundColor: pigment.hex }}
                            className={`w-7 h-7 rounded-full border border-black/10 transition-transform cursor-pointer flex items-center justify-center ${
                              isSelected ? "ring-2 ring-stone-800 scale-110 shadow-xs" : "hover:scale-105"
                            }`}
                            title={language === "zh" ? pigment.nameZh : pigment.nameEn}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-stone-400 font-sans leading-tight">
                      {language === "zh"
                        ? "* 修改后全局实时同步该类型所有卡片色彩"
                        : "* Updates all cards of this type globally"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[var(--ink-secondary)]" />
              <input
                type="text"
                value={tags}
                onChange={(e) => {
                  playKeyClick();
                  setTags(e.target.value);
                }}
                placeholder={language === "zh" ? "标签，如 艺术, 哲学" : "topics, e.g. art"}
                className="text-xs px-2 py-0.5 rounded-lg border border-stone-200 bg-stone-50/80 text-[var(--ink-primary)] focus:outline-none focus:border-stone-400 w-32 font-sans transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-200/80">
        <span className="text-xs text-[var(--ink-secondary)] flex items-center gap-1.5 font-sans">
          <kbd className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200 font-sans font-medium">⌘ + Enter</kbd>
          <span>{language === "zh" ? "快捷保存或粘贴图片" : "Save or paste image"}</span>
        </span>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={!titleZh.trim() && !contentZh.trim() && !titleEn.trim() && !contentEn.trim() && !mediaUrl}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer ${
            isSavedFeedback
              ? "bg-[#5B7B94] text-white"
              : !titleZh.trim() && !contentZh.trim() && !titleEn.trim() && !contentEn.trim() && !mediaUrl
              ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200 shadow-none"
              : "bg-[#C05A46] text-white hover:bg-[#A94734]"
          }`}
        >
          <Send className="w-3 h-3" />
          <span>{isSavedFeedback ? t.saved : t.save}</span>
        </button>
      </div>
      <SmartDocumentIngestModal
        isOpen={isDocIngestOpen}
        onClose={() => setIsDocIngestOpen(false)}
      />
    </div>
  );
}
