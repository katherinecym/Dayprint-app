"use client";

import React, { useState, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  X,
  Network,
  BookOpen,
  Cpu,
  FileText,
  Link2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Check,
  Tag,
  Filter,
  Brain,
} from "lucide-react";
import {
  buildKnowledgeGraph,
  compileLLMWiki,
  autoCompileGraphRelationships,
} from "@/lib/graph-engineering";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface ConstellationModalProps {
  onClose: () => void;
}

export function ConstellationModal({ onClose }: ConstellationModalProps) {
  const {
    memories,
    relationships,
    bulkAddRelationships,
    setSelectedMemoryId,
    language,
    t,
  } = useMemory();

  // Active view: Graph Engineering Canvas or LLM Personal Wiki
  const [activeTab, setActiveTab] = useState<"graph" | "wiki">("graph");

  // Graph state
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [compilerFeedback, setCompilerFeedback] = useState<string | null>(null);

  // Wiki state
  const [selectedWikiTopic, setSelectedWikiTopic] = useState<string | null>(null);

  // Build the graph representation
  const graph = useMemo(() => {
    return buildKnowledgeGraph(memories, relationships, language);
  }, [memories, relationships, language]);

  // Compile LLM Wiki articles
  const wikiArticles = useMemo(() => {
    return compileLLMWiki(memories, relationships, language);
  }, [memories, relationships, language]);

  // Default selected wiki topic to first topic
  const currentWikiArticle = useMemo(() => {
    if (wikiArticles.length === 0) return null;
    if (selectedWikiTopic) {
      return (
        wikiArticles.find(
          (a) => a.topic.toLowerCase() === selectedWikiTopic.toLowerCase()
        ) || wikiArticles[0]
      );
    }
    return wikiArticles[0];
  }, [wikiArticles, selectedWikiTopic]);

  // Filter memories for graph view
  const filteredNodes = useMemo(() => {
    if (!activeTopic) return graph.nodes;
    return graph.nodes.filter((n) =>
      n.topics.some((t) => t.toLowerCase() === activeTopic.toLowerCase())
    );
  }, [graph.nodes, activeTopic]);

  // All unique topics
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => m.topics.forEach((t) => set.add(t.toLowerCase())));
    return Array.from(set);
  }, [memories]);

  // Inspector selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph.nodes, selectedNodeId]);

  // Neighbor nodes connected to the selected node
  const neighborNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const connectedIds = new Set<string>();
    graph.edges.forEach((e) => {
      if (e.from === selectedNodeId) connectedIds.add(e.to);
      if (e.to === selectedNodeId) connectedIds.add(e.from);
    });
    return graph.nodes.filter((n) => connectedIds.has(n.id));
  }, [graph.nodes, graph.edges, selectedNodeId]);

  // Run Graph Engineering Auto-Compiler
  const handleRunCompiler = () => {
    const updatedRels = autoCompileGraphRelationships(memories, relationships, language);
    const addedCount = updatedRels.length - relationships.length;

    bulkAddRelationships(updatedRels);

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#1D45B8", "#DD2E1E", "#F7C928", "#111111"],
    });

    const msg =
      addedCount > 0
        ? language === "zh"
          ? `图谱编译完成！成功发现并构建了 ${addedCount} 条新的语义与因果关联。`
          : `Graph compiled! Discovered and built ${addedCount} new relational edges.`
        : language === "zh"
        ? "图谱已是最优状态，所有概念与时间轴已完全关联！"
        : "Knowledge graph is up to date! All concepts are fully linked.";

    setCompilerFeedback(msg);
    setTimeout(() => setCompilerFeedback(null), 3500);
  };

  const typeColorMap: Record<string, string> = {
    idea: "#C97A63",
    learning: "#5B7B94",
    moment: "#C49A56",
    decision: "#7C6F93",
    plan: "#608066",
    collection: "#5A7D8F",
    receipt: "#292524",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-900/60 backdrop-blur-xs select-none overflow-hidden">
      <div className="w-full max-w-6xl bg-[var(--canvas-paper)] rounded-2xl border border-stone-200 shadow-2xl flex flex-col h-[90vh] overflow-hidden font-sans">
        {/* 1. Header Toolbar */}
        <header className="px-5 py-3.5 bg-stone-900 text-stone-100 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-stone-800 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9483B] inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B7B94] inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] inline-block" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-[#E5A93C]" />
                <span>
                  {language === "zh"
                    ? "知识图谱工程 & 记忆中枢"
                    : "Knowledge Graph & Memory Hub"}
                </span>
              </h2>
              <p className="text-[11px] text-stone-400 flex items-center gap-2 font-mono">
                <span>
                  {memories.length} {language === "zh" ? "记忆节点" : "Nodes"}
                </span>
                <span>•</span>
                <span>
                  {relationships.length} {language === "zh" ? "关联边" : "Edges"}
                </span>
                <span>•</span>
                <span>
                  {wikiArticles.length} {language === "zh" ? "中枢档案" : "Hub Dossiers"}
                </span>
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg border border-stone-700/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "graph"
                  ? "bg-white text-stone-900 shadow-xs font-semibold"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "知识图谱工程" : "Graph Engineering"}</span>
            </button>

            <button
              onClick={() => setActiveTab("wiki")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "wiki"
                  ? "bg-white text-stone-900 shadow-xs font-semibold"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "记忆中枢档案" : "Memory Hub Dossiers"}</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 2. Sub-Toolbar: Graph Engineering Compiler & Actions */}
        <div className="px-5 py-2.5 bg-white/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCompiler}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B7B94] text-white font-medium rounded-lg hover:bg-[#4a657a] transition-colors shadow-xs"
              title={
                language === "zh"
                  ? "自动挖掘潜在关联与因果链"
                  : "Discover latent semantic and causal links"
              }
            >
              <Cpu className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>
                {language === "zh" ? "图谱关联自编译" : "Compile Graph Relations"}
              </span>
            </button>

            {compilerFeedback && (
              <span className="text-[11px] font-medium text-[#5B7B94] bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                {compilerFeedback}
              </span>
            )}
          </div>

          {activeTab === "graph" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-lg py-0.5">
              <span className="text-stone-500 font-medium shrink-0 text-[10px]">
                FILTER:
              </span>
              <button
                onClick={() => setActiveTopic(null)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                  activeTopic === null
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                }`}
              >
                ALL
              </button>
              {allTopics.slice(0, 8).map((topic) => (
                <button
                  key={topic}
                  onClick={() =>
                    setActiveTopic(activeTopic === topic ? null : topic)
                  }
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border shrink-0 transition-colors ${
                    activeTopic === topic
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  #{topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Main Workspace Area */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative bg-[#FAF7F0]">
          {/* TAB 1: KNOWLEDGE GRAPH ENGINEERING CANVAS */}
          {activeTab === "graph" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* Visual Interactive Graph Node Grid / Map */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto relative bg-[var(--canvas-paper)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const nodeBg = typeColorMap[node.type] || "#5B7B94";

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "ring-2 ring-stone-900 bg-white shadow-sm border-stone-900"
                            : "bg-white border-stone-200/80 hover:border-stone-400 hover:shadow-xs"
                        }`}
                      >
                        <div>
                          {/* Node Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              style={{ backgroundColor: nodeBg }}
                              className="text-[10px] font-medium text-white uppercase px-2 py-0.5 rounded-md"
                            >
                              {node.type}
                            </span>

                            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                              <Link2 className="w-2.5 h-2.5 text-[#5B7B94]" />
                              <span>
                                {node.connectionsCount} {language === "zh" ? "关联" : "links"}
                              </span>
                            </span>
                          </div>

                          {/* Node Title */}
                          <h4 className="text-xs font-semibold text-stone-900 line-clamp-2 leading-snug">
                            {node.title}
                          </h4>

                          {/* Node Content */}
                          {node.content && (
                            <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                              {node.content}
                            </p>
                          )}

                          {/* Image preview thumbnail if present */}
                          {node.media_url && (
                            <div className="mt-2 h-14 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                              <img
                                src={node.media_url}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {/* Topics */}
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                          <div className="flex flex-wrap gap-1">
                            {node.topics.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <span className="text-stone-400 font-mono">
                            {node.occurred_at.slice(5, 10)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Node Inspector Drawer */}
              <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-stone-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 font-sans">
                {selectedNode ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                        {language === "zh"
                          ? "节点详情与衍生"
                          : "Node Inspector"}
                      </span>
                      <button
                        onClick={() => setSelectedNodeId(null)}
                        className="text-xs text-stone-500 hover:text-stone-900 underline"
                      >
                        {language === "zh" ? "清空选择" : "Clear"}
                      </button>
                    </div>

                    <div>
                      <span
                        style={{
                          backgroundColor:
                            typeColorMap[selectedNode.type] || "#5B7B94",
                        }}
                        className="text-[10px] font-medium text-white uppercase px-2 py-0.5 rounded-md inline-block mb-1.5"
                      >
                        {selectedNode.type}
                      </span>
                      <h3 className="text-sm font-semibold text-stone-900 leading-snug">
                        {selectedNode.title}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                        {selectedNode.occurred_at.slice(0, 10)}
                      </p>
                    </div>

                    {selectedNode.content && (
                      <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                        {selectedNode.content}
                      </p>
                    )}

                    {selectedNode.media_url && (
                      <div className="rounded-lg border border-stone-200 overflow-hidden max-h-36">
                        <img
                          src={selectedNode.media_url}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Connected Neighbor Nodes */}
                    <div className="pt-2.5 border-t border-stone-200">
                      <h4 className="text-xs font-semibold text-stone-800 mb-2 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#5B7B94]" />
                        <span>
                          {language === "zh"
                            ? `直接关联节点 (${neighborNodes.length})`
                            : `Direct Connections (${neighborNodes.length})`}
                        </span>
                      </h4>

                      {neighborNodes.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">
                          {language === "zh"
                            ? "暂无直接关联，可点击上方「一键图谱自编译」自动挖掘。"
                            : "No direct links yet. Click 'Compile Graph Relations' above to discover links."}
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {neighborNodes.map((neigh) => (
                            <div
                              key={neigh.id}
                              onClick={() => setSelectedNodeId(neigh.id)}
                              className="p-2 rounded-lg border border-stone-200 hover:border-stone-400 bg-stone-50/50 cursor-pointer text-xs group transition-colors"
                            >
                              <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                                <span className="uppercase font-medium">
                                  {neigh.type}
                                </span>
                                <span className="font-mono">{neigh.occurred_at.slice(5, 10)}</span>
                              </div>
                              <p className="text-xs font-medium text-stone-800 group-hover:text-[#5B7B94] truncate">
                                {neigh.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMemoryId(selectedNode.id);
                        onClose();
                      }}
                      className="w-full mt-2 px-3 py-2 bg-[#E5A93C] text-stone-900 font-medium text-xs rounded-xl hover:bg-[#d89b2b] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {language === "zh" ? "在主画布中定位该卡片" : "Open Card on Canvas"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-4">
                    <Network className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="text-xs font-medium text-stone-600">
                      {language === "zh" ? "点击左侧任意节点" : "Select any node on the left"}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                      {language === "zh"
                        ? "即可查看该节点的连接脉络、因果衍生与直接邻居"
                        : "View connection threads, causal links, and direct neighbors"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL MEMORY HUB DOSSIER */}
          {activeTab === "wiki" && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Concept / Topic Index Directory */}
              <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-stone-200 p-3.5 flex flex-col gap-2.5 overflow-y-auto shrink-0 font-sans">
                <div className="pb-2 border-b border-stone-200 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#5B7B94]" />
                    <span>TOPICS ({wikiArticles.length})</span>
                  </span>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200 font-mono">
                    AI Compiled
                  </span>
                </div>

                <div className="space-y-1.5 overflow-y-auto flex-1">
                  {wikiArticles.map((art) => {
                    const isSelected =
                      currentWikiArticle?.topic.toLowerCase() ===
                      art.topic.toLowerCase();

                    return (
                      <button
                        key={art.topic}
                        onClick={() => setSelectedWikiTopic(art.topic)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                            : "bg-stone-50/60 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-white"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold block">#{art.topic}</span>
                          <span className={`text-[10px] font-mono mt-0.5 block ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                            {art.memory_ids.length} {language === "zh" ? "记忆节点" : "nodes"}
                          </span>
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-stone-400"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Compiled Memory Hub Dossier */}
              <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-[var(--canvas-paper)] font-sans">
                {currentWikiArticle ? (
                  <div className="max-w-3xl mx-auto space-y-6">
                    {/* Article Masthead */}
                    <div className="border-b border-stone-200 pb-4">
                      <div className="flex items-center gap-2 text-xs text-[#5B7B94] font-medium uppercase tracking-wide">
                        <FileText className="w-3.5 h-3.5 text-[#D9483B]" />
                        <span>PERSONAL MEMORY HUB DOSSIER</span>
                        <span>•</span>
                        <span className="font-mono">
                          {currentWikiArticle.memory_ids.length} FRAGMENTS
                        </span>
                      </div>

                      <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1.5">
                        #{currentWikiArticle.title}
                      </h1>
                      <p className="text-xs text-stone-500 mt-1">
                        {language === "zh"
                          ? "由 Dayprint 知识图谱引擎根据你的全部历史记录自动编译"
                          : "Auto-compiled by the Dayprint knowledge engine from all historical memories"}
                      </p>
                    </div>

                    {/* Section 1: AI Synthesized Narrative Summary */}
                    <div className="p-4 sm:p-5 bg-white border border-stone-200 rounded-xl shadow-xs">
                      <h3 className="text-xs font-semibold uppercase text-stone-700 tracking-wider mb-2 flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-[#5B7B94]" />
                        <span>
                          {language === "zh"
                            ? "智能综合综述 (Synthesis)"
                            : "Narrative Synthesis"}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                        {currentWikiArticle.summary}
                      </p>
                    </div>

                    {/* Section 2: Key Insights & Decisions */}
                    {currentWikiArticle.key_insights.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-semibold uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {language === "zh"
                              ? "核心洞见与认知沉淀 (Key Insights)"
                              : "Key Insights & Distillation"}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {currentWikiArticle.key_insights.map((ins, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 leading-relaxed flex items-start gap-2.5 shadow-xs"
                            >
                              <span className="text-[11px] font-mono text-stone-400 mt-0.5">
                                {String(i + 1).padStart(2, "0")}.
                              </span>
                              <span>{ins}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Evolution Timeline */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D9483B]" />
                        <span>
                          {language === "zh"
                            ? "思想演进编年史 (Evolution Timeline)"
                            : "Evolution Timeline"}
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {currentWikiArticle.timeline.map((item, idx) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedMemoryId(item.id);
                              onClose();
                            }}
                            className="p-3.5 bg-white border border-stone-200 hover:border-stone-400 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 shadow-xs group"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-stone-100 rounded text-stone-700 border border-stone-200">
                                  {item.type}
                                </span>
                                <span className="text-[11px] text-stone-400 font-mono">
                                  {item.date}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-stone-900 group-hover:text-[#5B7B94] transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                                {item.snippet}
                              </p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 shrink-0 mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Open Loops */}
                    {currentWikiArticle.open_loops.length > 0 && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
                        <h4 className="font-semibold text-amber-900 mb-1.5 flex items-center gap-1">
                          <span>
                            {language === "zh"
                              ? "未决议题与待办计划 (Open Loops)"
                              : "Open Loops & Pending Plans"}
                          </span>
                        </h4>
                        <ul className="list-disc pl-4 space-y-1 text-stone-800">
                          {currentWikiArticle.open_loops.map((ol, i) => (
                            <li key={i}>{ol}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section 5: Cross-Referenced Wiki Concepts */}
                    {currentWikiArticle.related_topics.length > 0 && (
                      <div className="pt-3 border-t border-stone-200">
                        <span className="text-[11px] font-semibold uppercase text-stone-500 tracking-wider block mb-2">
                          {language === "zh"
                            ? "交叉引用的概念条目 (Related Concepts):"
                            : "Related Concepts & Cross-References:"}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {currentWikiArticle.related_topics.map((relTop) => (
                            <button
                              key={relTop}
                              onClick={() => setSelectedWikiTopic(relTop)}
                              className="px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg bg-white hover:border-stone-400 hover:bg-stone-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <span>#{relTop}</span>
                              <ArrowRight className="w-3 h-3 text-stone-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-stone-400">
                    <p className="text-xs">
                      {language === "zh"
                        ? "暂无记忆中枢档案。请在左侧选择主题，或添加更多记忆碎片。"
                        : "No memory hub dossiers yet. Select a topic on the left or add more memory fragments."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
