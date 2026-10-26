"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMemory } from "@/lib/memory-context";
import {
  Search,
  Globe,
  GitBranch,
  SlidersHorizontal,
  Network,
  BookOpen,
  Layers,
  Sun,
  Moon,
  Laptop,
  Volume2,
  VolumeX,
  PanelLeft,
  PanelRight,
  PanelRightClose,
  Sparkles,
  Leaf,
  RotateCcw,
  Check,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { OmniSearchModal } from "@/components/search/OmniSearchModal";
import { isSoundEnabled, toggleSoundSetting } from "@/lib/sound";
import { DayprintLogo } from "@/components/ui/DayprintLogo";

interface HeaderBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isContextPanelOpen?: boolean;
  onToggleContextPanel?: () => void;
  onOpenConstellation?: () => void;
  onOpenGitHubSettings?: () => void;
}

export function HeaderBar({
  onToggleSidebar,
  isSidebarOpen,
  isContextPanelOpen,
  onToggleContextPanel,
  onOpenConstellation,
  onOpenGitHubSettings,
}: HeaderBarProps) {
  const {
    t,
    language,
    setLanguage,
    syncWithGitHub,
    isSyncing,
    settings,
    updateSettings,
    viewMode,
    appMode,
    loadDemoData,
    switchToProductionMode,
  } = useMemory();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  const handleToggleSound = () => {
    const next = toggleSoundSetting();
    setSoundOn(next);
  };

  // Global hotkey: Cmd+K / Ctrl+K opens OmniSearch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSync = async () => {
    setSyncStatus(t.saving);
    const result = await syncWithGitHub();
    setSyncStatus(result.message);
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const getWorkspaceTitle = () => {
    if (viewMode === "daily") {
      return {
        titleZh: "今日记录",
        titleEn: "Daily Journal",
        subZh: "生活微光 · 瞬时灵感 · 每日脉冲",
        subEn: "Living stream & daily notes",
        icon: BookOpen,
      };
    } else if (viewMode === "memory_os") {
      return {
        titleZh: "认知档案",
        titleEn: "Cognitive Ledger",
        subZh: "习惯偏好 · 心智模型 · 底层原则",
        subEn: "Mental models & core principles",
        icon: Layers,
      };
    } else {
      return {
        titleZh: "关系图谱",
        titleEn: "Knowledge Graph",
        subZh: "概念网络 · 节点星轨 · 双向链接",
        subEn: "Knowledge constellation & links",
        icon: Network,
      };
    }
  };

  const activeWS = getWorkspaceTitle();
  const WSIcon = activeWS.icon;

  return (
    <header className="sticky top-0 z-30 shrink-0 w-full bg-[var(--canvas-paper)]/95 backdrop-blur-md border-b border-[var(--grid-line)] px-4 py-2.5 flex items-center justify-between gap-3 select-none transition-colors duration-200">
      {/* Left: Sidebar Toggle & Active Workspace Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && !isSidebarOpen && (
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-[var(--grid-line)] bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
              title={language === "zh" ? "展开侧边栏" : "Expand sidebar"}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <DayprintLogo size={24} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
            <WSIcon className="w-3.5 h-3.5 text-[#D9483B]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)] tracking-tight">
                {language === "zh" ? activeWS.titleZh : activeWS.titleEn}
              </h2>
              <span className="text-[10px] text-[var(--ink-muted)] hidden sm:inline truncate max-w-[180px] md:max-w-[280px]">
                / {language === "zh" ? activeWS.subZh : activeWS.subEn}
              </span>
            </div>
          </div>
        </div>

        {/* App Mode Capsule (Demo vs Production) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((prev) => !prev)}
            className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              appMode === "demo"
                ? "bg-amber-50/90 border-amber-300/80 text-amber-900 hover:bg-amber-100"
                : "bg-emerald-50/90 border-emerald-300/80 text-emerald-900 hover:bg-emerald-100"
            }`}
            title={
              appMode === "demo"
                ? (language === "zh"
                  ? "当前为 Demo 演示版（已载入示例数据，点击切换或重置）"
                  : "Currently Demo Mode (Preloaded mock data, click to switch)")
                : (language === "zh"
                  ? "当前为正式手账版（空白纯净画布，点击切换或载入演示数据）"
                  : "Currently Personal Journal (Clean slate, click to switch)")
            }
          >
            {appMode === "demo" ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="font-semibold text-[11px] sm:text-xs">
                  {language === "zh" ? "✨ 演示版" : "✨ Demo"}
                </span>
              </>
            ) : (
              <>
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-[11px] sm:text-xs">
                  {language === "zh" ? "🌱 正式版" : "🌱 Journal"}
                </span>
              </>
            )}
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {isModeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsModeMenuOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50">
                <div className="px-3 py-1.5 border-b border-stone-100">
                  <div className="text-[10px] font-mono-meta font-bold uppercase tracking-wider text-stone-400">
                    {language === "zh" ? "版本与数据模式" : "Application Mode"}
                  </div>
                </div>

                {/* Demo Option */}
                <button
                  type="button"
                  onClick={() => {
                    if (appMode !== "demo") {
                      loadDemoData();
                    }
                    setIsModeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    appMode === "demo" ? "bg-amber-50/70" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {language === "zh" ? "✨ 演示体验版 (Demo)" : "✨ Demo Mode"}
                      </span>
                      {appMode === "demo" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                      {language === "zh"
                        ? "内置 Hackathon 评测数据、蒙德里安图谱星轨与小票"
                        : "Preloaded with mock graph, journal memories & receipts"}
                    </p>
                    <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                      {language === "zh"
                        ? "⚠️ 演示版无法持久存储用户信息"
                        : "⚠️ Demo mode cannot persist user data"}
                    </span>
                  </div>
                </button>

                {/* Production Option */}
                <button
                  type="button"
                  onClick={() => {
                    if (appMode !== "production") {
                      const confirmClear = window.confirm(
                        language === "zh"
                          ? "切换至正式版：是否同时清空演示 Mock 数据，开启一张全新空白手账？\n(确定 = 空白手账，取消 = 保留现有记录继续)"
                          : "Switch to Personal Journal: Wipe mock data for a clean canvas?\n(OK = Clean canvas, Cancel = Keep existing notes)"
                      );
                      switchToProductionMode(confirmClear);
                    }
                    setIsModeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    appMode === "production" ? "bg-emerald-50/70" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {language === "zh" ? "🌱 正式个人手账 (Journal)" : "🌱 Personal Journal"}
                      </span>
                      {appMode === "production" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                      {language === "zh"
                        ? "专属你的真实记忆、随手灵感与认知档案沉淀"
                        : "Private canvas for your authentic notes & daily prints"}
                    </p>
                  </div>
                </button>

                <div className="my-1 border-t border-stone-100" />

                {/* Action: Reload / Reset Demo Data */}
                <button
                  type="button"
                  onClick={() => {
                    loadDemoData();
                    setIsModeMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                  <span>{language === "zh" ? "一键载入官方评测数据" : "Load Official Demo Mock Data"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Omni-Search Trigger Button (Cmd+K) */}
      <div className="flex-1 max-w-sm">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full h-9 flex items-center justify-between px-3 bg-white rounded-lg border border-[var(--grid-line)] text-xs text-stone-500 hover:text-stone-800 hover:border-stone-400 transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0" />
            <span className="truncate">
              {language === "zh"
                ? "智能检索记忆、习惯、偏好..."
                : "Search memories & habits..."}
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono-meta font-bold bg-stone-100 border border-stone-200 rounded text-stone-500 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Action Controls & Utilities */}
      <div className="flex items-center gap-2">
        {/* Quick Theme Cycle Button */}
        <button
          onClick={() => {
            const themes = ["boogie-paper", "obsidian-dark", "studio-light"] as const;
            const nextIdx = (themes.indexOf(settings.theme as any) + 1) % themes.length;
            updateSettings({ theme: themes[nextIdx] });
          }}
          className="h-9 px-2.5 flex items-center gap-1.5 text-xs rounded-lg border border-[var(--grid-line)] bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
          title={language === "zh" ? "切换画布外观主题 (米黄/暗黑/极简白)" : "Cycle theme (Paper / Dark / Light)"}
        >
          {settings.theme === "boogie-paper" ? (
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          ) : settings.theme === "obsidian-dark" ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-stone-600" />
          )}
          <span className="hidden xl:inline text-[11px] font-medium">
            {settings.theme === "boogie-paper"
              ? (language === "zh" ? "米黄纸" : "Paper")
              : settings.theme === "obsidian-dark"
              ? (language === "zh" ? "暗黑" : "Dark")
              : (language === "zh" ? "极简白" : "Light")}
          </span>
        </button>

        {/* User Manual Link */}
        <a
          href="/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-2.5 flex items-center gap-1.5 text-xs rounded-lg border border-[var(--grid-line)] bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
          title={language === "zh" ? "打开 Dayprint 操作手册" : "Open Dayprint User Guide"}
        >
          <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden xl:inline text-[11px] font-medium">
            {language === "zh" ? "手册" : "Manual"}
          </span>
        </a>

        {/* GitHub Sync Button */}
        <div className="h-9 flex items-center rounded-lg border border-[var(--grid-line)] bg-white shadow-2xs overflow-hidden">
          <button
            onClick={() => {
              if (!settings.github.pat && onOpenGitHubSettings) {
                onOpenGitHubSettings();
              } else {
                handleSync();
              }
            }}
            title={
              settings.github.connected
                ? `${t.github_status_connected} (${settings.github.repo}) - ${
                    language === "zh" ? "点击立即同步" : "Click to sync now"
                  }`
                : `${t.github_status_local_only} - ${
                    language === "zh"
                      ? "点击配置您的 GitHub 仓库与 Token"
                      : "Click to configure GitHub repo and token"
                  }`
            }
            className={`h-full flex items-center gap-1.5 px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
              settings.github.connected
                ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                : "bg-stone-900 text-stone-100 hover:bg-stone-800"
            }`}
          >
            <GitBranch
              className={`w-3.5 h-3.5 ${
                settings.github.connected ? "text-emerald-700" : "text-stone-300"
              }`}
            />
            <span className="text-[11px] font-medium hidden md:inline">
              {isSyncing
                ? language === "zh"
                  ? "同步中..."
                  : "Syncing..."
                : syncStatus ||
                  (settings.github.connected
                    ? settings.github.auto_sync
                      ? `${settings.github.repo.split("/")[1] || "Repo"}`
                      : "Synced"
                    : language === "zh"
                    ? "GitHub"
                    : "GitHub")}
            </span>
          </button>

          {onOpenGitHubSettings && (
            <button
              onClick={onOpenGitHubSettings}
              className={`h-full px-1.5 border-l border-stone-200 transition-colors cursor-pointer ${
                settings.github.connected
                  ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
              title={language === "zh" ? "打开偏好设置 (AI 模型与 GitHub 仓库配置)" : "Configure AI & GitHub"}
            >
              <SlidersHorizontal className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Toggle Companion Panel (Daily Timeline & Stubs) */}
        {viewMode === "daily" && onToggleContextPanel && (
          <button
            onClick={onToggleContextPanel}
            className={`h-9 px-2.5 flex items-center gap-1 text-xs rounded-lg border transition-all cursor-pointer shadow-2xs ${
              isContextPanelOpen
                ? "border-[var(--grid-line)] bg-stone-100 text-stone-800 font-medium"
                : "border-[var(--grid-line)] bg-white hover:bg-stone-50 text-stone-600"
            }`}
            title={
              language === "zh"
                ? isContextPanelOpen
                  ? "折叠今日时间流与存根面板 (进入全屏纯净画卷)"
                  : "展开今日时间流与存根面板"
                : isContextPanelOpen
                ? "Collapse companion panel (Zen mode)"
                : "Expand companion panel"
            }
          >
            {isContextPanelOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-[#C97A63]" />
            ) : (
              <PanelRight className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span className="text-[11px] font-medium hidden lg:inline">
              {isContextPanelOpen
                ? (language === "zh" ? "纯净画卷" : "Zen Canvas")
                : (language === "zh" ? "时间流" : "Timeline")}
            </span>
          </button>
        )}
      </div>

      {/* Global OmniSearch Modal */}
      <OmniSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
