"use client";

import React, { useState, useMemo } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  Network,
  BookOpen,
  Cpu,
  FileText,
  Link2,
  Calendar,
  ArrowRight,
  ExternalLink,
  Plus,
  Layers,
  Brain,
  Share2,
  LayoutGrid,
} from "lucide-react";
import {
  buildKnowledgeGraph,
  compileLLMWiki,
  autoCompileGraphRelationships,
} from "@/lib/graph-engineering";
import confetti from "canvas-confetti";
import { MEMORY_LEVELS_META, getMemoryLevel, MemoryLevel, getLocalizedTitle, getLocalizedContent } from "@/types/memory";
import { ForceGraphCanvas } from "./ForceGraphCanvas";

export function GraphNodesView() {
  const {
    memories,
    relationships,
    bulkAddRelationships,
    setSelectedMemoryId,
    setConnectionModalMemoryId,
    language,
    t,
  } = useMemory();

  // Active view tab: Graph Nodes vs LLM Wiki
  const [activeTab, setActiveTab] = useState<"graph" | "wiki">("graph");

  // Display mode: interactive force graph network vs card grid
  const [graphDisplayMode, setGraphDisplayMode] = useState<"force" | "cards">("force");

  // Filter state
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeLevelFilter, setActiveLevelFilter] = useState<MemoryLevel | "ALL">("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [compilerFeedback, setCompilerFeedback] = useState<string | null>(null);
  const [selectedWikiTopic, setSelectedWikiTopic] = useState<string | null>(null);

  // Build the graph representation
  const graph = useMemo(() => {
    return buildKnowledgeGraph(memories, relationships, language);
  }, [memories, relationships, language]);

  // Compile LLM Wiki articles
  const wikiArticles = useMemo(() => {
    return compileLLMWiki(memories, relationships, language);
  }, [memories, relationships, language]);

  // Current Wiki article
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

  // Filter memories for graph view & cards view
  const filteredNodes = useMemo(() => {
    let nodes = graph.nodes;
    if (activeTopic) {
      nodes = nodes.filter((n) =>
        n.topics.some((t) => t.toLowerCase() === activeTopic.toLowerCase())
      );
    }
    if (activeLevelFilter !== "ALL") {
      nodes = nodes.filter((n) => {
        const memObj = memories.find((m) => m.id === n.id);
        const lvl = memObj ? getMemoryLevel(memObj) : "L0";
        return lvl === activeLevelFilter;
      });
    }
    return nodes;
  }, [graph.nodes, activeTopic, activeLevelFilter, memories]);

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
      particleCount: 45,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#C97A63", "#5B7B94", "#C49A56", "#608066", "#7C6F93"],
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

  // Morandi Mineral palette for node types
  const typeColorMap: Record<string, string> = {
    idea: "#C97A63",
    learning: "#5B7B94",
    moment: "#C49A56",
    decision: "#475569",
    plan: "#608066",
    collection: "#7C6F93",
    receipt: "#2B2420",
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden bg-[var(--canvas-paper)] select-none font-sans">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 bg-[var(--card-white)] text-[var(--ink-primary)] border-b border-[var(--grid-line)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#5B7B94]/15 border border-[#5B7B94]/30 flex items-center justify-center text-[#5B7B94] shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--ink-primary)] flex items-center gap-2 truncate">
              <span className="truncate">
                {language === "zh"
                  ? "概念网络与节点脉络"
                  : "Knowledge Graph & Linked Nodes"}
              </span>
            </h2>
            <p className="text-[11px] text-[var(--ink-secondary)] flex items-center gap-2 truncate">
              <span>{memories.length} {language === "zh" ? "记忆节点" : "Nodes"}</span>
              <span>•</span>
              <span>{relationships.length} {language === "zh" ? "关系连线" : "Edges"}</span>
              <span>•</span>
              <span>{wikiArticles.length} {language === "zh" ? "脉络档案" : "Topic Dossiers"}</span>
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-white text-stone-900 font-semibold shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-[#5B7B94]" />
            <span>{language === "zh" ? "关系网络" : "Network"}</span>
          </button>

          <button
            onClick={() => setActiveTab("wiki")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "wiki"
                ? "bg-white text-stone-900 font-semibold shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C97A63]" />
            <span>{language === "zh" ? "脉络档案" : "Dossiers"}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar: Graph Engineering Compiler & Actions */}
      <div className="px-4 py-2 bg-[var(--canvas-paper)] text-[var(--ink-primary)] border-b border-[var(--grid-line)] flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCompiler}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B7B94] text-white font-medium rounded-lg hover:bg-[#486377] transition-colors shadow-xs cursor-pointer"
            title={
              language === "zh"
                ? "自动挖掘潜在关联与因果链"
                : "Discover latent semantic and causal links"
            }
          >
            <Cpu className="w-3.5 h-3.5 text-[#E8DCC4]" />
            <span>
              {language === "zh" ? "编织潜在星轨连线" : "Auto-Link Graph"}
            </span>
          </button>

          {compilerFeedback && (
            <span className="text-[11px] font-medium text-[#3E576B] bg-[#5B7B94]/15 px-2.5 py-1 rounded-lg border border-[#5B7B94]/30 animate-fade-in">
              {compilerFeedback}
            </span>
          )}
        </div>

        {activeTab === "graph" && (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
            {/* View Switcher: Force Graph vs Cards */}
            <div className="flex items-center border border-[var(--grid-line)] bg-stone-100 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setGraphDisplayMode("force")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  graphDisplayMode === "force"
                    ? "bg-white text-stone-900 font-semibold shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Network className="w-3.5 h-3.5 text-[#5B7B94]" />
                <span>{language === "zh" ? "动态图谱" : "Force Graph"}</span>
              </button>
              <button
                onClick={() => setGraphDisplayMode("cards")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  graphDisplayMode === "cards"
                    ? "bg-white text-stone-900 font-semibold shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#C97A63]" />
                <span>{language === "zh" ? "卡片流" : "Cards"}</span>
              </button>
            </div>

            {/* Level Filter Pills (Natural Cognitive Dimensions) */}
            <div className="flex items-center gap-1 shrink-0 flex-wrap">
              {(["ALL", "L0", "L1", "L2", "L3", "L4"] as const).map((lvl) => {
                const isLvlActive = activeLevelFilter === lvl;
                const color = lvl === "ALL" ? "#475569" : MEMORY_LEVELS_META[lvl].color;
                return (
                  <button
                    key={lvl}
                    onClick={() => setActiveLevelFilter(lvl)}
                    style={{
                      backgroundColor: isLvlActive ? color : "var(--card-white)",
                      color: isLvlActive ? "#FFF" : "var(--ink-primary)",
                      borderColor: "var(--grid-line)",
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg font-medium border transition-all shadow-2xs cursor-pointer"
                  >
                    {lvl === "ALL"
                      ? (language === "zh" ? "全部" : "All")
                      : (language === "zh" ? MEMORY_LEVELS_META[lvl].shortZh : MEMORY_LEVELS_META[lvl].shortEn)}
                  </button>
                );
              })}
            </div>

            {/* Topic Filter Pills */}
            <div className="flex items-center gap-1 shrink-0 border-l border-[var(--border-subtle)] pl-2">
              <span className="text-[var(--ink-secondary)] font-medium shrink-0 text-[11px]">
                TOPIC:
              </span>
              <button
                onClick={() => setActiveTopic(null)}
                className={`px-2 py-0.5 text-[11px] rounded-md font-medium border transition-colors cursor-pointer ${
                  activeTopic === null
                    ? "bg-stone-800 text-white border-transparent"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                ALL
              </button>
              {allTopics.slice(0, 6).map((topic) => (
                <button
                  key={topic}
                  onClick={() =>
                    setActiveTopic(activeTopic === topic ? null : topic)
                  }
                  className={`px-2 py-0.5 text-[11px] rounded-md font-medium border shrink-0 transition-colors cursor-pointer ${
                    activeTopic === topic
                      ? "bg-[#5B7B94] text-white border-transparent"
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative bg-[var(--canvas-paper)]">
        {/* TAB 1: KNOWLEDGE GRAPH ENGINEERING CANVAS */}
        {activeTab === "graph" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* Visual Interactive Graph Node Grid / Force Graph Map */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {graphDisplayMode === "force" ? (
                <ForceGraphCanvas
                  nodes={filteredNodes}
                  edges={graph.edges}
                  memories={memories}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  activeLevelFilter={activeLevelFilter}
                  language={language}
                />
              ) : (
                <div className="flex-1 p-4 md:p-6 overflow-y-auto relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredNodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const nodeBg = typeColorMap[node.type] || "#FFFFFF";
                      const isLight = node.type === "moment" || node.type === "plan";

                      // Find full memory object to get level
                      const memObj = memories.find((m) => m.id === node.id);
                      const lvl = memObj ? getMemoryLevel(memObj) : "L0";
                      const levelMeta = MEMORY_LEVELS_META[lvl];

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3.5 border border-[var(--grid-line)] transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? "ring-2 ring-[var(--ink-primary)] bg-[var(--card-white)]"
                              : "hover:border-[#1D45B8] bg-[var(--card-white)]"
                          } text-[var(--ink-primary)] boogie-shadow boogie-shadow-hover`}
                        >
                          <div>
                            {/* Node Header */}
                            <div className="flex items-center justify-between mb-2 font-mono-meta">
                              <div className="flex items-center gap-1.5">
                                <span
                                  style={{
                                    backgroundColor: nodeBg,
                                    color: isLight ? "#111" : "#FFF",
                                  }}
                                  className="text-[9px] font-black uppercase px-1.5 py-0.2 border border-black/40"
                                >
                                  {node.type}
                                </span>
                                <span
                                  style={{ backgroundColor: levelMeta.color }}
                                  className="text-[8px] font-black text-white px-1.5 py-0.2 border border-black/40"
                                >
                                  {language === "zh" ? levelMeta.shortZh : levelMeta.shortEn}
                                </span>
                              </div>

                              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--ink-secondary)] bg-[var(--panel-bg)] px-1.5 py-0.2 border border-[var(--border-subtle)]">
                                <Link2 className="w-2.5 h-2.5 text-[#1D45B8]" />
                                <span>{node.connectionsCount} {language === "zh" ? "连结" : "links"}</span>
                              </span>
                            </div>

                            {/* Node Title */}
                            <h4 className="text-xs font-bold text-[var(--ink-primary)] line-clamp-2 leading-snug">
                              {node.title}
                            </h4>

                            {/* Node Content */}
                            {node.content && (
                              <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-2 mt-1 leading-relaxed font-sans">
                                {node.content}
                              </p>
                            )}

                            {/* Image preview thumbnail if present */}
                            {node.media_url && (
                              <div className="mt-2 h-14 w-full overflow-hidden border border-[var(--grid-line)] bg-black/5">
                                <img
                                  src={node.media_url}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>

                          {/* Footer: Topics & Direct Actions */}
                          <div className="mt-3 pt-2 border-t border-dashed border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {node.topics.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] font-mono-meta text-[var(--ink-secondary)] bg-[var(--panel-bg)] px-1 py-0.2 border border-[var(--border-subtle)]"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <span className="text-[9px] font-mono-meta text-[var(--ink-muted)]">
                              {node.occurred_at.slice(5, 10)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Node Inspector Drawer */}
            <div className="w-full md:w-84 bg-[var(--card-white)] text-[var(--ink-primary)] border-t md:border-t-0 md:border-l border-[var(--grid-line)] p-4 flex flex-col justify-between overflow-y-auto shrink-0 font-sans boogie-shadow">
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--grid-line)]">
                    <span className="text-[10px] font-mono-meta uppercase font-bold text-[var(--ink-secondary)]">
                      NODE INSPECTOR // {language === "zh" ? "节点脉络" : "CONTEXT"}
                    </span>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-[11px] font-mono-meta text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline"
                    >
                      {language === "zh" ? "清空" : "Clear"}
                    </button>
                  </div>

                  <div>
                    <span
                      style={{
                        backgroundColor:
                          typeColorMap[selectedNode.type] || "#111",
                        color:
                          selectedNode.type === "moment" ? "#111" : "#FFF",
                      }}
                      className="text-[9px] font-bold uppercase px-2 py-0.5 border border-black/40 font-mono-meta inline-block mb-1"
                    >
                      {t[`memory_type_${selectedNode.type}` as keyof typeof t] || selectedNode.type}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                      {selectedNode.title}
                    </h3>
                    <p className="text-[10px] font-mono-meta text-[var(--ink-secondary)] mt-0.5">
                      {selectedNode.occurred_at.slice(0, 10)}
                    </p>
                  </div>

                  {selectedNode.content && (
                    <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--panel-bg)] p-2.5 border border-[var(--border-subtle)] whitespace-pre-wrap">
                      {selectedNode.content}
                    </p>
                  )}

                  {selectedNode.media_url && (
                    <div className="border border-[var(--grid-line)] overflow-hidden max-h-40">
                      <img
                        src={selectedNode.media_url}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Connected Neighbor Nodes */}
                  <div className="pt-2 border-t border-dashed border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold text-[var(--ink-primary)] font-mono-meta uppercase flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-[#1D45B8]" />
                        <span>{language === "zh" ? "关联节点列表" : "Connected Nodes"} ({neighborNodes.length})</span>
                      </h4>
                      <button
                        onClick={() => setConnectionModalMemoryId(selectedNode.id)}
                        className="text-[10px] font-mono-meta font-bold text-[#1D45B8] hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{language === "zh" ? "连结新节点" : "Link Node"}</span>
                      </button>
                    </div>

                    {neighborNodes.length === 0 ? (
                      <div className="p-3 bg-[var(--panel-bg)] border border-dashed border-[var(--border-subtle)] text-center">
                        <p className="text-[10px] text-[var(--ink-secondary)] italic">
                          {language === "zh" ? "当前节点尚未连结其他记忆" : "No connected memories yet"}
                        </p>
                        <button
                          onClick={() => setConnectionModalMemoryId(selectedNode.id)}
                          className="mt-2 px-2 py-1 text-[10px] font-bold bg-[var(--card-white)] border border-[var(--grid-line)] text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-[var(--card-white)] transition-colors"
                        >
                          {language === "zh" ? "+ 立即建立连结" : "+ Link Now"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {neighborNodes.map((neigh) => (
                          <div
                            key={neigh.id}
                            onClick={() => setSelectedNodeId(neigh.id)}
                            className="p-2 border border-[var(--border-subtle)] hover:border-[var(--grid-line)] bg-[var(--panel-bg)] cursor-pointer text-xs group transition-all"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono-meta text-[var(--ink-secondary)]">
                              <span className="uppercase font-bold text-[var(--ink-primary)]">
                                {t[`memory_type_${neigh.type}` as keyof typeof t] || neigh.type}
                              </span>
                              <span>{neigh.occurred_at.slice(5, 10)}</span>
                            </div>
                            <p className="text-[11px] font-bold text-[var(--ink-primary)] group-hover:text-[#1D45B8] truncate mt-0.5">
                              [[{neigh.title}]]
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedMemoryId(selectedNode.id)}
                    className="w-full mt-2 px-3 py-2 bg-[#F7C928] text-black font-bold text-xs border border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-1 font-mono-meta"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "查看卡片详情与完整编辑" : "View Card Details & Edit"}</span>
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-4">
                  <Network className="w-10 h-10 text-neutral-300 mb-2" />
                  <p className="text-xs font-bold text-neutral-600">
                    {language === "zh" ? "选择左侧任意记忆节点" : "Select any memory node"}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-[200px]">
                    {language === "zh"
                      ? "即可在此查看完整的关联网状脉络、邻居节点，或建立新连结。"
                      : "View full relationship network, neighbor nodes, or establish links."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMORY HUB DOSSIER */}
        {activeTab === "wiki" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Concept Directory */}
            <div className="w-full md:w-72 bg-[var(--card-white)] text-[var(--ink-primary)] border-b md:border-b-0 md:border-r border-[var(--grid-line)] p-3 flex flex-col gap-2 overflow-y-auto shrink-0 font-mono-meta">
              <div className="pb-1.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[var(--ink-secondary)] flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#1D45B8]" />
                  <span>MEMORY HUB TOPICS ({wikiArticles.length})</span>
                </span>
                <span className="text-[9px] bg-[var(--panel-bg)] text-[var(--ink-secondary)] px-1 border border-[var(--border-subtle)]">
                  AI Compiled
                </span>
              </div>

              <div className="space-y-1 overflow-y-auto flex-1">
                {wikiArticles.map((art) => {
                  const isSelected =
                    currentWikiArticle?.topic.toLowerCase() ===
                    art.topic.toLowerCase();

                  return (
                    <button
                      key={art.topic}
                      onClick={() => setSelectedWikiTopic(art.topic)}
                      className={`w-full text-left p-2.5 border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-[#F7C928] text-black border-black font-black"
                          : "bg-[var(--panel-bg)] text-[var(--ink-primary)] border-[var(--border-subtle)] hover:border-[var(--grid-line)]"
                      }`}
                    >
                      <div>
                        <span className="text-xs block">#{art.topic}</span>
                        <span className="text-[9px] text-[var(--ink-muted)] font-normal">
                          {art.memory_ids.length} {language === "zh" ? "记忆节点" : "nodes"}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Compiled Wiki Article Dossier */}
            <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-[var(--canvas-paper)] text-[var(--ink-primary)] font-sans">
              {currentWikiArticle ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Article Masthead */}
                  <div className="border-b border-[var(--grid-line)] pb-4">
                    <div className="flex items-center gap-2 text-xs font-mono-meta text-[#1D45B8] font-bold uppercase">
                      <FileText className="w-3.5 h-3.5 text-[#DD2E1E]" />
                      <span>PERSONAL MEMORY HUB DOSSIER</span>
                      <span>•</span>
                      <span>{currentWikiArticle.memory_ids.length} {language === "zh" ? "关联记忆支撑" : "supporting memories"}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--ink-primary)] tracking-tight mt-1">
                      #{currentWikiArticle.topic}
                    </h1>
                  </div>

                  {/* Summary */}
                  <div className="bg-[var(--card-white)] border border-[var(--grid-line)] p-4 boogie-shadow">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] font-mono-meta mb-1">
                      // {language === "zh" ? "认知全景概要 (Executive Summary)" : "Executive Summary"}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {currentWikiArticle.summary}
                    </p>
                  </div>

                  {/* Key Insights */}
                  {currentWikiArticle.key_insights && currentWikiArticle.key_insights.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] font-mono-meta">
                        // {language === "zh" ? "核心原则与关键洞察 (Core Principles)" : "Core Principles & Key Insights"}
                      </h3>
                      <ul className="space-y-1.5">
                        {currentWikiArticle.key_insights.map((insight: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--card-white)] border border-[var(--border-subtle)] p-2.5"
                          >
                            <span className="w-1.5 h-1.5 bg-[#DD2E1E] mt-1.5 shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source Memories */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-primary)] font-mono-meta">
                      // {language === "zh" ? "关联支撑记忆节点" : "Supporting Memory Nodes"} ({currentWikiArticle.memory_ids.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentWikiArticle.memory_ids.map((id) => {
                        const mem = memories.find((m) => m.id === id);
                        if (!mem) return null;
                        return (
                          <div
                            key={id}
                            onClick={() => setSelectedMemoryId(id)}
                            className="p-2.5 bg-white border border-black hover:bg-[#F7C928] cursor-pointer text-xs transition-colors flex items-center justify-between"
                          >
                            <div className="truncate mr-2">
                              <span className="font-bold text-black truncate block">
                                {getLocalizedTitle(mem, language)}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono-meta">
                                {t[`memory_type_${mem.type}` as keyof typeof t] || mem.type} • {mem.occurred_at.slice(0, 10)}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-neutral-400">
                  <p className="text-xs font-mono-meta">
                    {language === "zh"
                      ? "暂无生成的记忆中枢档案，请先在左侧录入记忆或执行「图谱关联自编译」"
                      : "No Memory Hub dossiers compiled yet. Add memories or compile graph relations."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
