"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemory } from "@/lib/memory-context";
import {
  BookOpen,
  Layers,
  Network,
  Receipt,
  Compass,
  FolderArchive,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  GitBranch,
  SlidersHorizontal,
  Globe,
  PanelLeftClose,
  PanelLeft,
  Search,
  Award,
} from "lucide-react";
import { isSoundEnabled, toggleSoundSetting, playKeyClick } from "@/lib/sound";
import { DayprintLogo } from "@/components/ui/DayprintLogo";

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenReceipt: () => void;
  onOpenWeeklyDigest?: () => void;
  onOpenCareerStudio?: () => void;
  onOpenConstellation?: () => void;
  onOpenArchive: () => void;
  onOpenGitHubSettings: () => void;
  onOpenSearch?: () => void;
}

export function AppSidebar({
  isOpen,
  onToggle,
  onOpenReceipt,
  onOpenWeeklyDigest,
  onOpenCareerStudio,
  onOpenConstellation,
  onOpenArchive,
  onOpenGitHubSettings,
  onOpenSearch,
}: AppSidebarProps) {
  const {
    t,
    language,
    setLanguage,
    viewMode,
    setViewMode,
    settings,
    updateSettings,
    syncWithGitHub,
    isSyncing,
    memories,
  } = useMemory();

  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleToggleSound = () => {
    const next = toggleSoundSetting();
    setSoundOn(next);
  };

  const handleSync = async () => {
    playKeyClick();
    setSyncStatus(t.saving);
    const result = await syncWithGitHub();
    setSyncStatus(result.message);
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const mainNavigation = [
    {
      id: "daily",
      labelZh: "今日记录",
      labelEn: "Daily Journal",
      badge: language === "zh" ? "记录" : "Daily",
      icon: BookOpen,
      descZh: "生活微光 · 瞬时灵感 · 每日脉冲",
      descEn: "Daily living stream & notes",
    },
    {
      id: "memory_os",
      labelZh: "认知档案",
      labelEn: "Cognitive Ledger",
      badge: language === "zh" ? "特质" : "Traits",
      icon: Layers,
      descZh: "习惯偏好 · 心智模型 · 底层原则",
      descEn: "Mental models & core principles",
    },
    {
      id: "graph",
      labelZh: "关系图谱",
      labelEn: "Knowledge Graph",
      badge: language === "zh" ? "图谱" : "Nodes",
      icon: Network,
      descZh: "概念网络 · 节点星轨 · 双向链接",
      descEn: "Knowledge constellation & links",
    },
  ] as const;

  const libraryTools = [
    {
      id: "receipts",
      labelZh: "生活存根",
      labelEn: "Life Stubs",
      icon: Receipt,
      action: onOpenReceipt,
      accent: "hover:text-[#C97A63]",
    },
    {
      id: "weekly_digest",
      labelZh: "周度复盘",
      labelEn: "Weekly Digest",
      icon: BookOpen,
      action: onOpenWeeklyDigest,
      accent: "hover:text-[#608066]",
    },
    {
      id: "career",
      labelZh: "履历与成果库",
      labelEn: "Wins & Reports",
      icon: Award,
      action: onOpenCareerStudio,
      accent: "hover:text-[#A66B4E]",
    },
    {
      id: "archive",
      labelZh: "历史档案",
      labelEn: "Time Archive",
      icon: FolderArchive,
      action: onOpenArchive,
      accent: "hover:text-[#7C6F93]",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/40 z-[35] lg:hidden backdrop-blur-2xs"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Rail */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-[var(--canvas-paper)] border-r border-[var(--grid-line)] transition-all duration-300 select-none ${
          isOpen
            ? "w-60 translate-x-0 shadow-lg lg:shadow-none"
            : "-translate-x-full lg:translate-x-0 lg:w-16"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-3.5 border-b border-[var(--grid-line)] flex items-center justify-between gap-2 min-h-[58px]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <DayprintLogo size={32} />
            {isOpen && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-[var(--ink-primary)] tracking-tight truncate">
                    {t.app_title}
                  </h1>
                  <span className="text-[9px] font-sans font-semibold bg-stone-100 text-stone-600 px-1 py-0.2 rounded border border-stone-200">
                    Web
                  </span>
                </div>
                <p className="text-[10px] text-[var(--ink-secondary)] truncate">
                  {t.app_tagline}
                </p>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-[var(--panel-bg)] text-stone-500 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
              title={language === "zh" ? "收起侧边栏" : "Collapse sidebar"}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Middle: Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
          {/* Quick Search trigger (if available) */}
          {onOpenSearch && isOpen && (
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[var(--grid-line)] bg-white text-xs text-stone-500 hover:text-stone-900 hover:border-stone-400 transition-colors shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                <span className="text-[11px] font-normal">
                  {language === "zh" ? "全局检索记忆..." : "Search..."}
                </span>
              </div>
              <kbd className="text-[10px] font-sans font-medium bg-stone-100 px-1 py-0.2 rounded border border-stone-200 text-stone-500">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Primary View Modes */}
          <div className="space-y-1">
            {isOpen && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                {language === "zh" ? "工作空间" : "Workspaces"}
              </div>
            )}
            {mainNavigation.map((nav) => {
              const isActive = viewMode === nav.id;
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    playKeyClick();
                    setViewMode(nav.id as any);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative group ${
                    isActive
                      ? "bg-white text-stone-900 font-semibold shadow-xs border border-stone-200/90"
                      : "text-stone-600 hover:bg-stone-200/40 hover:text-stone-900"
                  }`}
                  title={language === "zh" ? nav.descZh : nav.descEn}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C97A63]" : "text-stone-500 group-hover:text-stone-800"}`} />
                  {isOpen && (
                    <div className="flex-1 min-w-0 flex items-center justify-between text-left">
                      <span className="truncate pr-1">{language === "zh" ? nav.labelZh : nav.labelEn}</span>
                      <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-medium shrink-0">
                        {nav.badge}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Journal Library & Tools */}
          <div className="space-y-1 pt-2 border-t border-[var(--grid-line)]">
            {isOpen && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                {language === "zh" ? "复盘与工具" : "Review & Tools"}
              </div>
            )}
            {libraryTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    playKeyClick();
                    tool.action?.();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200/40 hover:text-stone-900 transition-colors cursor-pointer group ${tool.accent}`}
                  title={language === "zh" ? tool.labelZh : tool.labelEn}
                >
                  <Icon className="w-4 h-4 text-stone-500 group-hover:text-stone-900 shrink-0" />
                  {isOpen && (
                    <span className="truncate text-left">{language === "zh" ? tool.labelZh : tool.labelEn}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: Utilities & System Settings */}
        <div className="p-3 border-t border-[var(--grid-line)] space-y-3 bg-[var(--panel-bg)]/50">
          {/* Theme Selector */}
          {isOpen ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                {language === "zh" ? "画布外观" : "Theme"}
              </div>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-stone-200/60 text-xs">
                {[
                  { id: "boogie-paper", labelZh: "米黄", labelEn: "Paper", icon: Sun },
                  { id: "obsidian-dark", labelZh: "暗黑", labelEn: "Dark", icon: Moon },
                  { id: "studio-light", labelZh: "极简白", labelEn: "Light", icon: Laptop },
                ].map((th) => {
                  const isCurrent = settings.theme === th.id;
                  const Icon = th.icon;
                  return (
                    <button
                      key={th.id}
                      onClick={() => updateSettings({ theme: th.id as any })}
                      className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-white text-stone-900 font-semibold shadow-2xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{language === "zh" ? th.labelZh : th.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                const modes = ["boogie-paper", "obsidian-dark", "studio-light"] as const;
                const nextIndex = (modes.indexOf(settings.theme as any) + 1) % modes.length;
                updateSettings({ theme: modes[nextIndex] });
              }}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-stone-200/50 text-stone-600 transition-colors"
              title={language === "zh" ? "切换画布外观" : "Toggle theme"}
            >
              <Sun className="w-4 h-4" />
            </button>
          )}

          {/* Sound & Language Row */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={handleToggleSound}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-[var(--grid-line)] bg-white text-stone-700 hover:bg-stone-50 transition-colors text-xs font-medium cursor-pointer shadow-2xs`}
              title={language === "zh" ? "机械打字音效" : "Typewriter Sound"}
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5 text-[#C97A63]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              )}
              {isOpen && (
                <span className="text-[11px]">
                  {soundOn ? (language === "zh" ? "音效开" : "Sound On") : (language === "zh" ? "音效关" : "Muted")}
                </span>
              )}
            </button>

            <button
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-[var(--grid-line)] bg-white text-stone-700 hover:bg-stone-50 transition-colors text-xs font-medium cursor-pointer shadow-2xs`}
              title={language === "zh" ? "切换界面语言" : "Switch language"}
            >
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-[11px] font-medium">{language === "en" ? "EN" : "中"}</span>
            </button>
          </div>

          {/* GitHub Sync Status Card */}
          <div className="pt-2 border-t border-[var(--grid-line)] flex items-center justify-between gap-1.5">
            <button
              onClick={() => {
                if (!settings.github.pat) {
                  onOpenGitHubSettings();
                } else {
                  handleSync();
                }
              }}
              className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate ${
                settings.github.connected
                  ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60"
                  : "bg-stone-900 text-stone-100 hover:bg-stone-800"
              }`}
              title={settings.github.connected ? `${settings.github.repo} (Click to sync)` : "Connect GitHub"}
            >
              <GitBranch className={`w-3.5 h-3.5 shrink-0 ${settings.github.connected ? "text-emerald-700" : "text-stone-300"}`} />
              {isOpen && (
                <span className="text-[11px] font-medium truncate">
                  {isSyncing
                    ? (language === "zh" ? "同步中..." : "Syncing...")
                    : syncStatus ||
                      (settings.github.connected
                        ? settings.github.repo.split("/")[1] || "GitHub"
                        : language === "zh"
                        ? "连接 GitHub"
                        : "Connect GitHub")}
                </span>
              )}
            </button>

            <button
              onClick={onOpenGitHubSettings}
              className="p-1.5 rounded-lg border border-[var(--grid-line)] bg-white hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer shrink-0 shadow-2xs"
              title={language === "zh" ? "配置 AI 模型与 GitHub 仓库" : "Settings"}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
