"use client";

import React, { useState } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  CanonicalMemory,
  MemoryLevel,
  MEMORY_LEVELS_META,
  getMemoryLevel,
  getLocalizedTitle,
  getLocalizedContent,
} from "@/types/memory";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  BookOpen,
  Compass,
  Cpu,
  UserCheck,
  Link2,
} from "lucide-react";
import confetti from "canvas-confetti";

export function MemoryOSView() {
  const {
    memories,
    relationships,
    updateMemory,
    deleteMemory,
    addMemory,
    setSelectedMemoryId,
    setConnectionModalMemoryId,
    language,
    settings,
    setViewMode,
  } = useMemory();

  const [activeLevelFilter, setActiveLevelFilter] = useState<MemoryLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<"zh" | "en">(language);
  const [editForm, setEditForm] = useState<{
    titleZh: string;
    titleEn: string;
    contentZh: string;
    contentEn: string;
    level: MemoryLevel;
    confidence: number;
    topics: string;
  }>({
    titleZh: "",
    titleEn: "",
    contentZh: "",
    contentEn: "",
    level: "L2",
    confidence: 0.8,
    topics: "",
  });

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTab, setNewTab] = useState<"zh" | "en">(language);
  const [newForm, setNewForm] = useState<{
    titleZh: string;
    titleEn: string;
    contentZh: string;
    contentEn: string;
    level: MemoryLevel;
    confidence: number;
    topics: string;
    type: string;
  }>({
    titleZh: "",
    titleEn: "",
    contentZh: "",
    contentEn: "",
    level: "L2",
    confidence: 0.85,
    topics: "you+bot, persona",
    type: "fact",
  });

  const [isSyncingObsidian, setIsSyncingObsidian] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // AI Cognitive Distillation States (Evermind Self-Evolving Loop)
  const [isDistilling, setIsDistilling] = useState(false);
  const [distillCandidates, setDistillCandidates] = useState<any[]>([]);
  const [isDistillModalOpen, setIsDistillModalOpen] = useState(false);
  const [distillProviderInfo, setDistillProviderInfo] = useState<string | null>(null);

  const handleRunAIDistill = async () => {
    setIsDistilling(true);
    const providerName = settings.ai?.provider ? settings.ai.provider.toUpperCase() : "AI";
    setSyncToast(
      language === "zh"
        ? `认知演进引擎 (${providerName}) 正在研读原文日志并进行反思升维...`
        : `Distilling cognitive traits with ${providerName}...`
    );
    try {
      const res = await fetch("/api/memory/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories,
          language,
          provider: settings.ai?.provider || "gemini",
          apiKey: settings.ai?.apiKey || "",
          baseUrl: settings.ai?.baseUrl || "",
          model: settings.ai?.model || "",
        }),
      });
      const data = await res.json();
      if (data.success && data.candidates?.length > 0) {
        setDistillCandidates(data.candidates);
        setDistillProviderInfo(
          data.provider ||
            (language === "zh"
              ? "Dayprint 认知自演进引擎"
              : "Dayprint Cognitive Consolidation Engine")
        );
        setIsDistillModalOpen(true);
        setSyncToast(
          language === "zh"
            ? `成功提炼出 ${data.candidates.length} 条高维认知与习惯特质`
            : `Successfully distilled ${data.candidates.length} cognitive traits`
        );
      } else {
        setSyncToast(
          data.error ||
            (language === "zh"
              ? "暂无可提炼的认知特质，请在今日日记中增加更多日常记录。"
              : "No traits distilled yet. Add more daily entries in Today's Journal.")
        );
      }
    } catch (e: any) {
      setSyncToast(
        language === "zh"
          ? `提炼异常: ${e?.message || e}`
          : `Distillation error: ${e?.message || e}`
      );
    } finally {
      setIsDistilling(false);
      setTimeout(() => setSyncToast(null), 4500);
    }
  };

  const handleAcceptCandidate = (cand: any) => {
    addMemory({
      title: cand.title,
      title_zh: cand.title_zh,
      title_en: cand.title_en,
      content: cand.content,
      content_zh: cand.content_zh,
      content_en: cand.content_en,
      memory_level: cand.level,
      confidence: cand.confidence,
      topics: cand.topics,
      type: cand.type || "fact",
      provenance: { capture_method: "ai_assisted", ai_generated: true },
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#1D45B8", "#DD2E1E", "#F7C928"],
    });

    setDistillCandidates((prev) => prev.filter((c) => c.title !== cand.title));
  };

  const handleDismissCandidate = (title: string) => {
    setDistillCandidates((prev) => prev.filter((c) => c.title !== title));
  };

  // Compute counts per level
  const levelCounts: Record<MemoryLevel, number> = {
    L0: 0,
    L1: 0,
    L2: 0,
    L3: 0,
    L4: 0,
  };

  memories.forEach((m) => {
    const lvl = getMemoryLevel(m);
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    const lvl = getMemoryLevel(m);
    if (activeLevelFilter !== "ALL" && lvl !== activeLevelFilter) {
      return false;
    }
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
      const matchTopic = (m.topics || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTopic) return false;
    }
    return true;
  });

  const handleStartEdit = (m: CanonicalMemory) => {
    setEditTab(language);
    setEditingMemoryId(m.id);
    setEditForm({
      titleZh: m.title_zh || (m.language === "zh" ? m.title : ""),
      titleEn: m.title_en || (m.language === "en" ? m.title : ""),
      contentZh: m.content_zh || (m.language === "zh" ? m.content : ""),
      contentEn: m.content_en || (m.language === "en" ? m.content : ""),
      level: getMemoryLevel(m),
      confidence: m.confidence ?? 0.8,
      topics: (m.topics || []).join(", "),
    });
  };

  const handleSaveEdit = (id: string) => {
    const topicsArr = editForm.topics
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    updateMemory(id, {
      title_zh: editForm.titleZh.trim() || undefined,
      title_en: editForm.titleEn.trim() || undefined,
      content_zh: editForm.contentZh.trim() || undefined,
      content_en: editForm.contentEn.trim() || undefined,
      memory_level: editForm.level,
      confidence: editForm.confidence,
      topics: topicsArr,
    });
    setEditingMemoryId(null);
  };

  const handleCreateNew = () => {
    const chosenTitle = (
      newTab === "zh"
        ? newForm.titleZh || newForm.titleEn
        : newForm.titleEn || newForm.titleZh
    ).trim();

    if (!chosenTitle && !newForm.titleZh.trim() && !newForm.titleEn.trim()) return;

    const topicsArr = newForm.topics
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    addMemory({
      title: chosenTitle || "Untitled Memory",
      title_zh: newForm.titleZh.trim() || undefined,
      title_en: newForm.titleEn.trim() || undefined,
      content: (
        newTab === "zh"
          ? newForm.contentZh || newForm.contentEn
          : newForm.contentEn || newForm.contentZh
      ).trim(),
      content_zh: newForm.contentZh.trim() || undefined,
      content_en: newForm.contentEn.trim() || undefined,
      type: (newForm.type as any) || "fact",
      memory_level: newForm.level,
      confidence: newForm.confidence,
      topics: topicsArr,
      provenance: { capture_method: "manual", ai_generated: false },
    });

    setIsCreatingNew(false);
    setNewForm({
      titleZh: "",
      titleEn: "",
      contentZh: "",
      contentEn: "",
      level: "L2",
      confidence: 0.85,
      topics: "you+bot, persona",
      type: "fact",
    });

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#DD2E1E", "#1D45B8", "#F7C928"],
    });
  };

  const handleSyncObsidian = async () => {
    setIsSyncingObsidian(true);
    setSyncToast(
      language === "zh"
        ? "正在扫描本地 You+ Vault..."
        : "Scanning local Obsidian Vault..."
    );
    try {
      const res = await fetch("/api/memory/obsidian-sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncToast(
          language === "zh"
            ? `成功同步 ${data.imported_count} 条特质与记忆`
            : `Successfully synced ${data.imported_count} traits & memories`
        );
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#DD2E1E", "#1D45B8", "#F7C928"],
        });
      } else {
        setSyncToast(
          language === "zh"
            ? `同步失败: ${data.error}`
            : `Sync failed: ${data.error}`
        );
      }
    } catch (e: any) {
      setSyncToast(
        language === "zh"
          ? `同步异常: ${e?.message || e}`
          : `Sync error: ${e?.message || e}`
      );
    } finally {
      setIsSyncingObsidian(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[var(--canvas-paper)] overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans transition-colors">
      {/* Top Banner: Architecture & Return Button */}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9483B] inline-block" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
                {language === "zh" ? "记忆中枢与认知谱系" : "Memory OS · Cognitive Ledger"}
              </h1>
              <span className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                {language === "zh" ? "多维认知档案" : "Cognitive Dimensions"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-2xl leading-relaxed">
              {language === "zh"
                ? "严守「日记感知」与「特质沉淀」的分离准则。每日日记回归纯粹时空流，此专区用于白盒查看、校准、晋升与编辑你的全生命周期长期认知特质与信条。"
                : "Dedicated cognitive ledger separating raw daily logs from internalized traits, skills, and values. Inspect and calibrate your evolving persona here."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode("daily")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 shadow-xs transition-colors cursor-pointer"
              title="Return to clean daily journal stream"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#5B7B94]" />
              <span>{language === "zh" ? "返回今日日记" : "Daily Journal"}</span>
            </button>

            <button
              onClick={handleRunAIDistill}
              disabled={isDistilling}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#5B7B94] text-white hover:bg-[#4a657a] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title={
                language === "zh"
                  ? "调用 AI 认知自演进引擎研读碎片并提炼高阶特质"
                  : "Distill cognitive traits and habits with AI engine"
              }
            >
              <Cpu className={`w-3.5 h-3.5 text-[#E5A93C] ${isDistilling ? "animate-spin" : ""}`} />
              <span>
                {isDistilling
                  ? language === "zh"
                    ? "认知反思中..."
                    : "Distilling..."
                  : language === "zh"
                  ? `AI 认知升维 (${settings.ai?.provider ? settings.ai.provider.toUpperCase() : "AI"})`
                  : `AI Distill (${settings.ai?.provider ? settings.ai.provider.toUpperCase() : "AI"})`}
              </span>
            </button>

            <button
              onClick={handleSyncObsidian}
              disabled={isSyncingObsidian}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Sync notes from local Obsidian vault"
            >
              <Layers className={`w-3.5 h-3.5 ${isSyncingObsidian ? "animate-spin" : "text-stone-500"}`} />
              <span>{isSyncingObsidian ? "同步中..." : language === "zh" ? "一键同步 Obsidian" : "Sync Vault"}</span>
            </button>

            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-[#D9483B] text-white hover:bg-[#B8382D] shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "录入新记忆" : "+ New"}</span>
            </button>
          </div>
        </div>

        {syncToast && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 text-xs font-medium flex items-center justify-between shadow-xs">
            <span>{syncToast}</span>
            <button onClick={() => setSyncToast(null)} className="p-1 text-stone-400 hover:text-stone-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Create New Memory Drawer/Card */}
        {isCreatingNew && (
          <div className="bg-[var(--card-white)] text-[var(--ink-primary)] border border-[var(--grid-line)] p-4 sm:p-5 space-y-4 boogie-shadow">
            <div className="flex items-center justify-between border-b border-[var(--grid-line)] pb-2">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#F7C928]" />
                <span>{language === "zh" ? "新增长期特质 / 认知记忆" : "Record New Cognitive Memory"}</span>
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-bold text-xs flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === "zh" ? "取消" : "Cancel"}</span>
              </button>
            </div>

            {/* Bilingual Creation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2">
              <button
                type="button"
                onClick={() => setNewTab("zh")}
                className={`px-3 py-1 text-xs font-bold border transition-colors ${
                  newTab === "zh"
                    ? "bg-[var(--ink-primary)] text-[var(--card-white)] border-[var(--grid-line)]"
                    : "bg-[var(--card-white)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--grid-line)]"
                }`}
              >
                {language === "zh" ? "中文录入 (ZH)" : "Chinese (ZH)"} {(newForm.titleZh || newForm.contentZh) ? "•" : ""}
              </button>
              <button
                type="button"
                onClick={() => setNewTab("en")}
                className={`px-3 py-1 text-xs font-bold border transition-colors ${
                  newTab === "en"
                    ? "bg-[var(--ink-primary)] text-[var(--card-white)] border-[var(--grid-line)]"
                    : "bg-[var(--card-white)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--grid-line)]"
                }`}
              >
                {language === "zh" ? "英文录入 (EN)" : "English (EN)"} {(newForm.titleEn || newForm.contentEn) ? "•" : ""}
              </button>
              <span className="text-[10px] text-[var(--ink-muted)] font-mono-meta ml-2">
                {language === "zh"
                  ? "（双语独立编辑，仅填一种语言将默认自动翻译）"
                  : "(Edit independently; single language will auto-translate by default)"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-secondary)] mb-1">
                  {language === "zh" ? "认知维度 (Cognitive Dimension)" : "Dimension"}
                </label>
                <select
                  value={newForm.level}
                  onChange={(e) => setNewForm({ ...newForm, level: e.target.value as MemoryLevel })}
                  className="w-full bg-[var(--panel-bg)] border border-[var(--grid-line)] text-[var(--ink-primary)] p-1.5 text-xs font-bold"
                >
                  <option value="L4">{language === "zh" ? "核心信念与底层原则 (Core Beliefs & Principles)" : "Core Beliefs & Principles"}</option>
                  <option value="L3">{language === "zh" ? "心智模型与认知风格 (Mental Models & Style)" : "Mental Models & Style"}</option>
                  <option value="L2">{language === "zh" ? "习惯偏好与经验笔记 (Habits, Preferences & Notes)" : "Habits & Notes"}</option>
                  <option value="L1">{language === "zh" ? "关键经历与人生里程碑 (Milestones & Experiences)" : "Milestones & Experiences"}</option>
                  <option value="L0">{language === "zh" ? "生活日记与瞬时感悟 (Daily Moments & Raw Stream)" : "Daily Moments & Stream"}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--ink-secondary)] mb-1">
                  {newTab === "zh"
                    ? language === "zh" ? "特质标题 (中文)" : "Title (ZH)"
                    : language === "zh" ? "特质标题 (英文)" : "Title (EN)"}
                </label>
                <input
                  type="text"
                  value={newTab === "zh" ? newForm.titleZh : newForm.titleEn}
                  onChange={(e) =>
                    newTab === "zh"
                      ? setNewForm({ ...newForm, titleZh: e.target.value })
                      : setNewForm({ ...newForm, titleEn: e.target.value })
                  }
                  placeholder={
                    newTab === "zh"
                      ? (language === "zh" ? "例如: 偏好全栈开发 / 独立思考价值观" : "e.g. Prefers full-stack flow / Independent thinker (Chinese)")
                      : (language === "zh" ? "例如: 偏好全栈开发 / 独立思考价值观 (英文)" : "e.g. Prefers full-stack flow / Independent thinker")
                  }
                  className="w-full bg-[var(--panel-bg)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-1.5 text-xs font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-secondary)] mb-1">
                {newTab === "zh"
                  ? language === "zh" ? "详细阐述 / 背景证据 (中文)" : "Content / Narrative (ZH)"
                  : language === "zh" ? "详细阐述 / 背景证据 (英文)" : "Content / Narrative (EN)"}
              </label>
              <textarea
                value={newTab === "zh" ? newForm.contentZh : newForm.contentEn}
                onChange={(e) =>
                  newTab === "zh"
                    ? setNewForm({ ...newForm, contentZh: e.target.value })
                    : setNewForm({ ...newForm, contentEn: e.target.value })
                }
                rows={3}
                placeholder={
                  newTab === "zh"
                    ? (language === "zh" ? "详细说明该价值观、行为心智模式或技能的具体描述..." : "Detailed narrative of this value, mental model, or habit (Chinese)...")
                    : (language === "zh" ? "详细说明该价值观、行为心智模式或技能的具体描述 (英文)..." : "Detailed narrative of this value, mental model, or habit...")
                }
                className="w-full bg-[var(--panel-bg)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-2 text-xs font-sans"
              />
            </div>

            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newForm.topics}
                onChange={(e) => setNewForm({ ...newForm, topics: e.target.value })}
                placeholder={
                  language === "zh"
                    ? "标签 (逗号分隔: you+bot, persona, tech-driven)"
                    : "Topics (comma separated: you+bot, persona, tech-driven)"
                }
                className="flex-1 max-w-md bg-[var(--panel-bg)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-1.5 text-xs font-sans mr-3"
              />

              <button
                onClick={handleCreateNew}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-[#D9483B] text-white hover:bg-[#B8382D] shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === "zh" ? "保存并存入记忆库" : "Save to Memory OS"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. The L0-L4 Hierarchy Pyramid Filter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-sans">
          <button
            onClick={() => setActiveLevelFilter("ALL")}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
              activeLevelFilter === "ALL"
                ? "bg-white ring-2 ring-stone-900 border-stone-900 shadow-sm"
                : "bg-white/70 hover:bg-white border-stone-200 text-stone-600 hover:border-stone-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-stone-900">
                {language === "zh" ? "全部维度" : "All Dimensions"}
              </span>
              <span className="text-[10px] bg-stone-900 text-white rounded px-1.5 py-0.5 font-mono">
                {memories.length}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              {language === "zh" ? "全维度记忆特质总览" : "Cognitive overview"}
            </p>
          </button>

          {(["L4", "L3", "L2", "L1", "L0"] as const).map((lvl) => {
            const meta = MEMORY_LEVELS_META[lvl];
            const count = levelCounts[lvl] || 0;
            const isActive = activeLevelFilter === lvl;

            return (
              <button
                key={lvl}
                onClick={() => setActiveLevelFilter(lvl)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-xs ${
                  isActive
                    ? "bg-white ring-2 ring-stone-900 border-stone-900 shadow-sm"
                    : "bg-white/70 hover:bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: meta.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="font-semibold text-xs text-stone-900">
                      {language === "zh" ? meta.nameZh : meta.nameEn}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                    {count}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] text-stone-400 truncate">
                    {language === "zh" ? meta.descZh : meta.descEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Search & Sub-Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white text-[var(--ink-primary)] border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex-1 max-w-md relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "zh"
                  ? "搜索记忆特质、价值观、SOP 技能或经历关键词..."
                  : "Search traits, values, SOP skills, or experiences..."
              }
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-stone-900 pl-8 pr-3 py-2 text-xs font-sans focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          <div className="text-xs font-sans text-stone-500 flex items-center gap-2">
            <span>
              {language === "zh" ? (
                <>显示 <strong className="text-stone-900 font-semibold">{filteredMemories.length}</strong> 条记忆</>
              ) : (
                <>Showing <strong className="text-stone-900 font-semibold">{filteredMemories.length}</strong> memories</>
              )}
            </span>
            {activeLevelFilter !== "ALL" && (
              <span className="bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded text-[10px] font-medium">
                {language === "zh"
                  ? MEMORY_LEVELS_META[activeLevelFilter].nameZh
                  : MEMORY_LEVELS_META[activeLevelFilter].nameEn}
              </span>
            )}
          </div>
        </div>

        {/* 4. Memory Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => {
            const lvl = getMemoryLevel(mem);
            const meta = MEMORY_LEVELS_META[lvl];
            const isEditing = editingMemoryId === mem.id;

            return (
              <div
                key={mem.id}
                className="bg-white rounded-xl border border-stone-200/80 p-4 sm:p-5 flex flex-col justify-between hover:border-stone-400 hover:shadow-xs transition-all shadow-xs"
              >
                {isEditing ? (
                  /* Edit Mode with Bilingual Tabs */
                  <div className="space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <select
                        value={editForm.level}
                        onChange={(e) => setEditForm({ ...editForm, level: e.target.value as MemoryLevel })}
                        className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs font-medium"
                      >
                        <option value="L4">{language === "zh" ? "底层信念 (Core Beliefs)" : "Core Beliefs"}</option>
                        <option value="L3">{language === "zh" ? "心智模型 (Mental Models)" : "Mental Models"}</option>
                        <option value="L2">{language === "zh" ? "习惯与技能 (Habits & Skills)" : "Habits & Skills"}</option>
                        <option value="L1">{language === "zh" ? "结构化经历 (Experiences)" : "Experiences"}</option>
                        <option value="L0">{language === "zh" ? "原文日志 (Raw Stream)" : "Raw Stream"}</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(mem.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>{language === "zh" ? "保存" : "Save"}</span>
                        </button>
                        <button
                          onClick={() => setEditingMemoryId(null)}
                          className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-200 transition-colors flex items-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bilingual Edit Tabs */}
                    <div className="flex items-center gap-1 border-b border-stone-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setEditTab("zh")}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          editTab === "zh"
                            ? "bg-stone-900 text-white shadow-xs"
                            : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {language === "zh" ? "中文 (ZH)" : "Chinese (ZH)"} {(editForm.titleZh || editForm.contentZh) ? "•" : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditTab("en")}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          editTab === "en"
                            ? "bg-stone-900 text-white shadow-xs"
                            : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {language === "zh" ? "英文 (EN)" : "English (EN)"} {(editForm.titleEn || editForm.contentEn) ? "•" : ""}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                        {editTab === "zh"
                          ? language === "zh" ? "标题 (中文)" : "Title (ZH)"
                          : language === "zh" ? "标题 (英文)" : "Title (EN)"}
                      </label>
                      <input
                        type="text"
                        value={editTab === "zh" ? editForm.titleZh : editForm.titleEn}
                        onChange={(e) =>
                          editTab === "zh"
                            ? setEditForm({ ...editForm, titleZh: e.target.value })
                            : setEditForm({ ...editForm, titleEn: e.target.value })
                        }
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-stone-400 transition-colors"
                        placeholder={editTab === "zh" ? "中文标题..." : "English title..."}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">
                        {editTab === "zh"
                          ? language === "zh" ? "阐述正文 (中文)" : "Content (ZH)"
                          : language === "zh" ? "阐述正文 (英文)" : "Content (EN)"}
                      </label>
                      <textarea
                        value={editTab === "zh" ? editForm.contentZh : editForm.contentEn}
                        onChange={(e) =>
                          editTab === "zh"
                            ? setEditForm({ ...editForm, contentZh: e.target.value })
                            : setEditForm({ ...editForm, contentEn: e.target.value })
                        }
                        rows={3}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-stone-400 transition-colors"
                        placeholder={editTab === "zh" ? "中文正文与描述..." : "English narrative..."}
                      />
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div>
                      {/* Card Header: Dimension Badge & Quick Actions */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: meta.color }}
                            className="text-[10px] font-medium text-white px-2 py-0.5 rounded-md tracking-wide"
                          >
                            {language === "zh" ? meta.nameZh : meta.nameEn}
                          </span>

                          {mem.provenance?.ai_generated && (
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                              {language === "zh" ? "AI 提取" : "AI Distilled"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(mem)}
                            className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
                            title={language === "zh" ? "编辑 / 校准记忆" : "Edit / Calibrate memory"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMemory(mem.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                            title={language === "zh" ? "删除记忆" : "Delete / Archive memory"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Memory Title */}
                      <h3 className="font-semibold text-sm text-stone-900 mb-1.5 leading-snug">
                        {getLocalizedTitle(mem, language)}
                      </h3>

                      {/* Memory Content */}
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-4 whitespace-pre-line font-sans">
                        {getLocalizedContent(mem, language) || (language === "zh" ? "无详细描述文本" : "No detailed description")}
                      </p>

                      {/* Visible Relationship Nodes */}
                      {(() => {
                        const targetIds = new Set<string>();
                        (mem.relations || []).forEach((id) => targetIds.add(id));
                        relationships.forEach((rel) => {
                          if (rel.from_memory_id === mem.id) targetIds.add(rel.to_memory_id);
                          if (rel.to_memory_id === mem.id) targetIds.add(rel.from_memory_id);
                        });
                        targetIds.delete(mem.id);
                        const connectedMems = memories.filter((m) => targetIds.has(m.id));

                        return connectedMems.length > 0 ? (
                          <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1 mr-0.5">
                              <Link2 className="w-3 h-3 text-[#5B7B94]" />
                              <span>NODE:</span>
                            </span>
                            {connectedMems.slice(0, 3).map((target) => (
                              <button
                                key={target.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMemoryId(target.id);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 flex items-center gap-1 font-medium transition-colors"
                                title={
                                  language === "zh"
                                    ? `跳转至关联节点: ${getLocalizedTitle(target, language)}`
                                    : `Go to node: ${getLocalizedTitle(target, language)}`
                                }
                              >
                                <span>[[{getLocalizedTitle(target, language)}]]</span>
                              </button>
                            ))}
                            {connectedMems.length > 3 && (
                              <span className="text-[9px] text-stone-400 font-mono">
                                +{connectedMems.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnectionModalMemoryId(mem.id);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md border border-dashed border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-800 flex items-center gap-1 hover:bg-stone-50 transition-colors"
                              title={language === "zh" ? "连结新记忆节点" : "Link new memory node"}
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{language === "zh" ? "连结节点" : "Link Node"}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card Footer: Metadata, Topics & Provenance */}
                    <div className="mt-3.5 pt-2.5 border-t border-stone-100 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {(mem.topics || []).slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-stone-100 border border-stone-200 rounded-md px-1.5 py-0.5 text-stone-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-sans">
                        <span>
                          {mem.provenance?.source === "you+obsidian"
                            ? language === "zh" ? "Obsidian 归档" : "Obsidian Archive"
                            : mem.provenance?.source === "you+bot"
                            ? language === "zh" ? "飞书提炼" : "Lark Distilled"
                            : language === "zh" ? "手动录入" : "Manual Entry"}
                        </span>
                        <span className="font-mono">{new Date(mem.occurred_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {filteredMemories.length === 0 && (
          <div className="bg-[var(--card-white)] border border-[var(--grid-line)] p-12 text-center space-y-3">
            <Layers className="w-8 h-8 text-[var(--ink-secondary)] mx-auto opacity-50" />
            <h4 className="font-bold text-sm text-[var(--ink-primary)]">
              {language === "zh" ? "未找到匹配的记忆记录" : "No matching memories found"}
            </h4>
            <p className="text-xs text-[var(--ink-secondary)]">
              {language === "zh"
                ? "你可以尝试清除搜索词，或者点击上方「一键同步 Obsidian」从本地导入已有记忆。"
                : "Try clearing search keywords, or click 'Sync Vault' above to import existing memories."}
            </p>
          </div>
        )}
      </div>

      {/* AI Cognitive Distillation Modal (Evermind Self-Evolving Loop) */}
      {isDistillModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-2xl bg-[var(--card-white)] border border-[var(--grid-line)] max-h-[85vh] flex flex-col overflow-hidden font-sans boogie-shadow">
            {/* Modal Header */}
            <div className="p-4 bg-[var(--panel-bg)] border-b border-[var(--grid-line)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#1D45B8]" />
                  <h3 className="text-base font-bold text-[var(--ink-primary)]">
                    {language === "zh"
                      ? "AI 认知反思提炼报告 · 认知升维闭环"
                      : "AI Cognitive Consolidation · Self-Evolving Loop"}
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--ink-secondary)] font-mono-meta mt-0.5">
                  {language === "zh"
                    ? `引擎: ${distillProviderInfo || "Google Gemini Pro"} • 待确认候选: ${distillCandidates.length} 条`
                    : `Engine: ${distillProviderInfo || "Google Gemini Pro"} • Pending candidates: ${distillCandidates.length}`}
                </p>
              </div>
              <button
                onClick={() => setIsDistillModalOpen(false)}
                className="p-1 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[var(--canvas-paper)]">
              <div className="p-3 bg-[#1D45B8]/10 border border-[#1D45B8]/30 text-xs text-[#1D45B8] leading-relaxed">
                {language === "zh" ? (
                  <>
                    <strong>自我演进认知闭环机制</strong>：系统研读了近期的原文日志与日常随笔，从中萃取出行为习惯与思维模式。点击「采纳入库」后，该记忆将晋升为中长期认知底座，未来检索与 AI 对话将优先对齐这些偏好。
                  </>
                ) : (
                  <>
                    <strong>Self-Evolving Cognitive Loop</strong>: The system analyzed recent raw logs and extracted behavioral patterns and mental models. Clicking &apos;Promote to Core&apos; elevates this insight into long-term cognitive bedrock.
                  </>
                )}
              </div>

              {distillCandidates.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="text-xs font-mono-meta font-bold text-[#1D45B8] uppercase">// COMPLETE //</div>
                  <h4 className="text-sm font-bold text-[var(--ink-primary)]">
                    {language === "zh" ? "所有候选认知已处理完毕！" : "All candidate traits processed!"}
                  </h4>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {language === "zh"
                      ? "新特质已入库记忆中枢，AI 已经比昨天更懂你一步。"
                      : "New traits are consolidated into Memory OS. AI understands you better today."}
                  </p>
                  <button
                    onClick={() => setIsDistillModalOpen(false)}
                    className="mt-2 px-4 py-1.5 bg-[var(--ink-primary)] text-[var(--card-white)] text-xs font-bold hover:bg-[#1D45B8] transition-colors"
                  >
                    {language === "zh" ? "完成并返回" : "Done & Return"}
                  </button>
                </div>
              ) : (
                distillCandidates.map((cand) => {
                  const lvlMeta = MEMORY_LEVELS_META[cand.level as MemoryLevel] || MEMORY_LEVELS_META.L2;
                  const candTitle =
                    language === "zh"
                      ? cand.title_zh || cand.title
                      : cand.title_en || cand.title;
                  const candContent =
                    language === "zh"
                      ? cand.content_zh || cand.content
                      : cand.content_en || cand.content;

                  return (
                    <div
                      key={cand.title}
                      className="p-4 bg-[var(--card-white)] border border-[var(--grid-line)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: lvlMeta.color }}
                            className="text-white font-bold text-[9px] px-1.5 py-0.2 border border-black font-mono-meta"
                          >
                            {cand.level} · {language === "zh" ? lvlMeta.nameZh : lvlMeta.nameEn}
                          </span>
                          <span className="text-[10px] text-[var(--ink-secondary)] font-mono-meta">
                            {language === "zh"
                              ? `可信度 ${Math.round(cand.confidence * 100)}%`
                              : `Confidence ${Math.round(cand.confidence * 100)}%`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-meta text-[#1D45B8] bg-[#1D45B8]/10 px-1.5 py-0.2 border border-[#1D45B8]/30">
                          {cand.rationale}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                        {candTitle}
                      </h4>

                      <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--panel-bg)] p-2.5 border border-[var(--border-subtle)]">
                        {candContent}
                      </p>

                      {cand.derived_from_titles && cand.derived_from_titles.length > 0 && (
                        <div className="text-[10px] text-[var(--ink-secondary)] font-mono-meta flex items-center gap-1 opacity-80">
                          <span className="shrink-0 font-bold">
                            {language === "zh" ? "溯源日记:" : "Source Logs:"}
                          </span>
                          <span className="truncate">
                            {cand.derived_from_titles.join(language === "zh" ? "、" : ", ")}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-dashed border-[var(--border-subtle)] flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDismissCandidate(cand.title)}
                          className="px-3 py-1 text-xs font-bold border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--grid-line)] hover:text-[var(--ink-primary)] transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === "zh" ? "驳回" : "Dismiss"}</span>
                        </button>
                        <button
                          onClick={() => handleAcceptCandidate(cand)}
                          className="px-3.5 py-1 text-xs font-bold bg-[#1D45B8] text-white hover:bg-black transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === "zh" ? "确认晋升入库" : "Promote to Core"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[var(--panel-bg)] border-t border-[var(--grid-line)] flex items-center justify-between text-xs font-mono-meta">
              <span className="text-[var(--ink-secondary)]">
                {language === "zh"
                  ? "可随时在记忆中枢进行二次白盒校准或删除"
                  : "You can recalibrate or delete anytime in Memory OS"}
              </span>
              <button
                onClick={() => setIsDistillModalOpen(false)}
                className="px-3 py-1 bg-[var(--ink-primary)] text-[var(--card-white)] font-bold hover:bg-[#1D45B8] transition-colors"
              >
                {language === "zh" ? "关闭" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
