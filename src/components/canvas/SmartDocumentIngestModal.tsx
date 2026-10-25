"use client";

import React, { useState, useRef } from "react";
import { useMemory } from "@/lib/memory-context";
import { X, Sparkles, FileText, Link as LinkIcon, Upload, Check, Loader2, ArrowRight, BookOpen, Layers, ShieldCheck, Tag, Lightbulb } from "lucide-react";
import { MemoryType, MemoryLevel } from "@/types/memory";
import confetti from "canvas-confetti";
import { playKeyClick, playWaxStampSound } from "@/lib/sound";

interface ExtractedCard {
  title: string;
  content: string;
  type: string;
  level: "L1" | "L2" | "L3" | "L4";
  topics: string[];
  rationale?: string;
  selected?: boolean;
}

interface SmartDocumentIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartDocumentIngestModal({ isOpen, onClose }: SmartDocumentIngestModalProps) {
  const { addMemory, addRelationship, language } = useMemory();

  const [activeTab, setActiveTab] = useState<"paste" | "link" | "file">("paste");
  const [pasteText, setPasteText] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewName, setFilePreviewName] = useState("");

  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted preview cards
  const [extractedCards, setExtractedCards] = useState<ExtractedCard[]>([]);
  const [autoLink, setAutoLink] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Quick Sample Text
  const loadSample = (type: "feishu" | "book" | "belief") => {
    playKeyClick();
    if (type === "feishu") {
      setPasteText(
        `# AetherOS 认知系统与数据架构演进\n\n1. 核心架构认知：所有个人数据必须坚持 Local First 与白盒存储，以 GitHub 和 Markdown 为基石，云端只做只读同步与通知通道，绝不将核心认知托付给商业 SaaS 黑盒。\n\n2. 精力分配策略：高阶精力应当聚焦在有复利沉淀的架构与深度创造上，主动切断无意义的虚假社交和低密度信息流。\n\n3. 技术选型验证：选用任何开源框架前，必须查看 GitHub 最近半年的活跃度和社区 PR 处理时效，并在本地进行全量压测，不被商业宣传左右。`
      );
    } else if (type === "book") {
      setPasteText(
        `《固定收益证券与利率模型》精要笔记：\n\n- 债券价格与到期收益率（YTM）呈反向凸性曲线，久期（Duration）衡量了价格对利率敏感度的一阶导数，而凸性（Convexity）则是二阶导数微调。\n- 在利率高波动周期中，高凸性资产具有天然的非对称收益保护特性。\n- 投资策略推论：在降息周期初期，拉长组合久期是捕捉资本利得的核心杠杆。`
      );
    } else {
      setPasteText(
        `原则：永远保持独立思考，对任何所谓的“行业权威”观点保留第一性原理推导的习惯。\n心智模型：逆向思维（Inversion），在做产品决策前，先列出所有会导致这个产品失败的致命原因，然后逐一避免。\n习惯：每次深度阅读后，立即用 3 句话写下可以落地的行为改变或推论，否则等于没有读过。`
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreviewName(file.name);
      setErrorMsg(null);
    }
  };

  // Perform Extraction Call
  const handleExtract = async () => {
    setErrorMsg(null);
    setIsExtracting(true);
    playKeyClick();

    try {
      let res: Response;

      if (activeTab === "file") {
        if (!selectedFile) {
          setErrorMsg(language === "zh" ? "请先选择需要解析的文件 (.md, .docx, .txt)" : "Please select a file first");
          setIsExtracting(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", selectedFile);
        res = await fetch("/api/memory/extract-doc", {
          method: "POST",
          body: fd,
        });
      } else if (activeTab === "link") {
        if (!docUrl.trim()) {
          setErrorMsg(language === "zh" ? "请输入文档或网页链接" : "Please enter a doc or webpage URL");
          setIsExtracting(false);
          return;
        }
        res = await fetch("/api/memory/extract-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: docUrl.trim() }),
        });
      } else {
        if (!pasteText.trim()) {
          setErrorMsg(language === "zh" ? "请先粘贴笔记或文档文字" : "Please paste notes text first");
          setIsExtracting(false);
          return;
        }
        res = await fetch("/api/memory/extract-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pasteText.trim() }),
        });
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || (language === "zh" ? "提取失败，请检查输入或改用直接粘贴" : "Extraction failed"));
        setIsExtracting(false);
        return;
      }

      if (Array.isArray(data.cards) && data.cards.length > 0) {
        setExtractedCards(data.cards.map((c: ExtractedCard) => ({ ...c, selected: true })));
      } else {
        setErrorMsg(language === "zh" ? "未能萃取出有效记忆卡片，请提供更多实质性内容" : "No memories could be distilled");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || (language === "zh" ? "网络异常，请重试" : "Network error"));
    } finally {
      setIsExtracting(false);
    }
  };

  // Toggle Card Selection
  const toggleSelectCard = (index: number) => {
    setExtractedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  // Batch Ingest Memories into Dayprint
  const handleBatchIngest = () => {
    const selected = extractedCards.filter((c) => c.selected);
    if (selected.length === 0) return;

    setIsImporting(true);
    playWaxStampSound();

    const createdIds: string[] = [];
    const now = new Date().toISOString();

    selected.forEach((card) => {
      const memId = `mem_ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      createdIds.push(memId);

      addMemory({
        id: memId,
        title_zh: card.title,
        title_en: card.title,
        content_zh: card.content,
        content_en: card.content,
        type: (card.type as MemoryType) || "insight",
        topics: card.topics && card.topics.length > 0 ? card.topics : ["doc_import"],
        occurred_at: now,
        recorded_at: now,
        updated_at: now,
        language: "zh",
        memory_level: card.level as MemoryLevel,
        provenance: {
          capture_method: "quick_add",
          ai_generated: true,
          source: activeTab === "file" ? filePreviewName : activeTab === "link" ? docUrl : "pasted_notes",
        },
      });
    });

    // Auto-create relationships among extracted cards if enabled
    if (autoLink && createdIds.length > 1) {
      for (let i = 0; i < createdIds.length - 1; i++) {
        addRelationship({
          from_memory_id: createdIds[i],
          to_memory_id: createdIds[i + 1],
          type: "same_project",
          origin: "ai_suggested",
          reason: language === "zh" ? "提取自同一篇文档/笔记" : "Extracted from the same document / note",
          reason_zh: "提取自同一篇文档/笔记",
          reason_en: "Extracted from the same document / note",
          status: "confirmed",
        });
      }
    }

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });
    setIsImporting(false);
    onClose();
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "L4":
        return { label: language === "zh" ? "核心原则 • 底层信念" : "Core Principles", bg: "bg-[#7C6F93]/15 text-[#7C6F93] border-[#7C6F93]/30" };
      case "L3":
        return { label: language === "zh" ? "心智模型 • 思考框架" : "Mental Models", bg: "bg-[#52575E]/15 text-[#52575E] border-[#52575E]/30" };
      case "L2":
        return { label: language === "zh" ? "习惯准则 • 技术SOP" : "Habits & SOPs", bg: "bg-[#5B7B94]/15 text-[#5B7B94] border-[#5B7B94]/30" };
      default:
        return { label: language === "zh" ? "关键经历 • 里程碑" : "Key Events", bg: "bg-[#C97A63]/15 text-[#C97A63] border-[#C97A63]/30" };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#D97A60]/15 flex items-center justify-center text-[#D97A60]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight">
                {language === "zh" ? "智能笔记录入与文档萃取" : "Smart Note & Document Ingestion"}
              </h3>
              <p className="text-xs text-stone-500">
                {language === "zh"
                  ? "支持飞书、Google Doc、Word (.docx)、Markdown 或长篇笔记，AI 自动切片为 L1~L4 认知金字塔记忆"
                  : "Parse Feishu, Google Docs, Word, Markdown or long notes into cognitive pyramid memories"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {extractedCards.length === 0 ? (
            <>
              {/* Step 1: Input source tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                <button
                  onClick={() => {
                    setActiveTab("paste");
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === "paste"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-200/60"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "粘贴笔记全文" : "Paste Text"}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("link");
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === "link"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-200/60"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "飞书 / Google Doc 链接" : "Doc Link"}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("file");
                    setErrorMsg(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === "file"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-200/60"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "本地文件 (.md / .docx / .txt)" : "Local File"}</span>
                </button>
              </div>

              {/* Tab 1: Paste Text */}
              {activeTab === "paste" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{language === "zh" ? "在此直接粘贴你的任意笔记或文档内容：" : "Paste notes or document text:"}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-400">{language === "zh" ? "填入示例:" : "Sample:"}</span>
                      <button
                        type="button"
                        onClick={() => loadSample("feishu")}
                        className="text-[11px] text-stone-700 bg-stone-200/70 hover:bg-stone-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {language === "zh" ? "飞书复盘" : "Feishu"}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadSample("book")}
                        className="text-[11px] text-stone-700 bg-stone-200/70 hover:bg-stone-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {language === "zh" ? "读书精要" : "Book"}
                      </button>
                      <button
                        type="button"
                        onClick={() => loadSample("belief")}
                        className="text-[11px] text-stone-700 bg-stone-200/70 hover:bg-stone-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {language === "zh" ? "原则心智" : "Beliefs"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={
                      language === "zh"
                        ? "支持粘贴任何长文、会议记录、思考随笔、读书笔记...\nAI 会自动过滤套话，拆解为 L1~L4 结构化卡片与原子知识连结。"
                        : "Paste any long notes, meeting minutes, thoughts or book summaries here..."
                    }
                    className="w-full p-3.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400 font-sans leading-relaxed text-stone-800 placeholder:text-stone-400 resize-y"
                  />
                </div>
              )}

              {/* Tab 2: Doc Link */}
              {activeTab === "link" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {language === "zh" ? "文档或网页链接 (URL)" : "Document or Web URL"}
                    </label>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder={language === "zh" ? "https://xxx.feishu.cn/docx/... 或 https://docs.google.com/document/d/..." : "https://docs.google.com/document/d/... or https://xxx.feishu.cn/docx/..."}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-stone-500 text-stone-800"
                    />
                  </div>

                  {/* Tips box */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>{language === "zh" ? "文档读取与隐私建议" : "Privacy & Permissions Note"}</span>
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {language === "zh"
                        ? "• 飞书文档：已绑定专属企业应用 Token 自动读取；若文档属于受限私密空间，最便捷的方式是在飞书直接 Cmd+A 全选并粘贴到「粘贴笔记」标签页。"
                        : "• Feishu: Automatically read via enterprise bot. For private spaces, simply copy & paste text directly."}
                    </p>
                    <p className="leading-relaxed opacity-90">
                      {language === "zh"
                        ? "• Google Doc：请确保分享设置设置为【任何拥有链接的人均可查看】。"
                        : "• Google Docs: Please ensure share settings allow anyone with the link to view."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Local File */}
              {activeTab === "file" && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown,.docx,.txt,.csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-stone-500 bg-white hover:bg-stone-50/60 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer text-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-1">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-stone-800">
                      {filePreviewName
                        ? `${language === "zh" ? "已选择文件：" : "Selected:"} ${filePreviewName}`
                        : language === "zh"
                        ? "点击或拖拽文件至此处"
                        : "Click or drag file here"}
                    </div>
                    <div className="text-xs text-stone-400">
                      {language === "zh"
                        ? "支持 Markdown (.md)、Word (.docx)、纯文本 (.txt)"
                        : "Supports Markdown (.md), Word (.docx), Plain text (.txt)"}
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
                  <span>{errorMsg}</span>
                  <button
                    onClick={() => setActiveTab("paste")}
                    className="font-medium underline cursor-pointer ml-2"
                  >
                    {language === "zh" ? "切换至手动粘贴" : "Switch to Paste"}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Step 2: Extracted Cards Review & Refinement */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-800">
                    {language === "zh" ? `已智能萃取出 ${extractedCards.length} 张原子记忆卡片：` : `Distilled ${extractedCards.length} memory cards:`}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    ({extractedCards.filter((c) => c.selected).length}/{extractedCards.length} {language === "zh" ? "已勾选" : "selected"})
                  </span>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLink}
                    onChange={(e) => setAutoLink(e.target.checked)}
                    className="rounded border-stone-300 text-stone-800 focus:ring-0 cursor-pointer"
                  />
                  <span>{language === "zh" ? "自动连结这批记忆 (网状脉络)" : "Auto-link these memories"}</span>
                </label>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {extractedCards.map((card, idx) => {
                  const badge = getLevelBadge(card.level);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectCard(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        card.selected
                          ? "bg-white border-stone-400 shadow-sm"
                          : "bg-stone-100/60 border-stone-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={card.selected}
                            onChange={() => toggleSelectCard(idx)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-stone-300 text-stone-800 focus:ring-0 cursor-pointer mt-0.5"
                          />
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            #{card.type}
                          </span>
                          {card.topics?.slice(0, 3).map((t, ti) => (
                            <span key={ti} className="text-[10px] text-stone-400">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-stone-900 mb-1 leading-snug">
                        {card.title}
                      </h4>

                      {/* Content */}
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        {card.content}
                      </p>

                      {card.rationale && (
                        <div className="mt-2 text-[10px] text-stone-400 italic flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-stone-400 shrink-0 inline" />
                          <span>{card.rationale}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 bg-white/70 flex items-center justify-between">
          {extractedCards.length === 0 ? (
            <>
              <div className="text-xs text-stone-400">
                {language === "zh" ? "按认知金字塔自动分级 • 无缝生成知识图谱" : "Cognitive Pyramid • Graph Ready"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-300" />
                      <span>{language === "zh" ? "AI 正在阅读与提炼..." : "Extracting..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{language === "zh" ? "开始智能萃取" : "Extract Memories"}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setExtractedCards([])}
                className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                {language === "zh" ? "← 重新输入或解析其他文档" : "← Re-input / Parse Another"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleBatchIngest}
                  disabled={isImporting || extractedCards.filter((c) => c.selected).length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D45B8] text-white text-xs font-bold rounded-xl hover:bg-[#163691] disabled:opacity-50 cursor-pointer shadow-sm transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>
                    {language === "zh"
                      ? `一键批量录入 (${extractedCards.filter((c) => c.selected).length})`
                      : `Ingest Selected (${extractedCards.filter((c) => c.selected).length})`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
