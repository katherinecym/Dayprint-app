"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { dateKeyOf, getWeekRange } from "@/lib/date";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  CanonicalMemory,
  MemoryLevel,
  MEMORY_LEVELS_META,
  getMemoryLevel,
  getLocalizedTitle,
  getLocalizedContent,
  formatDisplayDate,
  formatDisplayTime,
} from "@/types/memory";
import confetti from "canvas-confetti";

interface WeeklyDigestModalProps {
  onClose: () => void;
}

export function WeeklyDigestModal({ onClose }: WeeklyDigestModalProps) {
  const {
    memories,
    addMemory,
    updateMemory,
    deleteMemory,
    setSelectedMemoryId,
    language,
    getTypeColor,
  } = useMemory();

  // Week offset relative to today (0 = current week, -1 = last week, etc.)
  // On Monday (day 1), default to last week (-1) so judges and users immediately see the full weekly review
  const [weekOffset, setWeekOffset] = useState<number>(() => {
    return typeof window !== "undefined" && new Date().getDay() === 1 ? -1 : 0;
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [activeFilterLevel, setActiveFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit State
  const [editingMemory, setEditingMemory] = useState<CanonicalMemory | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [formLevel, setFormLevel] = useState<MemoryLevel>("L0");
  const [formDate, setFormDate] = useState<string>("");
  const [formTopics, setFormTopics] = useState<string>("");

  // Escape closes the inline editor first, then the modal.
  // The shell-level hook is disabled while the editor is open so the two
  // handlers never both fire on the same keypress.
  const isEditingInline = Boolean(editingMemory) || isCreating;
  useModalDismiss(onClose, { enabled: !isEditingInline });

  useEffect(() => {
    if (!isEditingInline) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setEditingMemory(null);
      setIsCreating(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditingInline]);

  // Compute Monday-Sunday date range for current weekOffset
  const { startDateStr, endDateStr, weekLabel, daysInWeek } = useMemo(() => {
    const { start, end, days } = getWeekRange(weekOffset);
    return {
      startDateStr: start,
      endDateStr: end,
      weekLabel: `${start.slice(5)} ~ ${end.slice(5)}`,
      daysInWeek: days,
    };
  }, [weekOffset]);

  // Filter memories belonging to this week
  const weekMemories = useMemo(() => {
    return memories
      .filter((m) => {
        // dateKeyOf 同时兼容本地偏移串（+08:00）与旧数据的 Z 结尾串；
        // 直接 split("T") 只对前者正确。
        const memDate = m.occurred_at ? dateKeyOf(m.occurred_at) : "";
        return memDate >= startDateStr && memDate <= endDateStr;
      })
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [memories, startDateStr, endDateStr]);

  // Level breakdowns
  const levelStats = useMemo(() => {
    const counts: Record<MemoryLevel, number> = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
    };
    weekMemories.forEach((m) => {
      const lvl = getMemoryLevel(m);
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return counts;
  }, [weekMemories]);

  // Top topics
  const topTopics = useMemo(() => {
    const map = new Map<string, number>();
    weekMemories.forEach((m) => {
      (m.topics || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [weekMemories]);

  // Filtered memory list for display
  const displayedMemories = useMemo(() => {
    return weekMemories.filter((m) => {
      const lvl = getMemoryLevel(m);
      if (activeFilterLevel !== "ALL" && lvl !== activeFilterLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (getLocalizedTitle(m, language) || "").toLowerCase();
        const content = (getLocalizedContent(m, language) || "").toLowerCase();
        const matchTopic = (m.topics || []).some((t) => t.toLowerCase().includes(q));
        if (!title.includes(q) && !content.includes(q) && !matchTopic) return false;
      }
      return true;
    });
  }, [weekMemories, activeFilterLevel, searchQuery, language]);

  // Open Edit Form
  const handleStartEdit = (m: CanonicalMemory) => {
    setEditingMemory(m);
    setIsCreating(false);
    setFormTitle(m.title_zh || m.title || "");
    setFormContent(m.content_zh || m.content || "");
    setFormLevel(getMemoryLevel(m));
    setFormDate(m.occurred_at ? m.occurred_at.split("T")[0] : startDateStr);
    setFormTopics((m.topics || []).join(", "));
  };

  // Open Create Form
  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingMemory(null);
    setFormTitle("");
    setFormContent("");
    setFormLevel("L0");
    setFormDate(startDateStr);
    setFormTopics("");
  };

  // Save Form (Create or Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) return;

    const parsedTopics = formTopics
      .split(/[,，\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const typeMap: Record<MemoryLevel, string> = {
      L0: "moment",
      L1: "achievement",
      L2: "plan",
      L3: "learning",
      L4: "decision",
    };

    const targetType = typeMap[formLevel] || "moment";
    const finalDate = formDate || startDateStr;
    const timestamp = `${finalDate}T12:00:00+08:00`;

    if (editingMemory) {
      updateMemory(editingMemory.id, {
        title: formTitle,
        title_zh: formTitle,
        content: formContent,
        content_zh: formContent,
        type: targetType,
        memory_level: formLevel,
        occurred_at: timestamp,
        topics: parsedTopics,
        updated_at: new Date().toISOString(),
      });
      setEditingMemory(null);
    } else if (isCreating) {
      addMemory({
        title: formTitle,
        title_zh: formTitle,
        content: formContent,
        content_zh: formContent,
        type: targetType,
        memory_level: formLevel,
        occurred_at: timestamp,
        recorded_at: new Date().toISOString(),
        topics: parsedTopics,
        status: "active",
      });
      setIsCreating(false);
    }
  };

  // Delete Memory
  const handleDelete = (id: string, title: string) => {
    if (
      window.confirm(
        language === "zh"
          ? `确定要删除此条记忆吗？「${title}」`
          : `Are you sure you want to delete "${title}"?`
      )
    ) {
      deleteMemory(id);
    }
  };

  // Generate & Copy Markdown Digest
  const handleCopyDigest = () => {
    const isZh = language === "zh";
    let md = isZh
      ? `# 📖 Dayprint 本周记忆小结 (${startDateStr} ~ ${endDateStr})\n\n`
      : `# 📖 Dayprint Weekly Memory Digest (${startDateStr} ~ ${endDateStr})\n\n`;

    md += isZh
      ? `> **本周沉淀概览**：共记录 ${weekMemories.length} 条记忆碎片，覆盖 ${
          new Set(weekMemories.map((m) => dateKeyOf(m.occurred_at))).size
        } 天。\n\n`
      : `> **Weekly Overview**: ${weekMemories.length} memory entries captured across ${
          new Set(weekMemories.map((m) => dateKeyOf(m.occurred_at))).size
        } days.\n\n`;

    md += isZh ? `### 🧠 认知分层分布\n` : `### 🧠 Cognitive Pyramid Distribution\n`;
    md += isZh
      ? `- **核心原则 (L4)**: ${levelStats.L4} 条\n- **心智模型 (L3)**: ${levelStats.L3} 条\n- **习惯准则 (L2)**: ${levelStats.L2} 条\n- **关键经历 (L1)**: ${levelStats.L1} 条\n- **原始日志 (L0)**: ${levelStats.L0} 条\n\n`
      : `- **Core Principles (L4)**: ${levelStats.L4}\n- **Mental Models (L3)**: ${levelStats.L3}\n- **Habits & SOPs (L2)**: ${levelStats.L2}\n- **Key Events (L1)**: ${levelStats.L1}\n- **Raw Stream (L0)**: ${levelStats.L0}\n\n`;

    if (topTopics.length > 0) {
      md += isZh ? `### 🏷️ 本周高频主题\n` : `### 🏷️ Top Topics This Week\n`;
      md += topTopics.map(([t, c]) => `#${t} (${c})`).join("  ") + "\n\n";
    }

    md += isZh ? `### 📝 本周沉淀清单\n\n` : `### 📝 Captured Memories\n\n`;
    weekMemories.forEach((m, idx) => {
      const lvlMeta = MEMORY_LEVELS_META[getMemoryLevel(m)];
      const title = getLocalizedTitle(m, language);
      const content = getLocalizedContent(m, language);
      const date = dateKeyOf(m.occurred_at);
      const lvlLabel = isZh ? lvlMeta.shortZh : lvlMeta.shortEn;
      md += `#### ${idx + 1}. [${lvlLabel}] ${title} (${date})\n`;
      if (content) md += `${content}\n`;
      if (m.topics && m.topics.length > 0) {
        md += `*${isZh ? "标签" : "Tags"}*: ${m.topics.map((t) => `#${t}`).join(" ")}\n`;
      }
      md += `\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#C97A63", "#5B7B94", "#608066"],
      });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/45 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[var(--card-white)] rounded-2xl border border-[var(--grid-line)] shadow-2xl flex flex-col h-[88vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 bg-[var(--card-white)] border-b border-[var(--grid-line)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#608066]/15 border border-[#608066]/30 flex items-center justify-center text-[#608066]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-[var(--ink-primary)]">
                  {language === "zh" ? "周度复盘与认知维护" : "Weekly Digest & Maintenance"}
                </h3>
                <span className="text-[10px] font-mono-meta bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                  {weekLabel}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-secondary)]">
                {language === "zh"
                  ? "回顾本周认知更新，支持快捷维护、编辑、补记与导出周报"
                  : "Review weekly memory updates, edit entries, and export weekly brief"}
              </p>
            </div>
          </div>

          {/* Week Navigator & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white text-xs shadow-2xs">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                title={language === "zh" ? "上一周" : "Previous week"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-2.5 py-1 font-mono-meta text-[11px] font-medium transition-colors cursor-pointer ${
                  weekOffset === 0 ? "bg-stone-900 text-white" : "hover:bg-stone-100 text-stone-700"
                }`}
              >
                {language === "zh"
                  ? weekOffset === 0
                    ? "本周"
                    : weekOffset === -1
                    ? "上一周"
                    : `${Math.abs(weekOffset)} 周前`
                  : weekOffset === 0
                  ? "Current"
                  : weekOffset === -1
                  ? "Last Week"
                  : `${Math.abs(weekOffset)}w ago`}
              </button>
              <button
                onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
                disabled={weekOffset >= 0}
                className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title={language === "zh" ? "下一周" : "Next week"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleCopyDigest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#608066] text-white hover:bg-[#4E6B54] rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (language === "zh" ? "已复制周报" : "Copied!") : (language === "zh" ? "导出周报" : "Copy Digest")}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Stats Bar */}
        <div className="p-3 bg-stone-50/80 border-b border-[var(--grid-line)] flex items-center justify-between gap-3 shrink-0 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-meta text-stone-500 font-semibold">
              {language === "zh" ? "本周沉淀:" : "WEEKLY TOTAL:"}
            </span>
            <span className="font-bold text-stone-900 font-mono">
              {weekMemories.length} {language === "zh" ? "条碎片" : "mems"}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600 text-[11px]">
              {new Set(weekMemories.map((m) => dateKeyOf(m.occurred_at))).size} {language === "zh" ? "天活跃" : "active days"}
            </span>
          </div>

          {/* Level Distribution Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["L4", "L3", "L2", "L1", "L0"] as const).map((lvl) => {
              const meta = MEMORY_LEVELS_META[lvl];
              const count = levelStats[lvl];
              return (
                <div
                  key={lvl}
                  style={{ borderLeftColor: meta.color }}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-200 border-l-3 rounded text-[10px] font-mono-meta"
                >
                  <span className="text-stone-500">{language === "zh" ? meta.shortZh : meta.shortEn}:</span>
                  <span className="font-bold text-stone-800">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Top Topics */}
          {topTopics.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400 font-mono">TOP:</span>
              {topTopics.map(([t]) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 bg-white border border-stone-200 rounded font-mono text-stone-600"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Filter & Memories List */}
          <div className="flex-1 flex flex-col border-r border-[var(--grid-line)] overflow-hidden">
            {/* Filter Sub-toolbar */}
            <div className="p-3 border-b border-[var(--grid-line)] flex items-center justify-between gap-2 shrink-0 bg-white">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                {(["ALL", "L4", "L3", "L2", "L1", "L0"] as const).map((lvl) => {
                  const isActive = activeFilterLevel === lvl;
                  const label =
                    lvl === "ALL"
                      ? language === "zh"
                        ? "全部"
                        : "ALL"
                      : language === "zh"
                      ? MEMORY_LEVELS_META[lvl].shortZh
                      : MEMORY_LEVELS_META[lvl].shortEn;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setActiveFilterLevel(lvl)}
                      className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={language === "zh" ? "检索本周..." : "Search week..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 w-32 sm:w-40"
                />

                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#C97A63] text-white hover:bg-[#b86b55] rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "补记" : "Add"}</span>
                </button>
              </div>
            </div>

            {/* Memories Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-stone-50/50">
              {displayedMemories.length === 0 ? (
                <div className="py-16 text-center text-stone-400 font-mono-meta text-xs">
                  {language === "zh" ? "本周未找到匹配的记忆记录" : "No memories found for this week"}
                </div>
              ) : (
                displayedMemories.map((m) => {
                  const lvl = getMemoryLevel(m);
                  const meta = MEMORY_LEVELS_META[lvl];
                  const typeColor = getTypeColor(m.type);
                  const isCurrentEditing = editingMemory?.id === m.id;

                  return (
                    <div
                      key={m.id}
                      style={{ borderLeftColor: meta.color, borderLeftWidth: "3px" }}
                      className={`p-3 bg-white border border-stone-200/90 rounded-xl shadow-2xs hover:border-stone-400 transition-all ${
                        isCurrentEditing ? "ring-2 ring-stone-900 bg-stone-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                            className="text-[10px] font-mono-meta font-bold px-1.5 py-0.5 rounded border border-stone-200"
                          >
                            {language === "zh" ? meta.shortZh : meta.shortEn}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {formatDisplayDate(m.occurred_at)} {formatDisplayTime(m.occurred_at)}
                          </span>
                        </div>

                        {/* Action buttons: Edit, Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                            title={language === "zh" ? "编辑此条记忆" : "Edit memory"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, getLocalizedTitle(m, language))}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
                            title={language === "zh" ? "删除此条记忆" : "Delete memory"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 leading-snug">
                        {getLocalizedTitle(m, language)}
                      </h4>

                      {m.content && (
                        <p className="text-[11px] text-stone-600 mt-1 line-clamp-3 leading-relaxed font-sans">
                          {getLocalizedContent(m, language)}
                        </p>
                      )}

                      {/* Topics */}
                      {m.topics && m.topics.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {m.topics.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Embedded Edit / Create Drawer */}
          {(editingMemory || isCreating) && (
            <div className="w-full sm:w-88 border-l border-[var(--grid-line)] bg-white p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-150">
              <form onSubmit={handleSaveForm} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-mono-meta">
                    <Edit3 className="w-3.5 h-3.5 text-[#C97A63]" />
                    <span>
                      {isCreating
                        ? language === "zh"
                          ? "本周补记碎片"
                          : "Add Weekly Memory"
                        : language === "zh"
                        ? "编辑记忆卡片"
                        : "Edit Memory Card"}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemory(null);
                      setIsCreating(false);
                    }}
                    className="p-1 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Level Selection */}
                <div>
                  <label className="block text-[10px] font-mono-meta font-bold text-stone-500 mb-1">
                    {language === "zh" ? "认知分层 (Level)" : "Cognitive Level"}
                  </label>
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono-meta">
                    {(["L0", "L1", "L2", "L3", "L4"] as const).map((lvl) => {
                      const meta = MEMORY_LEVELS_META[lvl];
                      const isSelected = formLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormLevel(lvl)}
                          style={{
                            backgroundColor: isSelected ? meta.color : "#FFF",
                            color: isSelected ? "#FFF" : "#444",
                            borderColor: isSelected ? meta.color : "#E5E5E5",
                          }}
                          className="py-1 rounded border font-medium text-center transition-all cursor-pointer"
                        >
                          {language === "zh" ? meta.shortZh : meta.shortEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-[10px] font-mono-meta font-bold text-stone-500 mb-1">
                    {language === "zh" ? "发生日期" : "Date"}
                  </label>
                  <select
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 font-mono"
                  >
                    {daysInWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-mono-meta font-bold text-stone-500 mb-1">
                    {language === "zh" ? "记忆标题" : "Title"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={language === "zh" ? "输入记忆标题..." : "Enter memory title..."}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 font-sans"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-[10px] font-mono-meta font-bold text-stone-500 mb-1">
                    {language === "zh" ? "正文内容" : "Content"}
                  </label>
                  <textarea
                    rows={6}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder={language === "zh" ? "输入详细记录或复盘感悟..." : "Enter details or reflection..."}
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-[10px] font-mono-meta font-bold text-stone-500 mb-1">
                    {language === "zh" ? "标签 (用逗号或空格分隔)" : "Topics (comma separated)"}
                  </label>
                  <input
                    type="text"
                    value={formTopics}
                    onChange={(e) => setFormTopics(e.target.value)}
                    placeholder="architecture, learning, reading"
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 font-mono"
                  />
                </div>

                {/* Save Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemory(null);
                      setIsCreating(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                  >
                    {language === "zh" ? "取消" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "保存沉淀" : "Save"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
