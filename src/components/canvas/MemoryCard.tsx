"use client";

import React from "react";
import { CanonicalMemory, getLocalizedTitle, getLocalizedContent, getMemoryTypeBadgeStyle, getMemoryLevel, MEMORY_LEVELS_META } from "@/types/memory";
import { useMemory } from "@/lib/memory-context";
import { localeOf } from "@/lib/i18n";
import { Calendar, Link2, Sprout } from "lucide-react";
import { motion } from "framer-motion";

interface MemoryCardProps {
  memory: CanonicalMemory;
  colSpan?: number;
  rowSpan?: number;
  accentBg?: string;
  colorBorder?: string;
  isHorizontalStream?: boolean;
}

export function MemoryCard({
  memory,
  colSpan = 1,
  rowSpan = 1,
  accentBg = "var(--card-white)",
  colorBorder = "var(--grid-line)",
  isHorizontalStream = false,
}: MemoryCardProps) {
  const { setSelectedMemoryId, t, relationships, memories: allMemories, language, getTypeColor, settings } = useMemory();

  const typeColor = getTypeColor(memory.type);
  const isDark = settings?.theme === "obsidian-dark";

  const PAPER_STOCK_PRESETS: Record<string, { bg: string; border: string }> = {
    idea: { bg: "#FDF3EF", border: "#F0DDD4" },
    learning: { bg: "#EFF4F8", border: "#D8E4ED" },
    moment: { bg: "#FBF5E8", border: "#EDE2CC" },
    decision: { bg: "#F4F1F8", border: "#DFD9E8" },
    plan: { bg: "#EFF4EE", border: "#D8E4D6" },
    achievement: { bg: "#F8EFEA", border: "#E8D8CF" },
    collection: { bg: "#EFF3F5", border: "#D4DEE2" },
  };

  const stock = PAPER_STOCK_PRESETS[memory.type] || {
    bg: isDark ? "var(--card-white)" : `${typeColor}18`,
    border: `${typeColor}45`,
  };

  const formattedDate = new Date(memory.occurred_at).toLocaleDateString(localeOf(language), {
    month: "short",
    day: "numeric",
  });

  const connectedMems = React.useMemo(() => {
    const targetIds = new Set<string>();
    (memory.relations || []).forEach((id) => targetIds.add(id));
    relationships.forEach((rel) => {
      if (rel.from_memory_id === memory.id) targetIds.add(rel.to_memory_id);
      if (rel.to_memory_id === memory.id) targetIds.add(rel.from_memory_id);
    });
    targetIds.delete(memory.id);
    return allMemories.filter((m) => targetIds.has(m.id));
  }, [memory, relationships, allMemories]);

  const hasImage = Boolean(memory.media_url);

  return (
    <motion.div
      layoutId={`card-${memory.id}`}
      data-testid="memory-card"
      data-memory-id={memory.id}
      onClick={() => setSelectedMemoryId(memory.id)}
      style={{
        backgroundColor: hasImage ? "#FFFFFF" : isDark ? "var(--card-white)" : stock.bg,
        borderColor: isDark ? "var(--border-subtle)" : stock.border,
        borderTopColor: typeColor,
        borderTopWidth: "3.5px",
        ...(isHorizontalStream
          ? {}
          : {
              gridColumn: `span ${colSpan}`,
              gridRow: `span ${rowSpan}`,
            }),
      }}
      className={`cursor-pointer border border-[var(--grid-line)] shadow-2xs hover:shadow-md p-4 flex flex-col justify-between relative group select-none rounded-xl transition-all ${
        hasImage ? "shadow-md bg-white" : ""
      } ${
        isHorizontalStream
          ? "w-[260px] md:w-[300px] shrink-0 h-[210px] snap-start"
          : "min-h-[140px]"
      }`}
    >
      {/* Polaroid / Scrapbook Washi Tape on Top */}
      {hasImage && (
        <div
          className="washi-tape-strip"
          style={{
            backgroundColor: `${typeColor}40`,
          }}
        />
      )}

      {/* Top Header: Badge, Type & Relations Indicator */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              style={{ backgroundColor: typeColor, color: "#FFFFFF" }}
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shadow-2xs"
            >
              {t[`memory_type_${memory.type}` as keyof typeof t] || memory.type}
            </span>

            {/* Cognitive Level Badge */}
            {(() => {
              const level = getMemoryLevel(memory);
              const meta = MEMORY_LEVELS_META[level];
              if (!meta) return null;
              return (
                <span
                  className="text-[9.5px] font-mono px-1.5 py-0.2 border rounded-full font-semibold shadow-2xs"
                  style={{
                    borderColor: `${meta.color}50`,
                    color: meta.color,
                    backgroundColor: `${meta.color}14`,
                  }}
                  title={language === "zh" ? `${meta.code} · ${meta.nameZh}` : `${meta.code} · ${meta.nameEn}`}
                >
                  {meta.code} · {language === "zh" ? meta.shortZh : meta.shortEn}
                </span>
              );
            })()}

            {memory.timeline_logs && memory.timeline_logs.length > 1 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded-full font-medium shadow-2xs flex items-center gap-0.5">
                <Sprout className="w-2.5 h-2.5 text-emerald-600 inline" />
                <span>{memory.timeline_logs.length}</span>
              </span>
            )}

            {memory.relations && memory.relations.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] bg-[var(--panel-bg)] text-[var(--ink-primary)] px-1 py-0.5 border border-[var(--grid-line)] font-mono-meta font-bold">
                <Link2 className="w-2.5 h-2.5 text-[var(--ink-primary)]" />
                {memory.relations.length}
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono-meta text-[var(--ink-secondary)] flex items-center gap-1 opacity-80">
            <Calendar className="w-2.5 h-2.5" />
            {formattedDate}
          </span>
        </div>

        {/* Polaroid Matte Photo Frame (When Image is Present) */}
        {memory.media_url && (
          <div className="my-2.5 p-2 bg-[#FBF9F5] border border-stone-200/90 rounded-xs shadow-inner">
            <div className="w-full overflow-hidden border border-stone-300/80 max-h-40 relative bg-black/5 rounded-2xs">
              <img
                src={memory.media_url}
                alt={getLocalizedTitle(memory, language)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute bottom-1 right-1 bg-black/60 text-[9px] font-mono text-white px-1.5 py-0.2 rounded-2xs backdrop-blur-xs">
                35mm · Instax
              </div>
            </div>
            {/* Polaroid Bottom Chin Caption */}
            <div className="pt-2 pb-0.5 text-center text-xs font-normal text-stone-600 truncate">
              “{getLocalizedTitle(memory, language)}”
            </div>
          </div>
        )}

        {/* Title: 1-2 lines concise display (Only shown as headline if no polaroid frame) */}
        {!memory.media_url && (
          <h3 className="text-sm font-bold leading-snug tracking-tight text-[var(--ink-primary)] group-hover:text-[#3155D9] transition-colors line-clamp-2">
            {getLocalizedTitle(memory, language)}
          </h3>
        )}

        {/* Content Preview: compact 2-line snippet to prevent text clutter */}
        {memory.content && (
          <p className="text-xs text-[var(--ink-secondary)] mt-1.5 line-clamp-2 leading-relaxed font-sans">
            {getLocalizedContent(memory, language)}
          </p>
        )}

        {/* Relationship Nodes */}
        {connectedMems.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-mono-meta text-[var(--ink-secondary)] font-bold flex items-center gap-0.5">
              <Link2 className="w-2.5 h-2.5 text-[#1D45B8]" />
              <span>NODE:</span>
            </span>
            {connectedMems.slice(0, 2).map((target) => (
              <button
                key={target.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMemoryId(target.id);
                }}
                className="text-[9px] font-mono-meta px-1.5 py-0.5 border border-[var(--grid-line)] bg-[var(--panel-bg)] text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-[var(--card-white)] flex items-center gap-0.5 font-bold shadow-xs transition-colors"
                title={language === "zh" ? `跳转至: ${getLocalizedTitle(target, language)}` : `Jump to: ${getLocalizedTitle(target, language)}`}
              >
                <span>[[{getLocalizedTitle(target, language)}]]</span>
              </button>
            ))}
            {connectedMems.length > 2 && (
              <span className="text-[8px] font-mono-meta text-[var(--ink-secondary)] font-bold">
                +{connectedMems.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Topics */}
      <div className="mt-3 pt-2 border-t border-dashed border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
          {memory.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className="text-[10px] bg-[var(--panel-bg)]/80 border border-[var(--border-subtle)] text-[var(--ink-secondary)] px-1.5 py-0.5 rounded font-mono-meta"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
