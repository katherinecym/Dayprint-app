"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { KnowledgeNode, KnowledgeEdge } from "@/lib/graph-engineering";
import { CanonicalMemory, MemoryLevel, MEMORY_LEVELS_META, getMemoryLevel } from "@/types/memory";
import { ZoomIn, ZoomOut, RotateCcw, Search, X, Filter, Maximize2 } from "lucide-react";

interface ForceGraphCanvasProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  memories: CanonicalMemory[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  activeLevelFilter?: MemoryLevel | "ALL";
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  filterOnlyMatches?: boolean;
  onFilterOnlyMatchesChange?: (val: boolean) => void;
  language?: "en" | "zh";
}

interface SimNode extends KnowledgeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pillWidth: number;
  displayTitle: string;
  snippet: string;
  topicTag: string | null;
  level: MemoryLevel;
  levelColor: string;
}

/**
 * Editorial Morandi Mineral Palette (Craft.do / Affine.pro inspired).
 * Low-saturation, flat matte, high elegance, zero plastic 3D gloss.
 */
export const CRAFT_PALETTE: Record<
  MemoryLevel,
  {
    dot: string;
    border: string;
    bg: string;
    badgeBg: string;
    text: string;
    badge: string;
    nameZh: string;
    nameEn: string;
  }
> = {
  L4: {
    dot: "#7C6F93",
    border: "#C4BACF",
    bg: "rgba(124, 111, 147, 0.12)",
    badgeBg: "#7C6F93",
    text: "#4F4462",
    badge: "bg-[#7C6F93] text-white",
    nameZh: "原则",
    nameEn: "PRN",
  },
  L3: {
    dot: "#52575E",
    border: "#B8BDC4",
    bg: "rgba(82, 87, 94, 0.12)",
    badgeBg: "#52575E",
    text: "#2B2D31",
    badge: "bg-[#52575E] text-white",
    nameZh: "心智",
    nameEn: "MOD",
  },
  L2: {
    dot: "#5B7B94",
    border: "#ADC1CE",
    bg: "rgba(91, 123, 148, 0.12)",
    badgeBg: "#5B7B94",
    text: "#364D5E",
    badge: "bg-[#5B7B94] text-white",
    nameZh: "习惯",
    nameEn: "SOP",
  },
  L1: {
    dot: "#BA6860",
    border: "#DFB3AF",
    bg: "rgba(186, 104, 96, 0.12)",
    badgeBg: "#BA6860",
    text: "#74352F",
    badge: "bg-[#BA6860] text-white",
    nameZh: "经历",
    nameEn: "EXP",
  },
  L0: {
    dot: "#C49A56",
    border: "#DECBAB",
    bg: "rgba(196, 154, 86, 0.12)",
    badgeBg: "#C49A56",
    text: "#705324",
    badge: "bg-[#C49A56] text-white",
    nameZh: "原文",
    nameEn: "RAW",
  },
};

/**
 * Pure physics simulation pre-computed synchronously before rendering.
 * Enforces geometric separation tailored for Craft/Affine floating micro-capsules
 * so capsules never collide or overlap, while maintaining a weightless, organic constellation.
 */
function precomputeStableLayout(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  memoryMap: Map<string, CanonicalMemory>,
  width: number,
  height: number,
  language: "en" | "zh" = "en"
): SimNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const count = nodes.length;
  if (count === 0) return [];

  // 1. Initial golden ratio spiral placement
  const goldenAngle = 2.399963;
  const simNodes: SimNode[] = nodes.map((n, i) => {
    const mem = memoryMap.get(n.id);
    const lvl: MemoryLevel = mem ? getMemoryLevel(mem) : "L0";
    const palette = CRAFT_PALETTE[lvl] || CRAFT_PALETTE.L0;

    // Calculate pill geometry
    const isChinese = language === "zh";
    const cleanTitle = n.title.trim();
    const rawContent = (
      language === "zh"
        ? (mem?.content_zh || mem?.content || n.content || "")
        : (mem?.content_en || n.content || "")
    ).replace(/\s+/g, " ").trim();

    // Multi-line capsule pill width (generous up to 240px)
    const titleEstimatedWidth = cleanTitle.length * (isChinese ? 11.5 : 7.2);
    const snippetEstimatedWidth = Math.min(rawContent.length, 22) * (isChinese ? 9.5 : 6);
    const textWidth = Math.max(titleEstimatedWidth, snippetEstimatedWidth);
    const pillWidth = Math.max(155, Math.min(52 + textWidth + 24, 240));

    // Precise truncation matching the calculated pillWidth
    const maxTitleChars = isChinese ? Math.floor((pillWidth - 62) / 11) : Math.floor((pillWidth - 62) / 7.2);
    const displayTitle = cleanTitle.length > maxTitleChars
      ? cleanTitle.slice(0, Math.max(maxTitleChars - 1, 5)) + "…"
      : cleanTitle;

    const maxSnippetChars = isChinese ? Math.floor((pillWidth - 62) / 9.5) : Math.floor((pillWidth - 62) / 6);
    const snippet = rawContent.length > maxSnippetChars
      ? rawContent.slice(0, Math.max(maxSnippetChars - 1, 6)) + "…"
      : rawContent || (n.topics?.[0] ? `#${n.topics[0]}` : (language === "zh" ? "碎片" : "Fragment"));

    const rawTopic = n.topics?.[0] || mem?.topics?.[0];
    const topicTag = rawTopic ? (rawTopic.length > 7 ? rawTopic.slice(0, 6) + "…" : rawTopic) : null;

    // Physical collision radius based on capsule dimensions
    const radius = Math.round(pillWidth / 2 + 14);

    const dist = 80 + Math.sqrt(i + 1) * 95;
    const angle = i * goldenAngle;
    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;

    return {
      ...n,
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      pillWidth,
      displayTitle,
      snippet,
      topicTag,
      level: lvl,
      levelColor: palette.dot,
    };
  });

  const nodeMap = new Map<string, SimNode>();
  simNodes.forEach((n) => nodeMap.set(n.id, n));

  // 2. Synchronous Pre-Warming physics simulation (160 iterations in memory)
  const iterations = 160;
  for (let step = 0; step < iterations; step++) {
    const alpha = Math.pow(1 - step / iterations, 1.7);
    if (alpha <= 0.001) break;

    // A. Inverse-Square Repulsion between all pairs
    const kRepel = 15000;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = simNodes[i];
        const b = simNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        const force = (kRepel / (distSq + 260)) * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;

        // B. HARD Geometric Collision Constraint for capsules
        const minDistance = a.radius + b.radius + 18;
        if (dist < minDistance) {
          const overlap = minDistance - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const pushRatio = 0.5;
          a.x -= nx * overlap * pushRatio;
          a.y -= ny * overlap * pushRatio;
          b.x += nx * overlap * pushRatio;
          b.y += ny * overlap * pushRatio;
        }
      }
    }

    // C. Hooke Spring Attraction along Edges
    const kSpring = 0.028;
    const restLength = 205;
    edges.forEach((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - restLength;
      const force = displacement * kSpring * alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      from.vx += fx;
      from.vy += fy;
      to.vx -= fx;
      to.vy -= fy;
    });

    // D. Soft Center Gravity & Velocity Damping
    const gravity = 0.0032;
    const damping = 0.83;
    simNodes.forEach((node) => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * gravity * alpha;
      node.vy += dy * gravity * alpha;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx;
      node.y += node.vy;
    });
  }

  // 3. Final anti-overlap relaxation passes
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = simNodes[i];
        const b = simNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDistance = a.radius + b.radius + 20;
        if (dist < minDistance) {
          const overlap = minDistance - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
        }
      }
    }
  }

  return simNodes;
}

export function ForceGraphCanvas({
  nodes,
  edges,
  memories,
  selectedNodeId,
  onSelectNode,
  activeLevelFilter = "ALL",
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  filterOnlyMatches: externalFilterOnlyMatches,
  onFilterOnlyMatchesChange,
  language = "en",
}: ForceGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // In-graph search & filter state (supports both controlled & uncontrolled)
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalFilterOnlyMatches, setInternalFilterOnlyMatches] = useState(false);

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const isFilterOnlyMatches = externalFilterOnlyMatches !== undefined ? externalFilterOnlyMatches : internalFilterOnlyMatches;

  const handleUpdateSearch = (val: string) => {
    if (onSearchQueryChange) onSearchQueryChange(val);
    else setInternalSearchQuery(val);
  };

  const handleToggleFilterOnly = () => {
    const nextVal = !isFilterOnlyMatches;
    if (onFilterOnlyMatchesChange) onFilterOnlyMatchesChange(nextVal);
    else setInternalFilterOnlyMatches(nextVal);
  };

  // Transform / Camera
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Physics simulation nodes
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const simNodesRef = useRef<SimNode[]>([]);

  // Memory map for level lookup
  const memoryMap = useMemo(() => {
    const map = new Map<string, CanonicalMemory>();
    memories.forEach((m) => map.set(m.id, m));
    return map;
  }, [memories]);

  // Fit all visible nodes into the current viewport with generous margin
  const fitToScreen = useCallback((nodeList: SimNode[]) => {
    if (!nodeList || nodeList.length === 0) return;
    const w = containerRef.current?.clientWidth || 900;
    const h = containerRef.current?.clientHeight || 650;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodeList.forEach((n) => {
      minX = Math.min(minX, n.x - n.radius - 30);
      maxX = Math.max(maxX, n.x + n.radius + 30);
      minY = Math.min(minY, n.y - n.radius - 30);
      maxY = Math.max(maxY, n.y + n.radius + 45);
    });
    const graphW = maxX - minX;
    const graphH = maxY - minY;
    if (graphW <= 0 || graphH <= 0) return;

    const pad = 60;
    const targetZoom = Math.min((w - pad * 2) / graphW, (h - pad * 2) / graphH);
    // Allow zooming down to 0.15 so huge graphs never get clipped
    const safeZoom = Math.max(Math.min(targetZoom, 1.05), 0.15);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const targetPanX = w / 2 - midX * safeZoom;
    const targetPanY = h / 2 - midY * safeZoom;

    setZoom(safeZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, []);

  // Synchronous Pre-computed Layout: Runs once when nodes change, mounts with zero shaking!
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    const computed = precomputeStableLayout(nodes, edges, memoryMap, width, height, language);
    setSimNodes(computed);
    simNodesRef.current = computed;
    // Auto-fit to viewport on mount or data change
    fitToScreen(computed);
  }, [nodes, edges, memoryMap, fitToScreen, language]);

  // Compute search matches & direct relationships with deep bilingual & metadata matching
  const searchFilter = useMemo(() => {
    const rawQuery = activeSearchQuery.trim();
    if (!rawQuery) {
      return {
        hasQuery: false,
        matchedNodeIds: new Set<string>(),
        relevantNodeIds: new Set<string>(),
        matchCount: 0,
      };
    }

    const query = rawQuery.toLowerCase();
    const matched = new Set<string>();

    nodes.forEach((n) => {
      const mem = memoryMap.get(n.id);
      const matchNodeTitle = n.title?.toLowerCase().includes(query);
      const matchNodeContent = n.content?.toLowerCase().includes(query);
      const matchNodeTopics = (n.topics || []).some((t) => t.toLowerCase().includes(query));
      const matchNodeType = n.type?.toLowerCase().includes(query);

      // Also search bilingual fields from canonical memory
      const matchMemTitle =
        Boolean(mem?.title?.toLowerCase().includes(query)) ||
        Boolean(mem?.title_zh?.toLowerCase().includes(query)) ||
        Boolean(mem?.title_en?.toLowerCase().includes(query));
      const matchMemContent =
        Boolean(mem?.content?.toLowerCase().includes(query)) ||
        Boolean(mem?.content_zh?.toLowerCase().includes(query)) ||
        Boolean(mem?.content_en?.toLowerCase().includes(query));
      const matchMemTopics = (mem?.topics || []).some((t) => t.toLowerCase().includes(query));

      if (
        matchNodeTitle ||
        matchNodeContent ||
        matchNodeTopics ||
        matchNodeType ||
        matchMemTitle ||
        matchMemContent ||
        matchMemTopics
      ) {
        matched.add(n.id);
      }
    });

    // 1-hop connected neighbors of matched nodes
    const relevant = new Set<string>(matched);
    edges.forEach((e) => {
      if (matched.has(e.from)) relevant.add(e.to);
      if (matched.has(e.to)) relevant.add(e.from);
    });

    return {
      hasQuery: true,
      matchedNodeIds: matched,
      relevantNodeIds: relevant,
      matchCount: matched.size,
    };
  }, [nodes, edges, activeSearchQuery, memoryMap]);

  // Auto-focus camera on matched nodes when search query changes
  useEffect(() => {
    if (!searchFilter.hasQuery || searchFilter.matchedNodeIds.size === 0) return;
    const matchedSimNodes = simNodesRef.current.filter((n) =>
      searchFilter.matchedNodeIds.has(n.id)
    );
    if (matchedSimNodes.length === 0) return;

    const w = containerRef.current?.clientWidth || 900;
    const h = containerRef.current?.clientHeight || 650;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    matchedSimNodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    // Comfortable zoom level for focused inspection
    const targetZoom = Math.max(Math.min(zoom, 1.15), 0.7);
    const targetPanX = w / 2 - midX * targetZoom;
    const targetPanY = h / 2 - midY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [activeSearchQuery, searchFilter.hasQuery, searchFilter.matchedNodeIds.size]);

  // Connected neighbors for active hover / select
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNeighbors = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.from === activeFocusId) set.add(e.to);
      if (e.to === activeFocusId) set.add(e.from);
    });
    return set;
  }, [activeFocusId, edges]);

  // Handle Dragging Node
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  // Handle Background Pan
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingNodeId) {
        const node = simNodesRef.current.find((n) => n.id === draggingNodeId);
        if (node) {
          const dx = (e.clientX - dragStartPosRef.current.x) / zoom;
          const dy = (e.clientY - dragStartPosRef.current.y) / zoom;
          node.x += dx;
          node.y += dy;
          dragStartPosRef.current = { x: e.clientX, y: e.clientY };
          setSimNodes([...simNodesRef.current]);
        }
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    },
    [draggingNodeId, isPanning, zoom]
  );

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Smooth Zoom toward cursor position (Figma / Obsidian standard)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
    // Allow zooming down to 0.1 so graph can NEVER be truncated
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 3.0);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom(newZoom);
      return;
    }
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Reset View to fit full screen
  const handleResetView = () => {
    fitToScreen(simNodesRef.current);
  };

  // Filter visible nodes and edges based on filterOnlyMatches
  const displayNodes = useMemo(() => {
    if (searchFilter.hasQuery && isFilterOnlyMatches) {
      return simNodes.filter((n) => searchFilter.relevantNodeIds.has(n.id));
    }
    return simNodes;
  }, [simNodes, searchFilter, isFilterOnlyMatches]);

  const posMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    displayNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [displayNodes]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full relative overflow-hidden bg-[var(--canvas-paper)] select-none cursor-grab active:cursor-grabbing transition-colors"
      style={{
        backgroundImage: "radial-gradient(var(--border-subtle) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* 1. In-Canvas Fine Art Search Bar & Subgraph Filter */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center bg-[var(--card-white)]/95 backdrop-blur-md border border-[var(--grid-line)] px-2.5 py-1.5 font-mono-meta text-xs text-[var(--ink-primary)] boogie-shadow">
          <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] mr-2 shrink-0" />
          <input
            type="text"
            value={activeSearchQuery}
            onChange={(e) => handleUpdateSearch(e.target.value)}
            placeholder={
              language === "zh"
                ? "搜索节点关键词 (标题/内容/标签)..."
                : "Search nodes (title/content/topics)..."
            }
            className="w-48 sm:w-64 bg-transparent outline-none text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] font-sans"
          />
          {activeSearchQuery && (
            <button
              onClick={() => handleUpdateSearch("")}
              className="p-0.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] ml-1"
              title={language === "zh" ? "清空搜索" : "Clear search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchFilter.hasQuery && (
            <span
              className={`ml-2 px-1.5 py-0.2 text-[10px] font-bold border ${
                searchFilter.matchCount > 0
                  ? "bg-[#1D45B8] text-white border-[#1D45B8]"
                  : "bg-[var(--panel-bg)] text-[var(--ink-secondary)] border-[var(--border-subtle)]"
              }`}
            >
              {searchFilter.matchCount} {language === "zh" ? "匹配" : "matches"}
            </span>
          )}
        </div>

        {searchFilter.hasQuery && (
          <button
            onClick={handleToggleFilterOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-meta font-bold border transition-colors ${
              isFilterOnlyMatches
                ? "bg-[#DD2E1E] text-white border-[#DD2E1E]"
                : "bg-[var(--card-white)]/95 text-[var(--ink-primary)] border-[var(--grid-line)] hover:bg-[var(--panel-bg)]"
            }`}
            title={
              language === "zh"
                ? "切换全图高亮或仅显示匹配子图"
                : "Toggle full graph highlight vs matched subgraph"
            }
          >
            <Filter className="w-3 h-3" />
            <span>
              {isFilterOnlyMatches
                ? language === "zh"
                  ? "仅看匹配子图"
                  : "Only Matches"
                : language === "zh"
                ? "全图透视高亮"
                : "Highlight All"}
            </span>
          </button>
        )}
      </div>

      {/* 2. De Stijl Minimalist Zoom / Pan Controls Overlay */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 bg-[var(--card-white)]/95 backdrop-blur-md border border-[var(--grid-line)] p-1 text-[var(--ink-primary)] boogie-shadow">
        <button
          data-testid="graph-zoom-in"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          className="p-1.5 hover:bg-[var(--panel-bg)] text-[var(--ink-primary)] border border-transparent font-bold transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))}
          className="p-1.5 hover:bg-[var(--panel-bg)] text-[var(--ink-primary)] border border-transparent font-bold transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5" />
        <button
          onClick={() => fitToScreen(simNodesRef.current)}
          className="p-1.5 hover:bg-[var(--panel-bg)] text-[var(--ink-primary)] border border-transparent font-bold transition-colors flex items-center gap-1"
          title={language === "zh" ? "一键全景居中 (Fit All Nodes)" : "Fit All to Screen"}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 hover:bg-[var(--panel-bg)] text-[var(--ink-primary)] border border-transparent font-bold transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono-meta font-bold text-[var(--ink-secondary)] px-1">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* 3. Craft / Affine Editorial Legend Bar */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3 bg-[var(--card-white)]/95 backdrop-blur-md border border-[var(--grid-line)] px-3 py-1.5 text-[10px] font-mono-meta text-[var(--ink-primary)] boogie-shadow">
        <span className="font-bold text-[var(--ink-secondary)] tracking-wider">
          {language === "zh" ? "认知维度:" : "DIMENSIONS:"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CRAFT_PALETTE.L4.dot }} />
          {language === "zh" ? CRAFT_PALETTE.L4.nameZh : CRAFT_PALETTE.L4.nameEn}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CRAFT_PALETTE.L3.dot }} />
          {language === "zh" ? CRAFT_PALETTE.L3.nameZh : CRAFT_PALETTE.L3.nameEn}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CRAFT_PALETTE.L2.dot }} />
          {language === "zh" ? CRAFT_PALETTE.L2.nameZh : CRAFT_PALETTE.L2.nameEn}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CRAFT_PALETTE.L1.dot }} />
          {language === "zh" ? CRAFT_PALETTE.L1.nameZh : CRAFT_PALETTE.L1.nameEn}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CRAFT_PALETTE.L0.dot }} />
          {language === "zh" ? CRAFT_PALETTE.L0.nameZh : CRAFT_PALETTE.L0.nameEn}
        </span>
      </div>

      {/* 4. SVG Canvas: Overflow-visible with inner camera plane group to prevent clipping */}
      <svg
        className="w-full h-full absolute inset-0 overflow-visible"
        style={{ pointerEvents: "all" }}
      >
        <defs>
          {/* Subtle Craft/Affine card shadows */}
          <filter id="craft-subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.06" />
          </filter>
          <filter id="craft-peek-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.10" />
          </filter>
        </defs>

        {/* Root Camera Transform Group (prevents SVG viewport box clipping) */}
        <g
          className="graph-camera-plane"
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
        >
          {/* 4.1 RELATIONAL EDGES (Affine / Craft delicate hairline splines) */}
          <g className="edges-layer">
            {edges.map((edge) => {
              const from = posMap.get(edge.from);
              const to = posMap.get(edge.to);
              if (!from || !to) return null;

              const fromNode = simNodes.find((n) => n.id === edge.from);
              const toNode = simNodes.find((n) => n.id === edge.to);

              // Level filter check
              const isEdgeLevelMatch =
                activeLevelFilter === "ALL" ||
                (fromNode?.level === activeLevelFilter || toNode?.level === activeLevelFilter);

              // Focus highlight
              const isConnectedToFocus =
                activeFocusId && (edge.from === activeFocusId || edge.to === activeFocusId);

              // Search highlight
              const isEdgeDirectSearchMatch =
                searchFilter.hasQuery &&
                searchFilter.matchedNodeIds.has(edge.from) &&
                searchFilter.matchedNodeIds.has(edge.to);

              const isEdgeSearchRelevant =
                searchFilter.hasQuery &&
                (searchFilter.matchedNodeIds.has(edge.from) || searchFilter.matchedNodeIds.has(edge.to));

              let isDimmed = !isEdgeLevelMatch;
              if (activeFocusId) {
                isDimmed = isDimmed || !isConnectedToFocus;
              } else if (searchFilter.hasQuery) {
                isDimmed = isDimmed || !isEdgeSearchRelevant;
              }

              const isHighlighted = isConnectedToFocus || isEdgeSearchRelevant;

              // Smooth organic quadratic bezier curve
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const curveOffset = Math.min(dist * 0.08, 20);
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const cx = midX - (dy / dist) * curveOffset;
              const cy = midY + (dx / dist) * curveOffset;
              const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

              const edgeStrokeColor = isEdgeDirectSearchMatch
                ? "#BA6860"
                : isConnectedToFocus
                ? "#5B7B94"
                : isEdgeSearchRelevant
                ? "#7C6F93"
                : "var(--grid-line)";

              return (
                <g key={edge.id} className="transition-opacity duration-200">
                  {/* Subtle Hairline Connector */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edgeStrokeColor}
                    strokeWidth={isHighlighted ? 1.5 : 1}
                    strokeDasharray={isHighlighted ? "4, 3" : undefined}
                    strokeOpacity={isDimmed ? 0.03 : isHighlighted ? 0.85 : 0.35}
                    className="transition-all duration-200"
                  />

                  {/* Minimal Midpoint Label Tag */}
                  {isHighlighted && (
                    <g transform={`translate(${cx}, ${cy - 4})`}>
                      <rect
                        x={-edge.label.length * 3.5 - 6}
                        y="-7"
                        width={edge.label.length * 7 + 12}
                        height="14"
                        rx="3"
                        fill="var(--card-white)"
                        stroke="var(--grid-line)"
                        strokeWidth="0.5"
                      />
                      <text
                        textAnchor="middle"
                        dy="3.2"
                        fill="var(--ink-secondary)"
                        fontSize="8.5"
                        fontWeight="500"
                        className="font-mono-meta select-none pointer-events-none"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 4.2 KNOWLEDGE NODES (Craft.do & Affine.pro Floating Micro-Capsules) */}
          <g className="nodes-layer">
            {displayNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isLevelMatch = activeLevelFilter === "ALL" || node.level === activeLevelFilter;

              const isSearchMatch = searchFilter.hasQuery && searchFilter.matchedNodeIds.has(node.id);
              const isSearchNeighbor =
                searchFilter.hasQuery && !isSearchMatch && searchFilter.relevantNodeIds.has(node.id);

              const isConnectedToFocus =
                activeFocusId && (activeFocusId === node.id || connectedNeighbors.has(node.id));

              // Dimming calculation
              let nodeOpacity = 1;
              if (activeFocusId) {
                nodeOpacity = isConnectedToFocus ? 1 : 0.12;
              } else if (searchFilter.hasQuery) {
                if (isSearchMatch) {
                  nodeOpacity = 1;
                } else if (isSearchNeighbor) {
                  nodeOpacity = 0.45;
                } else {
                  nodeOpacity = 0.08;
                }
              } else if (!isLevelMatch) {
                nodeOpacity = 0.1;
              }

              const palette = CRAFT_PALETTE[node.level] || CRAFT_PALETTE.L0;
              const mem = memoryMap.get(node.id);
              const isPillMode = zoom >= 0.38;
              const pw = node.pillWidth || 110;
              const halfPw = pw / 2;
              const showHoverPeek = (isHovered || isSelected) && !isSearchMatch;

              return (
                <g
                  key={node.id}
                  data-node-id={node.id}
                  data-node-title={node.title}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                  }}
                  className="cursor-pointer group"
                  style={{
                    opacity: nodeOpacity,
                    transition: "opacity 0.2s ease-out",
                  }}
                >
                  {/* SEARCH MATCH: Gentle Terracotta Focus Ring */}
                  {isSearchMatch && (
                    <rect
                      x={-halfPw - 6}
                      y="-28"
                      width={pw + 12}
                      height="56"
                      rx="14"
                      fill="none"
                      stroke="#BA6860"
                      strokeWidth="1.6"
                      strokeDasharray="4, 3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Active Selection Outline */}
                  {isSelected && !isSearchMatch && (
                    <rect
                      x={-halfPw - 4}
                      y="-26"
                      width={pw + 8}
                      height="52"
                      rx="13"
                      fill="none"
                      stroke="var(--ink-primary)"
                      strokeWidth="1.2"
                      strokeOpacity="0.4"
                    />
                  )}

                  {!isPillMode ? (
                    /* Minimal Dot Mode when zoomed out (Obsidian / Craft macro view) */
                    <g>
                      <circle
                        r="6"
                        fill={palette.dot}
                        stroke="var(--card-white)"
                        strokeWidth="1.5"
                      />
                      <text
                        textAnchor="middle"
                        dy="16"
                        fill="var(--ink-secondary)"
                        fontSize="9"
                        className="font-sans select-none pointer-events-none"
                      >
                        {node.displayTitle}
                      </text>
                    </g>
                  ) : (
                    /* Craft / Affine Micro-Card Node (Multi-line + Obvious Category Classification) */
                    <g>
                      {/* Card Base with gentle category tinted wash background */}
                      <rect
                        x={-halfPw}
                        y="-22"
                        width={pw}
                        height="44"
                        rx="10"
                        fill="var(--card-white)"
                        stroke={
                          isSearchMatch
                            ? "#BA6860"
                            : isSelected
                            ? "var(--ink-primary)"
                            : isHovered
                            ? palette.dot
                            : palette.border
                        }
                        strokeWidth={isSearchMatch ? "2" : isSelected ? "1.8" : "1.2"}
                        filter={isHovered || isSelected ? "url(#craft-subtle-shadow)" : undefined}
                        className="transition-colors duration-150"
                      />

                      {/* Soft Category Wash Underlay */}
                      <rect
                        x={-halfPw}
                        y="-22"
                        width={pw}
                        height="44"
                        rx="10"
                        fill={palette.bg}
                        className="pointer-events-none"
                      />

                      {/* Category Pill Badge on Left (e.g. [经历], [心智]) */}
                      <g transform={`translate(${-halfPw + 7}, -15)`}>
                        <rect
                          width="34"
                          height="30"
                          rx="6"
                          fill={palette.badgeBg}
                        />
                        <text
                          x="17"
                          y="19"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          className="font-sans select-none pointer-events-none"
                        >
                          {language === "zh" ? palette.nameZh : palette.nameEn}
                        </text>
                      </g>

                      {/* Text Column with strict ClipPath to prevent any possible overflow */}
                      <defs>
                        <clipPath id={`craft-text-clip-${node.id}`}>
                          <rect x={-halfPw + 46} y="-20" width={Math.max(pw - 54, 40)} height="40" />
                        </clipPath>
                      </defs>

                      <g clipPath={`url(#craft-text-clip-${node.id})`}>
                        {/* Text Column: Line 1 Title */}
                        <text
                          x={-halfPw + 48}
                          y="-4"
                          fill="var(--ink-primary)"
                          fontSize="11"
                          fontWeight="600"
                          className="font-sans select-none pointer-events-none tracking-tight"
                        >
                          {node.displayTitle}
                        </text>

                        {/* Text Column: Line 2 Context Snippet */}
                        <text
                          x={-halfPw + 48}
                          y="11"
                          fill="var(--ink-secondary)"
                          fontSize="9"
                          className="font-sans select-none pointer-events-none"
                        >
                          {node.snippet}
                        </text>
                      </g>

                      {/* Connection pill if hub */}
                      {node.connectionsCount > 1 && (
                        <text
                          x={halfPw - 8}
                          y="-5"
                          textAnchor="end"
                          fill={palette.dot}
                          fontSize="8"
                          fontWeight="bold"
                          className="font-mono-meta select-none pointer-events-none"
                        >
                          ·{node.connectionsCount}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Search Match Star Badge */}
                  {isSearchMatch && (
                    <g transform={`translate(0, -28)`}>
                      <rect
                        x="-10"
                        y="-7"
                        width="20"
                        height="12"
                        rx="3"
                        fill="#BA6860"
                      />
                      <path
                        d="M0,-4 L1.2,-1.2 L4.2,-1 L2,1.2 L2.6,4.2 L0,2.6 L-2.6,4.2 L-2,1.2 L-4.2,-1 L-1.2,-1.2 Z"
                        fill="#FFFFFF"
                        className="select-none pointer-events-none"
                      />
                    </g>
                  )}

                  {/* Craft/Affine Floating Note Peek Sheet (Reveals rich approximate info without kanban board) */}
                  {showHoverPeek && (
                    <g
                      transform={`translate(0, ${node.y < 120 ? 22 : -100})`}
                      filter="url(#craft-peek-shadow)"
                      className="transition-all duration-200 pointer-events-none"
                    >
                      <defs>
                        <clipPath id={`craft-peek-clip-${node.id}`}>
                          <rect x="-114" y="0" width="228" height="84" rx="6" />
                        </clipPath>
                      </defs>

                      <rect
                        x="-125"
                        y="0"
                        width="250"
                        height="84"
                        rx="8"
                        fill="var(--card-white)"
                        stroke="var(--grid-line)"
                        strokeWidth="1"
                      />
                      {/* Top Accent Line */}
                      <path
                        d="M -125 7 Q -125 0 -118 0 L 118 0 Q 125 0 125 7 L 125 8 L -125 8 Z"
                        fill={palette.dot}
                      />

                      {/* Header: Level Badge & Date */}
                      <g transform="translate(-112, 20)">
                        <rect
                          x="0"
                          y="-9"
                          width="48"
                          height="14"
                          rx="3"
                          fill={palette.bg}
                          stroke={palette.border}
                          strokeWidth="0.5"
                        />
                        <text
                          x="24"
                          y="1.5"
                          textAnchor="middle"
                          fill={palette.text}
                          fontSize="8.5"
                          fontWeight="600"
                          className="font-mono-meta select-none"
                        >
                          {language === "zh" ? palette.nameZh : palette.nameEn} {node.level}
                        </text>

                        <text
                          x="56"
                          y="1.5"
                          fill="var(--ink-muted)"
                          fontSize="8.5"
                          className="font-mono-meta select-none"
                        >
                          {(mem?.occurred_at || mem?.recorded_at)?.slice(0, 10) || "Recent"} · {node.connectionsCount} {language === "zh" ? "关联" : "links"}
                        </text>
                      </g>

                      {/* Content Excerpt with strict ClipPath and language-calibrated line breaks */}
                      <g clipPath={`url(#craft-peek-clip-${node.id})`}>
                        <text
                          x="-112"
                          y="41"
                          fill="var(--ink-secondary)"
                          fontSize="9.5"
                          className="font-sans select-none"
                        >
                          {(() => {
                            const fullContent = (
                              language === "zh"
                                ? (mem?.content_zh || mem?.content || node.content || "")
                                : (mem?.content_en || node.content || "")
                            ).replace(/\s+/g, " ").trim();
                            const limit = language === "zh" ? 21 : 36;
                            return fullContent.slice(0, limit);
                          })()}
                        </text>
                        <text
                          x="-112"
                          y="55"
                          fill="var(--ink-secondary)"
                          fontSize="9.5"
                          className="font-sans select-none"
                        >
                          {(() => {
                            const fullContent = (
                              language === "zh"
                                ? (mem?.content_zh || mem?.content || node.content || "")
                                : (mem?.content_en || node.content || "")
                            ).replace(/\s+/g, " ").trim();
                            const limit1 = language === "zh" ? 21 : 36;
                            const limit2 = language === "zh" ? 40 : 70;
                            if (fullContent.length <= limit1) return "";
                            return fullContent.length > limit2
                              ? fullContent.slice(limit1, limit2 - 1) + "…"
                              : fullContent.slice(limit1, limit2);
                          })()}
                        </text>

                        {/* Footer: Topics */}
                        <g transform="translate(-112, 71)">
                          <text
                            x="0"
                            y="0"
                            fill="var(--ink-muted)"
                            fontSize="8"
                            className="font-mono-meta select-none"
                          >
                            {(() => {
                              const topics = (mem?.topics || node.topics || []).slice(0, 3).map((t) => `#${t}`).join("  ");
                              return topics.length > 34 ? topics.slice(0, 33) + "…" : topics;
                            })()}
                          </text>
                        </g>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
