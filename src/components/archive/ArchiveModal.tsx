"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { localeOf } from "@/lib/i18n";
import { useModalDismiss } from "@/lib/use-modal-dismiss";
import { X, FolderArchive, Filter, Calendar, Trash2 } from "lucide-react";
import { MemoryType, getLocalizedTitle, getLocalizedContent } from "@/types/memory";

interface ArchiveModalProps {
  onClose: () => void;
}

export function ArchiveModal({ onClose }: ArchiveModalProps) {
  const { memories, setSelectedMemoryId, clearAllData, t, language } = useMemory();
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Escape to close + lock background scroll while the archive is open.
  useModalDismiss(onClose);

  const filtered = memories.filter((m) => {
    if (filterType !== "all" && m.type !== filterType) return false;
    if (dateFilter && !m.occurred_at.startsWith(dateFilter)) return false;
    return true;
  });

  const handleClearAll = () => {
    if (
      window.confirm(
        language === "zh"
          ? "确定要清空全部记忆与测试数据吗？此操作将抹去当前所有记录。"
          : "Are you sure you want to clear all memories and test data? This cannot be undone."
      )
    ) {
      clearAllData();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[var(--card-white)] rounded-2xl border border-[var(--grid-line)] shadow-2xl flex flex-col h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-[var(--card-white)] border-b border-[var(--grid-line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-[#C49A56]" />
              <h3 className="font-semibold text-sm tracking-tight text-[var(--ink-primary)]">
                {language === "zh" ? "历史档案" : t.nav_archive}
              </h3>
              <span className="text-[11px] font-mono-meta text-[var(--ink-muted)]">
                ({filtered.length} {language === "zh" ? "条记录" : "items"})
              </span>
            </div>

            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer border border-rose-500/20"
                title={language === "zh" ? "清空所有记录与测试数据" : "Clear all records"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "zh" ? "清空全部数据" : "Clear All"}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--grid-line)] text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 bg-[var(--panel-bg)] border-b border-[var(--grid-line)] flex items-center gap-3 overflow-x-auto text-xs font-mono-meta">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold text-stone-700">{language === "zh" ? "类型:" : "Type:"}</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-[var(--grid-line)] rounded-md px-2 py-1 bg-white font-sans text-xs text-stone-800"
            >
              <option value="all">{language === "zh" ? "全部类型" : "All Types"}</option>
              <option value="moment">{t.memory_type_moment}</option>
              <option value="idea">{t.memory_type_idea}</option>
              <option value="learning">{t.memory_type_learning}</option>
              <option value="decision">{t.memory_type_decision}</option>
              <option value="plan">{t.memory_type_plan}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold text-stone-700">{language === "zh" ? "日期:" : "Date:"}</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-[var(--grid-line)] rounded-md px-2 py-0.5 text-xs bg-white text-stone-800"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-stone-500 hover:text-stone-900 font-semibold ml-1 cursor-pointer"
              >
                {language === "zh" ? "清除" : "Clear"}
              </button>
            )}
          </div>
        </div>

        {/* Table / List View */}
        <div className="flex-1 p-5 overflow-y-auto bg-[var(--canvas-paper)]">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
              <FolderArchive className="w-10 h-10 mb-2 opacity-40 text-stone-300" />
              <p className="text-sm font-medium text-stone-600">
                {language === "zh" ? "暂无归档记录" : "No archived records"}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {language === "zh"
                  ? "可以在今日记录中捕捉灵感、微光与日常碎片，随写随存"
                  : "Capture thoughts, ideas, and daily notes anytime in the journal"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMemoryId(m.id);
                    onClose();
                  }}
                  className="p-3 bg-white border border-[var(--grid-line)] rounded-xl hover:border-[#5B7B94] shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-[var(--grid-line)] font-mono-meta bg-stone-50 text-stone-700 shrink-0">
                      {t[`memory_type_${m.type}` as keyof typeof t] || m.type}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-stone-900 truncate">
                        {getLocalizedTitle(m, language)}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 font-sans">
                        {getLocalizedContent(m, language)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[11px] font-mono-meta text-stone-400">
                      {new Date(m.occurred_at).toLocaleDateString(localeOf(language))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
