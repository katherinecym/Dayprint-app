"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { X, Plus, Network, Check } from "lucide-react";
import { RelationType, getLocalizedTitle, getLocalizedContent, getLocalizedReason } from "@/types/memory";

interface ConnectionModalProps {
  memoryId: string | null;
  onClose: () => void;
}

export function ConnectionModal({ memoryId, onClose }: ConnectionModalProps) {
  const { memories, relationships, addRelationship, deleteRelationship, t, language } = useMemory();

  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("same_topic");
  const [reason, setReason] = useState("");

  if (!memoryId) return null;
  const currentMemory = memories.find((m) => m.id === memoryId);
  if (!currentMemory) return null;

  // Active connections
  const activeLinks = relationships.filter(
    (r) => r.from_memory_id === memoryId || r.to_memory_id === memoryId
  );

  const availableCandidates = memories.filter((m) => m.id !== memoryId);

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    addRelationship({
      from_memory_id: memoryId,
      to_memory_id: targetId,
      type: relationType,
      origin: "manual",
      reason: reason.trim() || (language === "zh" ? "用户手动建立思考连结" : "User manually linked thoughts"),
      status: "confirmed",
    });

    setTargetId("");
    setReason("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[var(--card-white)] border border-[var(--grid-line)] rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--grid-line)] bg-[var(--panel-bg)]/70 text-[var(--ink-primary)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#5B7B94]/15 border border-[#5B7B94]/30 flex items-center justify-center text-[#5B7B94]">
              <Network className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm tracking-tight">{t.explore_connections}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--grid-line)] bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
            title={language === "zh" ? "关闭 (Esc 或点击背景)" : "Close (Esc or click background)"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 font-sans text-sm">
          <div className="p-3 bg-[var(--panel-bg)] boogie-border-solid">
            <span className="text-[10px] font-mono-meta uppercase font-bold text-[var(--ink-secondary)]">
              {language === "zh" ? "当前记忆" : "Current Memory"}
            </span>
            <h4 className="font-bold text-[var(--ink-primary)]">
              {getLocalizedTitle(currentMemory, language)}
            </h4>
            <p className="text-xs text-[var(--ink-secondary)] line-clamp-1 mt-0.5">
              {getLocalizedContent(currentMemory, language)}
            </p>
          </div>

          {/* Established links */}
          <div>
            <h4 className="text-xs font-bold font-mono-meta uppercase text-[var(--ink-secondary)] mb-2">
              {language === "zh" ? "现有连结" : "Existing Connections"} ({activeLinks.length})
            </h4>

            {activeLinks.length === 0 ? (
              <p className="text-xs text-[var(--ink-secondary)] italic font-mono-meta p-2 border border-dashed border-[var(--border-subtle)] opacity-70">
                {t.no_relations}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeLinks.map((link) => {
                  const otherId =
                    link.from_memory_id === memoryId ? link.to_memory_id : link.from_memory_id;
                  const otherMem = memories.find((m) => m.id === otherId);
                  if (!otherMem) return null;

                  return (
                    <div
                      key={link.id}
                      className="p-2.5 boogie-border-solid bg-[var(--panel-bg)] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#F4C94C] boogie-border-solid font-mono-meta font-bold text-[#1F1F1F]">
                            {link.type}
                          </span>
                          <span className="text-xs font-bold text-[var(--ink-primary)]">
                            {getLocalizedTitle(otherMem, language)}
                          </span>
                        </div>
                        {getLocalizedReason(link, language) && (
                          <p className="text-[11px] text-[var(--ink-secondary)] mt-1 italic">
                            &quot;{getLocalizedReason(link, language)}&quot;
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteRelationship(link.id)}
                        className="text-[11px] text-red-600 hover:underline px-2 font-mono-meta"
                      >
                        {language === "zh" ? "解除连结" : "Disconnect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Connection Form */}
          <form
            onSubmit={handleCreateConnection}
            className="mt-2 p-3.5 boogie-border-solid bg-[#3155D9]/10 flex flex-col gap-3"
          >
            <h4 className="text-xs font-bold uppercase font-mono-meta text-[#3155D9] flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t.add_relation}
            </h4>

            <div>
              <label className="text-xs font-semibold text-[var(--ink-primary)] block mb-1">
                {language === "zh" ? "选择关联记忆:" : "Select Memory:"}
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full text-xs p-1.5 bg-[var(--card-white)] text-[var(--ink-primary)] border border-[var(--border-subtle)] font-sans"
              >
                <option value="">
                  {language === "zh" ? "-- 请选择要关联的记忆 --" : "-- Choose a memory to link --"}
                </option>
                {availableCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{t[`memory_type_${m.type}` as keyof typeof t] || m.type}] {getLocalizedTitle(m, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[var(--ink-primary)] block mb-1">
                  {language === "zh" ? "关联类型:" : "Relation Type:"}
                </label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value as RelationType)}
                  className="w-full text-xs p-1.5 bg-[var(--card-white)] text-[var(--ink-primary)] border border-[var(--border-subtle)]"
                >
                  <option value="same_topic">
                    {language === "zh" ? "同主题 (Same Topic)" : "Same Topic"}
                  </option>
                  <option value="same_project">
                    {language === "zh" ? "同项目 (Same Project)" : "Same Project"}
                  </option>
                  <option value="semantic_similarity">
                    {language === "zh" ? "语义相似 (Semantic Similarity)" : "Semantic Similarity"}
                  </option>
                  <option value="temporal_sequence">
                    {language === "zh" ? "时序承接 (Temporal Sequence)" : "Temporal Sequence"}
                  </option>
                  <option value="decision_outcome">
                    {language === "zh" ? "决策与结果 (Decision & Outcome)" : "Decision & Outcome"}
                  </option>
                  <option value="user_linked">
                    {language === "zh" ? "直接连结 (Direct Link)" : "Direct Link"}
                  </option>
                </select>
              </div>

              <div className="flex-2">
                <label className="text-xs font-semibold text-[var(--ink-primary)] block mb-1">
                  {language === "zh" ? "关联原因 / 逻辑:" : "Reason / Rationale:"}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    language === "zh"
                      ? "它们之间有何关联或因果？"
                      : "Why are they related?"
                  }
                  className="w-full text-xs p-1.5 bg-[var(--card-white)] text-[var(--ink-primary)] border border-[var(--border-subtle)] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!targetId}
              className="mt-1 px-4 py-2 bg-[#5B7B94] text-white text-xs font-medium rounded-lg hover:bg-[#486377] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {language === "zh" ? "建立思考连结" : "Establish Connection"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
