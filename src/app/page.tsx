"use client";

import React, { useState } from "react";
import { HeaderBar } from "@/components/navigation/HeaderBar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { MemoryCanvas } from "@/components/canvas/MemoryCanvas";
import { ContextPanel } from "@/components/navigation/ContextPanel";
import { ExpandedMemoryModal } from "@/components/canvas/ExpandedMemory";
import { ConnectionModal } from "@/components/canvas/ConnectionModal";
import { DailyReceiptModal } from "@/components/receipts/DailyReceiptModal";
import { ConstellationModal } from "@/components/constellation/ConstellationModal";
import { ArchiveModal } from "@/components/archive/ArchiveModal";
import { GitHubSettingsModal } from "@/components/navigation/GitHubSettingsModal";
import { CareerStudioModal } from "@/components/career/CareerStudioModal";
import { WeeklyDigestModal } from "@/components/digest/WeeklyDigestModal";
import { MemoryOSView } from "@/components/memory-os/MemoryOSView";
import { GraphNodesView } from "@/components/graph/GraphNodesView";
import { useMemory } from "@/lib/memory-context";

export default function Home() {
  const {
    selectedMemoryId,
    setSelectedMemoryId,
    connectionModalMemoryId,
    setConnectionModalMemoryId,
    viewMode,
  } = useMemory();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isWeeklyDigestOpen, setIsWeeklyDigestOpen] = useState(false);
  const [isCareerStudioOpen, setIsCareerStudioOpen] = useState(false);
  const [isConstellationOpen, setIsConstellationOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isGitHubSettingsOpen, setIsGitHubSettingsOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--canvas-paper)] text-[var(--ink-primary)] transition-colors duration-200">
      {/* 1. Web App Left Navigation Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onOpenReceipt={() => setIsReceiptOpen(true)}
        onOpenWeeklyDigest={() => setIsWeeklyDigestOpen(true)}
        onOpenCareerStudio={() => setIsCareerStudioOpen(true)}
        onOpenConstellation={() => setIsConstellationOpen(true)}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenGitHubSettings={() => setIsGitHubSettingsOpen(true)}
      />

      {/* 2. Main Content Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <HeaderBar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          isContextPanelOpen={isContextPanelOpen}
          onToggleContextPanel={() => setIsContextPanelOpen((prev) => !prev)}
          onOpenConstellation={() => setIsConstellationOpen(true)}
          onOpenGitHubSettings={() => setIsGitHubSettingsOpen(true)}
        />

        {/* Primary Workspace */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {viewMode === "daily" ? (
            <>
              {/* Pristine Daily Journal & Living Stream */}
              <MemoryCanvas />

              {/* Right Side Companion Panel: Today's Timeline & Recorded Notes */}
              {isContextPanelOpen && (
                <ContextPanel
                  isOpen={isContextPanelOpen}
                  onClose={() => setIsContextPanelOpen(false)}
                  onOpenReceipt={() => setIsReceiptOpen(true)}
                  onOpenWeeklyDigest={() => setIsWeeklyDigestOpen(true)}
                  onOpenCareerStudio={() => setIsCareerStudioOpen(true)}
                  onOpenConstellation={() => setIsConstellationOpen(true)}
                  onOpenArchive={() => setIsArchiveOpen(true)}
                  onOpenGitHubSettings={() => setIsGitHubSettingsOpen(true)}
                />
              )}
            </>
          ) : viewMode === "memory_os" ? (
            /* Dedicated L0-L4 Cognitive Memory OS Ledger */
            <MemoryOSView />
          ) : (
            /* Dedicated Full-Screen Knowledge Graph & Relationship Nodes Workspace */
            <GraphNodesView />
          )}
        </main>
      </div>

      {/* 3. Interactive Modals & Expanded Overlays */}
      {selectedMemoryId && (
        <ExpandedMemoryModal
          memoryId={selectedMemoryId}
          onClose={() => setSelectedMemoryId(null)}
        />
      )}

      {connectionModalMemoryId && (
        <ConnectionModal
          memoryId={connectionModalMemoryId}
          onClose={() => setConnectionModalMemoryId(null)}
        />
      )}

      {isReceiptOpen && (
        <DailyReceiptModal onClose={() => setIsReceiptOpen(false)} />
      )}

      {isWeeklyDigestOpen && (
        <WeeklyDigestModal onClose={() => setIsWeeklyDigestOpen(false)} />
      )}

      {isCareerStudioOpen && (
        <CareerStudioModal onClose={() => setIsCareerStudioOpen(false)} />
      )}

      {isConstellationOpen && (
        <ConstellationModal onClose={() => setIsConstellationOpen(false)} />
      )}

      {isArchiveOpen && (
        <ArchiveModal onClose={() => setIsArchiveOpen(false)} />
      )}

      {isGitHubSettingsOpen && (
        <GitHubSettingsModal
          isOpen={isGitHubSettingsOpen}
          onClose={() => setIsGitHubSettingsOpen(false)}
        />
      )}
    </div>
  );
}
