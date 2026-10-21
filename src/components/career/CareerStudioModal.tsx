"use client";

import React, { useState, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import { CanonicalMemory, getLocalizedTitle, getLocalizedContent } from "@/types/memory";
import {
  X,
  Briefcase,
  Copy,
  Check,
  Download,
  Calendar,
  Sparkles,
  Award,
  FileText,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CareerStudioModalProps {
  onClose: () => void;
}

type ScopeType = "this_week" | "last_14_days" | "this_month" | "all_wins";

export function CareerStudioModal({ onClose }: CareerStudioModalProps) {
  const { memories, language, settings } = useMemory();
  const [activeTab, setActiveTab] = useState<"report" | "resume" | "ledger">("report");
  const [scope, setScope] = useState<ScopeType>("this_week");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedStarId, setExpandedStarId] = useState<string | null>(null);

  // Real Multi-Provider AI Generation states
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiEngineBadge, setAiEngineBadge] = useState<string | null>(null);
  const [aiStarItems, setAiStarItems] = useState<any[] | null>(null);

  // Helper: check if a memory represents a work win / professional accomplishment
  const isWorkRelated = (m: CanonicalMemory): boolean => {
    if (m.type === "achievement") return true;
    const text = `${m.title} ${m.title_zh || ""} ${m.content} ${m.content_zh || ""} ${(m.topics || []).join(" ")}`.toLowerCase();
    const workKeywords = [
      "api", "mcp", "ui", "pr", "commit", "bug", "feat", "上线", "完成", "交付", "重构",
      "优化", "设计", "打通", "接入", "部署", "架构", "测试", "发布", "项目", "胜仗", "工作", "需求", "研发"
    ];
    return workKeywords.some((kw) => text.includes(kw));
  };

  // Filter memories according to selected time scope
  const scopedMemories = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const oneDay = 24 * 3600 * 1000;

    let filtered = memories.filter((m) => m.status !== "deleted");

    if (scope === "all_wins") {
      return filtered.filter(isWorkRelated);
    }

    if (scope === "this_week") {
      const day = now.getDay() || 7; // Monday is 1, Sunday is 7
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);
      filtered = filtered.filter((m) => {
        const t = new Date(m.occurred_at).getTime();
        return t >= monday.getTime();
      });
    } else if (scope === "last_14_days") {
      const threshold = nowTime - 14 * oneDay;
      filtered = filtered.filter((m) => new Date(m.occurred_at).getTime() >= threshold);
    } else if (scope === "this_month") {
      const yearMonth = now.toISOString().slice(0, 7);
      filtered = filtered.filter((m) => m.occurred_at.startsWith(yearMonth));
    }

    return filtered.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [memories, scope]);

  // Work-related subset
  const workMemories = useMemo(() => {
    return scopedMemories.filter(isWorkRelated);
  }, [scopedMemories]);

  // Generate Structured Work Report (周报 / 述职报告)
  const generatedReportText = useMemo(() => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const scopeLabel =
      scope === "this_week"
        ? (language === "zh" ? "本周工作复盘与交付周报" : "Weekly Work & Delivery Report")
        : scope === "this_month"
        ? (language === "zh" ? "本月工作述职与重点里程碑" : "Monthly Accomplishments & Milestones")
        : (language === "zh" ? "近期工作胜仗与关键交付总结" : "Recent Work Wins & Deliverables Summary");

    const items = workMemories.length > 0 ? workMemories : scopedMemories;

    if (items.length === 0) {
      return language === "zh"
        ? `# ${scopeLabel} (${dateStr})\n\n> 暂无符合筛选条件的工作记录。可以在今日记录中点击「STAR 胜仗模版」快速记录一笔！`
        : `# ${scopeLabel} (${dateStr})\n\n> No work entries found for this range. Use the STAR Win template in Today's Journal to log an accomplishment!`;
    }

    // 1. Deliverables
    const deliverables = items.map((m) => {
      const title = getLocalizedTitle(m, language);
      const content = getLocalizedContent(m, language);
      const date = m.occurred_at.slice(0, 10);
      return `- **${title}** (${date})\n  ${content.replace(/\n+/g, " ").slice(0, 120)}...`;
    }).join("\n");

    // 2. Technical breakthroughs
    const breakthroughs = items
      .filter((m) => m.type === "achievement" || m.type === "learning" || m.type === "decision")
      .map((m) =>
        language === "zh"
          ? `- **${getLocalizedTitle(m, language)}**：攻关并沉淀了核心方案，提升模块可用性。`
          : `- **${getLocalizedTitle(m, language)}**: Delivered core architectural solutions and improved component reliability.`
      )
      .join("\n") || (language === "zh" ? "- 保持系统稳定演进，持续优化核心交互与数据流转。" : "- Maintained system stability and continuous stream optimization.");

    // 3. Next steps (from type === 'plan' or upcoming)
    const plans = memories
      .filter((m) => m.type === "plan" && m.status !== "deleted")
      .slice(0, 4)
      .map((m) => `- ${getLocalizedTitle(m, language)}`)
      .join("\n") || (language === "zh" ? "- 持续推进当前已规划项目的二期迭代与用户反馈闭环。" : "- Continue driving current project iterations and user feedback loops.");

    if (language === "zh") {
      return `# ${scopeLabel}
**生成日期**：${dateStr} | **记录样本**：${items.length} 条工作脉冲

---

### 一、 核心交付与重点产出 (Key Deliverables)
${deliverables}

### 二、 技术攻关与难题突破 (Breakthroughs & Solutions)
${breakthroughs}

### 三、 业务收益与量化影响 (Impact & Value)
- **工程效能**：打通核心链路节点，减少重复信息沟通与手动同步成本。
- **功能体验**：完善端到端工作流闭环，大幅提升日常高频操作流畅度。

### 四、 下阶段推进规划 (Next Steps)
${plans}
`;
    } else {
      return `# ${scopeLabel}
**Date**: ${dateStr} | **Sample Size**: ${items.length} work pulses

---

### 1. Key Deliverables & Progress
${deliverables}

### 2. Technical Breakthroughs & Problem Solving
${breakthroughs}

### 3. Business Impact & Measurable Value
- **Engineering Efficiency**: Connected load-bearing workflow nodes and eliminated manual sync friction.
- **User Experience**: Closed end-to-end loops with responsive, low-latency interaction.

### 4. Forward Outlook & Next Steps
${plans}
`;
    }
  }, [scopedMemories, workMemories, scope, language, memories]);

  const [editableReport, setEditableReport] = useState(generatedReportText);

  // Sync editableReport when generatedReportText changes
  React.useEffect(() => {
    setEditableReport(generatedReportText);
  }, [generatedReportText]);

  // Copy handler
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download markdown
  const handleDownload = () => {
    const blob = new Blob([editableReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Dayprint-Work-Report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Real Multi-Provider AI Generation Handler
  const handleRunAIGenerate = async () => {
    const targetMemories = workMemories.length > 0 ? workMemories : scopedMemories;
    if (targetMemories.length === 0) return;
    setIsAIGenerating(true);
    try {
      const res = await fetch("/api/career/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories: targetMemories,
          scope,
          language,
          provider: settings.ai?.provider || "gemini",
          apiKey: settings.ai?.apiKey || "",
          model: settings.ai?.model || "gemini-3.8-flash",
          baseUrl: settings.ai?.baseUrl || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiEngineBadge(data.provider);
        if (data.report) setEditableReport(data.report);
        if (data.star_items?.length) setAiStarItems(data.star_items);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error("AI Generate Error:", e);
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Generate STAR resume items (Prioritize AI-Generated STAR, fallback to local heuristic)
  const starItems = useMemo(() => {
    if (aiStarItems && aiStarItems.length > 0) {
      return aiStarItems.map((item) => ({
        id: item.id,
        title: item.title,
        date: new Date().toISOString().slice(0, 10),
        type: "achievement",
        topics: ["AI 深度提炼", "工作胜仗"],
        resumeBullet: item.polished_bullet,
        star: {
          situation: item.situation,
          action: item.action,
          result: item.result,
        },
      }));
    }

    const list = workMemories.length > 0 ? workMemories : scopedMemories;
    return list.map((m) => {
      const title = getLocalizedTitle(m, language);
      const content = getLocalizedContent(m, language);
      const date = m.occurred_at.slice(0, 10);

      // Extract STAR sections: prioritize AI-extracted m.star, fallback to dynamic regex/heuristics
      const matchS = content.match(/【S[^】]*】([^【]+)/i) || content.match(/\[Situation[^\]]*\]([^\[]+)/i);
      const matchA = content.match(/【A[^】]*】([^【]+)/i) || content.match(/\[Action[^\]]*\]([^\[]+)/i);
      const matchR = content.match(/【R[^】]*】([^【]+)/i) || content.match(/\[Result[^\]]*\]([^\[]+)/i);

      const situation =
        m.star?.situation ||
        (matchS ? matchS[1].trim() : (language === "zh" ? "跨系统协同与信息检索存在割裂与操作摩擦" : "Addressing fragmented workflow and communication friction"));
      const action =
        m.star?.action ||
        (matchA ? matchA[1].trim() : content.replace(/【[^】]+】/g, "").slice(0, 80));
      const result =
        m.star?.result ||
        (matchR ? matchR[1].trim() : (language === "zh" ? "实现端到端闭环交付，关键流程流转效率提升约 40%" : "Delivered end-to-end production solution with ~40% efficiency boost"));

      // Polished Resume Bullet Point (with strong action verb)
      const resumeBullet = language === "zh"
        ? `主导/负责「${title}」：针对${situation}，采取${action.replace(/\n/g, "，")}，最终${result.replace(/\n/g, "，")}。`
        : `Spearheaded "${title}": Addressed ${situation} by executing ${action.replace(/\n/g, ", ")}, successfully achieving ${result.replace(/\n/g, ", ")}.`;

      return {
        id: m.id,
        title,
        date,
        type: m.type,
        topics: m.topics,
        resumeBullet,
        star: {
          situation,
          action,
          result,
        },
      };
    });
  }, [aiStarItems, workMemories, scopedMemories, language]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[var(--card-white)] text-[var(--ink-primary)] rounded-xl border border-[var(--grid-line)] shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--grid-line)] bg-stone-50/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#A66B4E] flex items-center justify-center text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--ink-primary)] tracking-tight">
                  {language === "zh" ? "职场胜仗与报告工作台" : "Career Wins & Report Studio"}
                </h2>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                  BragBook Engine
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)]">
                {language === "zh"
                  ? "从日常碎片与胜仗记录中，一键提炼周报、年终述职及 STAR 简历亮点"
                  : "Turn daily work pulses into polished weekly reports, reviews, and STAR resume bullets"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title={language === "zh" ? "关闭" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Scope Filter & View Mode Tabs */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--grid-line)] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Left: View Mode Tabs */}
          <div className="inline-flex p-0.5 bg-stone-100 rounded-lg border border-stone-200">
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "report"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#A66B4E]" />
              <span>{language === "zh" ? "周报/述职报告" : "Work Report"}</span>
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "resume"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === "zh" ? "简历亮点 & STAR 面试库" : "Resume & STAR Bullets"}</span>
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ledger"
                  ? "bg-white text-[var(--ink-primary)] shadow-xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>{language === "zh" ? "胜仗清单" : "Wins Ledger"} ({workMemories.length})</span>
            </button>
          </div>

          {/* Right: Date Range Scope Selector & AI Deep Generate Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>{language === "zh" ? "范围:" : "Range:"}</span>
              </span>
              <div className="inline-flex rounded-lg border border-stone-200 overflow-hidden">
                {[
                  { id: "this_week", zh: "本周", en: "This Week" },
                  { id: "last_14_days", zh: "近14天", en: "14 Days" },
                  { id: "this_month", zh: "本月", en: "This Month" },
                  { id: "all_wins", zh: "全部胜仗", en: "All Wins" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id as ScopeType)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border-r last:border-r-0 border-stone-200 ${
                      scope === s.id
                        ? "bg-stone-800 text-white font-semibold"
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {language === "zh" ? s.zh : s.en}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Engine Badge */}
            {aiEngineBadge ? (
              <span className="text-[10px] font-mono font-medium px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <Zap className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[140px]">{aiEngineBadge}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded border border-stone-200/60 hidden sm:inline-block">
                {settings.ai?.provider ? settings.ai.provider.toUpperCase() : "GEMINI"}
              </span>
            )}

            {/* AI Deep Generate Trigger */}
            <button
              onClick={handleRunAIGenerate}
              disabled={isAIGenerating || (workMemories.length === 0 && scopedMemories.length === 0)}
              className="px-3 py-1.5 rounded-lg bg-linear-to-r from-amber-600 to-[#C97A63] hover:from-amber-700 hover:to-[#b86953] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title={
                language === "zh"
                  ? "调用配置的大模型（Gemini / OpenAI / Claude / DeepSeek）进行深度述职提炼"
                  : "Call configured LLM for deep performance review distillation"
              }
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === "zh" ? "AI 深度提炼中..." : "Generating..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "✨ AI 一键深度提炼" : "✨ AI Deep Generate"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Main Surface */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--canvas-paper)]">
          {activeTab === "report" && (
            <div className="flex flex-col gap-4">
              {/* Action bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-[var(--ink-secondary)]">
                  {language === "zh"
                    ? "基于选定时段内的所有工作脉冲自动汇总。支持自由二次编辑后一键复制："
                    : "Auto-compiled from your work pulses. Edit directly and copy for Slack, Email, or Lark:"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "下载 Markdown" : "Download .md"}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(editableReport, "report")}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedKey === "report" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === "zh" ? "已复制周报！" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "zh" ? "一键复制周报全文" : "Copy Report"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editable Markdown Area */}
              <div className="bg-white rounded-xl border border-[var(--grid-line)] shadow-xs overflow-hidden">
                <textarea
                  value={editableReport}
                  onChange={(e) => setEditableReport(e.target.value)}
                  rows={16}
                  className="w-full p-4 font-mono text-xs leading-relaxed text-[var(--ink-primary)] bg-transparent resize-y focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "resume" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--ink-secondary)]">
                  {language === "zh"
                    ? "将粗糙的随笔记录提炼为具备商业说服力的简历 Bullet Points 及 STAR 面试案例："
                    : "Transforms rough notes into metric-driven resume bullet points and STAR interview prep:"}
                </p>
                {starItems.length > 0 && (
                  <button
                    onClick={() =>
                      handleCopy(
                        starItems.map((item) => `• ${item.resumeBullet}`).join("\n\n"),
                        "all_bullets"
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    {copiedKey === "all_bullets" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === "zh" ? "全部简历句已复制！" : "All Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "zh" ? "复制全部简历亮点" : "Copy All Bullets"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {starItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-dashed border-stone-300">
                  {language === "zh"
                    ? "暂无工作成就记录。在主页面记灵感时，点击「STAR 胜仗模版」即可快速沉淀！"
                    : "No work accomplishments recorded yet. Click 'STAR Win' in Today's Editor to log one!"}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {starItems.map((item) => {
                    const isExpanded = expandedStarId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-[var(--grid-line)] p-4 shadow-2xs hover:border-stone-400 transition-all flex flex-col gap-2.5"
                      >
                        {/* Title bar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                            <span className="text-sm font-bold text-[var(--ink-primary)] truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono-meta text-stone-500">
                              {item.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(item.resumeBullet, item.id)}
                              className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title={language === "zh" ? "复制这条简历表述" : "Copy resume bullet"}
                            >
                              {copiedKey === item.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedKey === item.id ? (language === "zh" ? "已复制" : "Copied") : (language === "zh" ? "复制简历句" : "Copy Bullet")}</span>
                            </button>

                            <button
                              onClick={() => setExpandedStarId(isExpanded ? null : item.id)}
                              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                              title={isExpanded ? (language === "zh" ? "收起 STAR 案例" : "Collapse STAR breakdown") : (language === "zh" ? "展开 STAR 案例" : "Expand STAR breakdown")}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Resume Bullet Display */}
                        <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs leading-relaxed text-amber-950 font-sans">
                          <span className="font-bold text-amber-900 mr-1.5">{language === "zh" ? "[简历推荐表述]:" : "[Resume Bullet]:"}</span>
                          {item.resumeBullet}
                        </div>

                        {/* Expandable STAR Details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                            <div className="p-2 rounded bg-stone-50 border border-stone-200/70">
                              <span className="font-bold text-stone-700 block mb-1">
                                {language === "zh" ? "S · 业务背景/难点" : "S · Context & Challenge"}
                              </span>
                              <p className="text-stone-600 leading-normal">{item.star.situation}</p>
                            </div>
                            <div className="p-2 rounded bg-stone-50 border border-stone-200/70">
                              <span className="font-bold text-stone-700 block mb-1">
                                {language === "zh" ? "A · 核心行动/方案" : "A · Core Action Taken"}
                              </span>
                              <p className="text-stone-600 leading-normal">{item.star.action}</p>
                            </div>
                            <div className="p-2 rounded bg-stone-50 border border-stone-200/70">
                              <span className="font-bold text-emerald-800 block mb-1">
                                {language === "zh" ? "R · 最终成果/收益" : "R · Result & Impact"}
                              </span>
                              <p className="text-emerald-950 leading-normal">{item.star.result}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "ledger" && (
            <div className="flex flex-col gap-3">
              {/* Educational Concept Header for Wins Ledger */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-700 leading-relaxed">
                  <span className="font-bold text-stone-900">
                    {language === "zh" ? "什么是胜仗清单 (Brag Book)？" : "What is the Wins Ledger (Brag Book)?"}
                  </span>
                  <p className="mt-0.5 text-stone-600 text-[11px]">
                    {language === "zh"
                      ? "源自硅谷工程师著名的 Brag Document 进阶工作法。系统自动从日常记录中捕获所有标记为【工作胜仗】、关键经历与里程碑攻关的碎片，彻底解决在写周报、季度晋升或更新简历时「想不起自己到底做过什么硬核交付」的记忆黑洞。"
                      : "Inspired by Silicon Valley's Brag Document methodology. Dayprint automatically captures all work wins, milestones, and breakthroughs, permanently eliminating the pain of forgetting your high-impact deliverables during reviews."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)]">
                <span>
                  {language === "zh"
                    ? `已累计捕获 ${workMemories.length} 笔工作胜仗与关键经历：`
                    : `${workMemories.length} work wins captured in this period:`}
                </span>
              </div>

              {workMemories.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-dashed border-stone-300">
                  {language === "zh" ? "当前时间范围没有工作胜仗" : "No wins found in this range"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workMemories.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-lg border border-[var(--grid-line)] p-3 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                            {m.type}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono-meta">
                            {m.occurred_at.slice(0, 10)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[var(--ink-primary)] line-clamp-1">
                          {getLocalizedTitle(m, language)}
                        </h4>
                        <p className="text-[11px] text-stone-600 line-clamp-3 mt-1 leading-relaxed">
                          {getLocalizedContent(m, language)}
                        </p>
                      </div>

                      {m.timeline_logs && m.timeline_logs.length > 0 && (
                        <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-1 self-start">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === "zh" ? `已累计演进 ${m.timeline_logs.length} 次` : `${m.timeline_logs.length} evolutions`}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--grid-line)] bg-stone-50 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="text-[11px] flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
            <span>
              {language === "zh"
                ? "提示：随手记下的点滴，随时转化为升职答辩与简历上的硬核成果"
                : "Tip: Daily fragments compound into rock-solid resume bullets and review talking points"}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md font-medium transition-colors cursor-pointer text-xs"
          >
            {language === "zh" ? "完成" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
