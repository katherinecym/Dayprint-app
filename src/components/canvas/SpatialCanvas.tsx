"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { TodayEditor } from "./TodayEditor";
import { MemoryCard } from "./MemoryCard";
import { CanonicalMemory } from "@/types/memory";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Move,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface SpatialCanvasProps {
  memories: CanonicalMemory[];
}

export function SpatialCanvas({ memories }: SpatialCanvasProps) {
  const { selectedDate, setSelectedDate, setSelectedMemoryId, t } = useMemory();

  // Camera State: pan offset (x, y) & zoom scale
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.95 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Group memories into 4 Spatial Thematic Islands (quadrants)
  const ideasCluster = memories.filter((m) => m.type === "idea");
  const momentsCluster = memories.filter((m) => m.type === "moment");
  const learningsCluster = memories.filter((m) => m.type === "learning");
  const decisionsPlansCluster = memories.filter(
    (m) => m.type === "decision" || m.type === "plan"
  );

  // Center the camera on initial load
  useEffect(() => {
    handleResetView();
  }, []);

  const handleResetView = () => {
    setCamera({ x: 0, y: 0, zoom: 0.9 });
  };

  const handleZoom = (delta: number) => {
    setCamera((prev) => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + delta, 0.45), 1.6),
    }));
  };

  // Pan handlers via pointer drag
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when clicking on canvas background or interactive surface (not input/button)
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return;
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      camX: camera.x,
      camY: camera.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setCamera((prev) => ({
      ...prev,
      x: dragStartRef.current.camX + dx,
      y: dragStartRef.current.camY + dy,
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom & pan support
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Pinch / Meta-Wheel Zoom
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.002;
      setCamera((prev) => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom + zoomDelta, 0.45), 1.6),
      }));
    } else {
      // 2D Pan with trackpad or mouse wheel
      setCamera((prev) => ({
        ...prev,
        x: prev.x - e.deltaX * 0.9,
        y: prev.y - e.deltaY * 0.9,
      }));
    }
  };

  // Quick jump to a specific sector
  const jumpToSector = (xOffset: number, yOffset: number) => {
    setCamera({ x: xOffset, y: yOffset, zoom: 0.9 });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden spatial-canvas-bg select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* 1. Spatial Floating Navigation HUD & Compass */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md boogie-border-solid boogie-shadow-sm p-1.5 font-mono-meta text-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F7F2E8] border border-black font-bold">
          <Move className="w-3.5 h-3.5 text-[#3155D9]" />
          <span>PAN ANYWHERE</span>
        </div>

        <div className="flex items-center gap-1 border-l border-neutral-300 pl-2">
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 boogie-border-solid hover:bg-neutral-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-bold px-1">{Math.round(camera.zoom * 100)}%</span>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 boogie-border-solid hover:bg-neutral-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 boogie-border-solid hover:bg-neutral-100 ml-1"
            title="Reset to Center"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Mini Radar / Sector Quick Jump Pills */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-md boogie-border-solid boogie-shadow-sm p-1.5 font-mono-meta text-[11px]">
        <span className="text-neutral-500 font-bold px-1.5">JUMP TO:</span>
        <button
          onClick={() => jumpToSector(0, 0)}
          className="px-2 py-1 boogie-border-solid bg-[#F7F2E8] hover:bg-black hover:text-white font-bold transition-colors"
        >
          [Center: Today]
        </button>
        <button
          onClick={() => jumpToSector(380, 260)}
          className="px-2 py-1 boogie-border-solid bg-[#FFF5F2] hover:bg-[#F25B40] hover:text-white font-bold text-[#F25B40] transition-colors"
        >
          [North-East: Ideas]
        </button>
        <button
          onClick={() => jumpToSector(-380, 260)}
          className="px-2 py-1 boogie-border-solid bg-[#F0F4FF] hover:bg-[#3155D9] hover:text-white font-bold text-[#3155D9] transition-colors"
        >
          [North-West: Learning]
        </button>
        <button
          onClick={() => jumpToSector(380, -260)}
          className="px-2 py-1 boogie-border-solid bg-[#FEFAF0] hover:bg-[#F4C94C] hover:text-black font-bold text-[#9C7507] transition-colors"
        >
          [South-East: Moments]
        </button>
        <button
          onClick={() => jumpToSector(-380, -260)}
          className="px-2 py-1 boogie-border-solid bg-[#FAFAFA] hover:bg-black hover:text-white font-bold text-neutral-800 transition-colors"
        >
          [South-West: Decisions]
        </button>
      </div>

      {/* 3. The Infinite 2D Stage Plane */}
      <div
        style={{
          transform: `translate(calc(50% + ${camera.x}px), calc(50% + ${camera.y}px)) scale(${camera.zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }}
        className="absolute top-0 left-0 w-0 h-0 pointer-events-auto"
      >
        {/* === CENTRAL ANCHOR: Today's Editor & Core Canvas === */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[460px] md:w-[500px]">
          <div className="relative">
            {/* Center Landmark Badge */}
            <div className="absolute -top-7 left-0 px-2 py-0.5 bg-black text-white text-[10px] font-mono-meta font-bold flex items-center gap-1 boogie-border-solid">
              <Compass className="w-3 h-3 text-[#F4C94C]" />
              <span>THE CENTER // TODAY&apos;S ANCHOR</span>
            </div>
            <TodayEditor />
          </div>
        </div>

        {/* === SECTOR 1: NORTH-WEST (LEARNING & KNOWLEDGE CLUSTER) === */}
        <div className="absolute -translate-x-[720px] -translate-y-[450px] w-[500px] flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b-2 border-[#3155D9] pb-1.5">
            <span className="w-3 h-3 bg-[#3155D9] boogie-border-solid" />
            <h4 className="text-xs font-bold uppercase font-mono-meta text-[#3155D9]">
              Sector NW // Learning & Insights ({learningsCluster.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {learningsCluster.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                accentBg="#F0F4FF"
                colorBorder="#3155D9"
                isHorizontalStream={false}
              />
            ))}
          </div>
        </div>

        {/* === SECTOR 2: NORTH-EAST (IDEAS & CREATIVE FLASHES CLUSTER) === */}
        <div className="absolute translate-x-[220px] -translate-y-[450px] w-[500px] flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b-2 border-[#F25B40] pb-1.5">
            <span className="w-3 h-3 bg-[#F25B40] boogie-border-solid" />
            <h4 className="text-xs font-bold uppercase font-mono-meta text-[#F25B40]">
              Sector NE // Ideas & Hypotheses ({ideasCluster.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ideasCluster.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                accentBg="#FFF5F2"
                colorBorder="#F25B40"
                isHorizontalStream={false}
              />
            ))}
          </div>
        </div>

        {/* === SECTOR 3: SOUTH-WEST (DECISIONS & ROADMAP PLANS CLUSTER) === */}
        <div className="absolute -translate-x-[720px] translate-y-[170px] w-[500px] flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1.5">
            <span className="w-3 h-3 bg-black boogie-border-solid" />
            <h4 className="text-xs font-bold uppercase font-mono-meta text-neutral-900">
              Sector SW // Decisions & Intentions ({decisionsPlansCluster.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {decisionsPlansCluster.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                accentBg="#FAFAFA"
                colorBorder="#1F1F1F"
                isHorizontalStream={false}
              />
            ))}
          </div>
        </div>

        {/* === SECTOR 4: SOUTH-EAST (MOMENTS & LIFE SCRAPBOOK CLUSTER) === */}
        <div className="absolute translate-x-[220px] translate-y-[170px] w-[500px] flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b-2 border-[#F4C94C] pb-1.5">
            <span className="w-3 h-3 bg-[#F4C94C] boogie-border-solid" />
            <h4 className="text-xs font-bold uppercase font-mono-meta text-[#9C7507]">
              Sector SE // Moments & Scrapbook ({momentsCluster.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {momentsCluster.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                accentBg="#FEFAF0"
                colorBorder="#F4C94C"
                isHorizontalStream={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
