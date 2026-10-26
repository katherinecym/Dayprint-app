"use client";

import React, { useState, useRef, useEffect } from "react";
import { CanonicalMemory, MemoryType, getLocalizedTitle, getLocalizedContent, getMemoryTypeBadgeStyle } from "@/types/memory";
import { useMemory } from "@/lib/memory-context";
import { localeOf } from "@/lib/i18n";
import { compressImage } from "@/lib/image";
import {
  X,
  Calendar,
  Trash2,
  Edit3,
  Check,
  Link2,
  Share2,
  Tag,
  Layers,
  Image as ImageIcon,
  Plus,
  Sprout,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExpandedMemoryModalProps {
  memoryId: string | null;
  onClose: () => void;
}

export function ExpandedMemoryModal({ memoryId, onClose }: ExpandedMemoryModalProps) {
  const {
    memories,
    updateMemory,
    deleteMemory,
    relationships,
    setSelectedMemoryId,
    setConnectionModalMemoryId,
    language,
    t,
    availableTypes,
    addCustomType,
    getTypeColor,
  } = useMemory();

  const memory = memories.find((m) => m.id === memoryId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState<"zh" | "en">(language);
  const [editTitleZh, setEditTitleZh] = useState("");
  const [editContentZh, setEditContentZh] = useState("");
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editContentEn, setEditContentEn] = useState("");

  const [editType, setEditType] = useState<MemoryType>("idea");
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [editTopics, setEditTopics] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleConfirmNewType = () => {
    const clean = newTypeInput.trim();
    if (clean) {
      addCustomType(clean);
      setEditType(clean);
      setIsAddingCustomType(false);
      setNewTypeInput("");
    }
  };

  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const compressed = await compressImage(file);
      setEditMediaUrl(compressed);
    } catch {
      console.error("Failed to process image");
    } finally {
      setIsUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  if (!memory) return null;

  const handleStartEdit = () => {
    setEditTab(language);
    setEditTitleZh(memory.title_zh || (memory.language === "zh" ? memory.title : ""));
    setEditContentZh(memory.content_zh || (memory.language === "zh" ? memory.content : ""));
    setEditTitleEn(memory.title_en || (memory.language === "en" ? memory.title : ""));
    setEditContentEn(memory.content_en || (memory.language === "en" ? memory.content : ""));
    setEditType(memory.type);
    setEditTopics(memory.topics.join(", "));
    setEditMediaUrl(memory.media_url || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const topicsArr = editTopics
      .split(/[,， ]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    updateMemory(memory.id, {
      title_zh: editTitleZh.trim() || undefined,
      title_en: editTitleEn.trim() || undefined,
      content_zh: editContentZh.trim() || undefined,
      content_en: editContentEn.trim() || undefined,
      type: editType,
      topics: topicsArr,
      media_url: editMediaUrl ? editMediaUrl.trim() : undefined,
    });
    setIsEditing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Find linked memories from relationships
  const relatedLinks = relationships.filter(
    (r) => r.from_memory_id === memory.id || r.to_memory_id === memory.id
  );
  const relatedMemoryIds = relatedLinks.map((r) =>
    r.from_memory_id === memory.id ? r.to_memory_id : r.from_memory_id
  );
  const relatedMemories = memories.filter((m) => relatedMemoryIds.includes(m.id));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs cursor-pointer"
    >
      {/* Click-to-Zoom Detail Surface */}
      <motion.div
        layoutId={`card-${memory.id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${getTypeColor(memory.type)}` }}
        className="w-full max-w-2xl bg-[var(--card-white)] border border-[var(--grid-line)] shadow-xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden cursor-default"
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-[var(--grid-line)] flex items-center justify-between bg-[var(--panel-bg)]/60">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: getTypeColor(memory.type), color: "#FFFFFF" }}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs"
            >
              {t[`memory_type_${memory.type}` as keyof typeof t] || memory.type}
            </span>
            <span className="text-xs font-mono-meta text-[var(--ink-secondary)] flex items-center gap-1 opacity-80">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(memory.occurred_at).toLocaleString(localeOf(language))}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setConnectionModalMemoryId(memory.id);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#5B7B94]/40 bg-white hover:bg-[#5B7B94]/10 text-[#5B7B94] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
            >
              <Link2 className="w-3 h-3" />
              <span>{t.explore_connections}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--grid-line)] bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
              title={language === "zh" ? "关闭 (Esc 或点击背景)" : "Close (Esc or click background)"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 font-sans">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              {/* Bilingual Edit Tab Switcher */}
              <div className="flex items-center gap-1.5 font-mono-meta text-[11px] pb-1 border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditTab("zh")}
                  className={`px-2.5 py-1 border border-black font-bold transition-colors ${
                    editTab === "zh" ? "bg-black text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {language === "zh" ? "中文版本 (ZH)" : "Chinese (ZH)"} {(editTitleZh || editContentZh) ? "•" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab("en")}
                  className={`px-2.5 py-1 border border-black font-bold transition-colors ${
                    editTab === "en" ? "bg-black text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {language === "zh" ? "英文版本 (EN)" : "English (EN)"} {(editTitleEn || editContentEn) ? "•" : ""}
                </button>
                <span className="text-[10px] text-neutral-400 ml-1">
                  {language === "zh"
                    ? "（双语独立保存互不覆盖，单语录入将自动补齐翻译）"
                    : "(Independent editing without overwrite; single language auto-translates)"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase font-mono-meta flex items-center justify-between">
                  <span>{editTab === "zh" ? (language === "zh" ? "中文标题" : "Title (ZH)") : (language === "zh" ? "英文标题" : "Title (EN)")}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {editTab === "zh" ? "Chinese Title" : "English Title"}
                  </span>
                </label>
                <input
                  type="text"
                  value={editTab === "zh" ? editTitleZh : editTitleEn}
                  onChange={(e) => {
                    if (editTab === "zh") setEditTitleZh(e.target.value);
                    else setEditTitleEn(e.target.value);
                  }}
                  placeholder={
                    editTab === "zh"
                      ? (language === "zh" ? "输入中文标题..." : "Enter Chinese title...")
                      : (language === "zh" ? "输入英文标题..." : "Enter English title...")
                  }
                  className="w-full border border-black p-2 text-sm font-bold bg-[#FCFAF5] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase font-mono-meta">
                  {language === "zh" ? "类型" : "Type"}
                </label>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {availableTypes.map((mType) => {
                    const badgeStyle = getMemoryTypeBadgeStyle(mType);
                    const isSelected = editType === mType;
                    const label = t[`memory_type_${mType}` as keyof typeof t] || mType;
                    return (
                      <button
                        key={mType}
                        type="button"
                        onClick={() => setEditType(mType)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? `${badgeStyle.bgClass} shadow-xs`
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}

                  {/* Inline custom type input */}
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
                      className="px-2 py-1 text-xs font-medium rounded-lg border border-dashed border-stone-300 text-stone-500 hover:text-stone-800 hover:border-stone-400 bg-transparent flex items-center gap-0.5 transition-colors cursor-pointer"
                      title={language === "zh" ? "新增自定义类型" : "Add custom type"}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{language === "zh" ? "新增类型" : "New Type"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase font-mono-meta flex items-center justify-between">
                  <span>{editTab === "zh" ? (language === "zh" ? "中文阐述内容" : "Content (ZH)") : (language === "zh" ? "英文阐述内容" : "Content (EN)")}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {editTab === "zh" ? "Chinese Content" : "English Content"}
                  </span>
                </label>
                <textarea
                  value={editTab === "zh" ? editContentZh : editContentEn}
                  onChange={(e) => {
                    if (editTab === "zh") setEditContentZh(e.target.value);
                    else setEditContentEn(e.target.value);
                  }}
                  rows={6}
                  placeholder={
                    editTab === "zh"
                      ? (language === "zh" ? "输入中文正文与背景..." : "Enter Chinese body content...")
                      : (language === "zh" ? "输入英文正文与背景..." : "Enter English body content...")
                  }
                  className="w-full border border-black p-2.5 text-sm bg-[#FCFAF5] resize-none leading-relaxed mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase font-mono-meta">
                  {language === "zh" ? "主题标签" : "Topics / Tags"}
                </label>
                <input
                  type="text"
                  value={editTopics}
                  onChange={(e) => setEditTopics(e.target.value)}
                  placeholder={language === "zh" ? "艺术, 设计, 哲学" : "art, design, philosophy"}
                  className="w-full border border-black p-2 text-xs font-mono-meta bg-[#FCFAF5] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase font-mono-meta flex items-center justify-between">
                  <span>{language === "zh" ? "视觉图片" : "Visual Image"}</span>
                  {isUploading && (
                    <span className="text-[#1D45B8] text-[10px]">
                      {language === "zh" ? "正在优化压缩..." : "Compressing..."}
                    </span>
                  )}
                </label>

                {/* Hidden file input for edit mode */}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col gap-2 mt-1">
                  {/* Image preview with replace / remove controls */}
                  {editMediaUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-[#FCFAF5] border-2 border-black">
                      <img
                        src={editMediaUrl}
                        alt="preview"
                        className="h-16 w-auto max-w-[140px] object-cover border border-black/50"
                      />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-[10px] font-mono-meta font-bold text-neutral-700">
                          {language === "zh" ? "本地图片已附上" : "Image attached"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="px-2 py-1 text-xs border border-black bg-white hover:bg-[#F7C928] font-bold"
                          >
                            {language === "zh" ? "更换图片" : "Change Image"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMediaUrl("")}
                            className="px-2 py-1 text-xs border border-black bg-white hover:bg-[#DD2E1E] hover:text-white font-bold"
                          >
                            {language === "zh" ? "移除图片" : "Remove Image"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 border border-black bg-white hover:bg-[#F7C928] font-bold text-xs flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#1D45B8]" />
                        <span>{language === "zh" ? "上传本地图片" : "Upload Image"}</span>
                      </button>
                      <input
                        type="text"
                        value={editMediaUrl}
                        onChange={(e) => setEditMediaUrl(e.target.value)}
                        placeholder={language === "zh" ? "或粘贴图片 Web URL..." : "Or paste image Web URL..."}
                        className="flex-1 border border-black p-1.5 text-xs font-mono-meta bg-[#FCFAF5]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs border border-[var(--grid-line)] rounded-lg bg-white hover:bg-stone-100 font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs rounded-lg bg-[#5B7B94] text-white hover:bg-[#486377] font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.save}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-[var(--ink-primary)] tracking-tight leading-snug">
                  {getLocalizedTitle(memory, language)}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {memory.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs bg-[var(--panel-bg)] text-[var(--ink-secondary)] border border-[var(--grid-line)] rounded-md px-2 py-0.5 font-mono-meta font-medium"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual Memory Hero Image */}
              {memory.media_url && (
                <div className="w-full overflow-hidden border border-[var(--grid-line)] rounded-xl bg-black/5 max-h-[380px] flex items-center justify-center my-1">
                  <img
                    src={memory.media_url}
                    alt={getLocalizedTitle(memory, language)}
                    className="w-full h-auto max-h-[380px] object-contain"
                  />
                </div>
              )}

              <div className="border-t border-b border-dashed border-[var(--border-subtle)] py-4 my-1">
                <p className="text-sm leading-relaxed text-[var(--ink-primary)] whitespace-pre-wrap">
                  {getLocalizedContent(memory, language) || (language === "zh" ? "（暂无详细内容）" : "(No detailed content)")}
                </p>
              </div>

              {/* Evolution Timeline: Multi-Day Progress & Updates */}
              {memory.timeline_logs && memory.timeline_logs.length > 1 && (
                <div className="my-2 p-3.5 bg-stone-50/90 border border-stone-200/90 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 font-mono-meta flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600 inline" />
                      <span>{language === "zh" ? "记忆演进脉络" : "Evolution Timeline"}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono-meta font-medium">
                        {memory.timeline_logs.length} {language === "zh" ? "次沉淀" : "entries"}
                      </span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono-meta">
                      {language === "zh" ? "跨天沉淀 · 持续生长" : "Multi-day evolution"}
                    </span>
                  </div>

                  <div className="relative pl-4 border-l-2 border-emerald-300 flex flex-col gap-3 ml-1.5 my-1">
                    {memory.timeline_logs.map((log, index) => {
                      const logDateStr = new Date(log.timestamp).toLocaleString(localeOf(language));
                      return (
                        <div key={log.id || index} className="relative flex flex-col gap-1">
                          {/* Dot indicator */}
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white shadow-2xs" />

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono-meta font-bold text-stone-600">
                              {logDateStr}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono-meta">
                              #{index + 1}
                            </span>
                          </div>

                          <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                            {log.content}
                          </p>

                          {log.media_url && (
                            <img
                              src={log.media_url}
                              alt="timeline attachment"
                              className="mt-1 h-24 w-auto rounded border border-stone-200 object-cover"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Related Memories Grid */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)] font-mono-meta flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#5B7B94]" />
                    {t.related_memories} ({relatedMemories.length})
                  </h4>
                </div>

                {relatedMemories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {relatedMemories.map((relM) => (
                      <div
                        key={relM.id}
                        onClick={() => setSelectedMemoryId(relM.id)}
                        className="p-2.5 border border-[var(--grid-line)] rounded-xl bg-[var(--panel-bg)]/60 hover:bg-[#5B7B94]/10 cursor-pointer transition-colors"
                      >
                        <span className="text-[10px] font-bold font-mono-meta uppercase text-[var(--ink-secondary)]">
                          {t[`memory_type_${relM.type}` as keyof typeof t] || relM.type}
                        </span>
                        <h5 className="text-xs font-bold text-[var(--ink-primary)] line-clamp-1">
                          {getLocalizedTitle(relM, language)}
                        </h5>
                        <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-1 mt-0.5">
                          {getLocalizedContent(relM, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--ink-secondary)] italic font-mono-meta opacity-60">
                    {t.no_relations}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-[var(--panel-bg)]/60 border-t border-[var(--grid-line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="px-3 py-1 text-xs border border-[var(--grid-line)] rounded-lg bg-[var(--card-white)] text-[var(--ink-primary)] hover:bg-[var(--panel-bg)] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t.edit}
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(language === "zh" ? "确定归档此记忆？" : "Archive this memory?")) {
                  deleteMemory(memory.id);
                  onClose();
                }
              }}
              className="px-2.5 py-1 text-xs border border-[var(--grid-line)] rounded-lg bg-[var(--card-white)] hover:bg-[#C97A63] hover:text-white font-medium flex items-center gap-1 text-[var(--ink-primary)] transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.delete}
            </button>
          </div>

          <span className="text-[10px] font-mono-meta text-[var(--ink-secondary)] opacity-60">
            ID: {memory.id}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
