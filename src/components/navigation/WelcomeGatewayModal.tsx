"use client";

import React, { useState } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  FolderGit2,
  Sparkles,
  Leaf,
  Lock,
  ShieldCheck,
  Check,
  ExternalLink,
  X,
  RefreshCw,
  AlertCircle,
  Key,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DayprintLogo } from "@/components/ui/DayprintLogo";

interface WelcomeGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function normalizeGitHubRepo(input: string): string {
  if (!input) return "";
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^github\.com\//i, "");
  cleaned = cleaned.replace(/\.git$/i, "");
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");
  return cleaned;
}

export function WelcomeGatewayModal({
  isOpen,
  onClose,
}: WelcomeGatewayModalProps) {
  const {
    settings,
    updateSettings,
    syncWithGitHub,
    language,
    loadDemoData,
    switchToProductionMode,
  } = useMemory();

  const [activeTab, setActiveTab] = useState<"github" | "demo">("github");
  const [patInput, setPatInput] = useState("");
  const [repoInput, setRepoInput] = useState("my-dayprint-vault");
  const [showToken, setShowToken] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [detectedUser, setDetectedUser] = useState<{
    login: string;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  // Complete onboarding flag helper
  const completeOnboarding = () => {
    try {
      localStorage.setItem("dayprint_onboarding_completed", "true");
    } catch {}
    onClose();
  };

  // Automatic token verification & user profile resolution
  const verifyToken = async (token: string) => {
    const cleanToken = token.trim();
    if (cleanToken.length < 20) {
      setDetectedUser(null);
      return;
    }
    setIsVerifyingToken(true);
    try {
      const res = await fetch(
        `/api/github/sync?pat=${encodeURIComponent(cleanToken)}&action=user`
      );
      const data = await res.json();
      if (data.success && data.user) {
        setDetectedUser(data.user);
        if (!repoInput.trim()) {
          setRepoInput("my-dayprint-vault");
        }
      } else {
        setDetectedUser(null);
      }
    } catch {
      setDetectedUser(null);
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handlePatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatInput(val);
    if (val.trim().length >= 25) {
      verifyToken(val);
    } else {
      setDetectedUser(null);
    }
  };

  // Handler for connecting user's GitHub
  const handleConnectGitHub = async () => {
    if (!patInput.trim()) {
      setStatusMsg({
        text:
          language === "zh"
            ? "请先粘贴您的 GitHub Personal Access Token (PAT)"
            : "Please enter your GitHub Personal Access Token",
        isError: true,
      });
      return;
    }

    let cleanRepo = normalizeGitHubRepo(repoInput);
    if (!cleanRepo) {
      cleanRepo = "my-dayprint-vault";
      setRepoInput(cleanRepo);
    }

    let fullRepo = cleanRepo;
    let owner = "";
    if (cleanRepo.includes("/")) {
      const parts = cleanRepo.split("/");
      owner = parts[0];
      fullRepo = cleanRepo;
    } else if (detectedUser?.login) {
      owner = detectedUser.login;
      fullRepo = `${detectedUser.login}/${cleanRepo}`;
    }

    setIsConnecting(true);
    setStatusMsg({
      text:
        language === "zh"
          ? "正在连接 GitHub 仓库（若不存在将自动在您的账户创建私有仓库）..."
          : "Connecting to GitHub (auto-creating private repo if needed)...",
    });

    try {
      // 1. Update settings to use user's credentials
      updateSettings({
        github: {
          ...settings.github,
          repo: fullRepo,
          owner: owner || settings.github.owner || "",
          pat: patInput.trim(),
          auto_sync: true,
          connected: true,
        },
      });

      // 2. Switch to production mode (clean canvas for personal memories)
      switchToProductionMode(true);

      // 3. Trigger initial sync to create repository & write schema/README
      const res = await syncWithGitHub();
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22C55E", "#1D45B8", "#F7C928", "#A855F7"],
        });
        completeOnboarding();
      } else {
        setStatusMsg({
          text: res.message || (language === "zh" ? "连接失败，请检查 Token 权限" : "Connection failed, check token permissions"),
          isError: true,
        });
      }
    } catch (e: any) {
      setStatusMsg({
        text: e?.message || (language === "zh" ? "连接过程中发生网络错误" : "Network error during connection"),
        isError: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Handler for trying demo mode
  const handleSelectDemo = () => {
    loadDemoData();
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border border-stone-300/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white/70 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <DayprintLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base font-serif-heading">
                  {language === "zh" ? "欢迎来到 Dayprint 记忆工坊" : "Welcome to Dayprint"}
                </h3>
                <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300/60 font-semibold">
                  Local-First & Git-Native
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === "zh"
                  ? "零中心数据库 · 记忆专属存储于您的 GitHub 私有仓库，绝不串流污染"
                  : "Zero central DB · Your memories live 100% in your private GitHub vault"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={completeOnboarding}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title={language === "zh" ? "跳过" : "Skip"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Two Pathways Navigation */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("github")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "github"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === "zh" ? "🔗 连接专属 GitHub 仓库（推荐）" : "🔗 Connect GitHub Vault (Recommended)"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "demo"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === "zh" ? "✨ 先体验 Demo 演示模式" : "✨ Try Demo Mode First"}</span>
            </button>
          </div>

          {/* TAB 1: CONNECT GITHUB VAULT */}
          {activeTab === "github" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Highlights callout */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-stone-900">
                    {language === "zh" ? "为什么连接 GitHub？" : "Why connect GitHub? "}
                  </span>
                  {language === "zh"
                    ? "Dayprint 没有公共数据库。连接后，您的所有日常手账、AI 提取标签和思维图谱将以 Markdown 文件提交至您名下的私有仓库中，实现永久留存、跨设备同步与完全隐私隔离。"
                    : "Dayprint has no shared database. Your memories are saved as Markdown files directly in your own private GitHub repo, keeping them 100% private and portable."}
                </div>
              </div>

              {/* PAT Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 font-mono-meta">
                    <Key className="w-3.5 h-3.5 text-stone-600" />
                    <span>{language === "zh" ? "1. GitHub Personal Access Token (PAT)" : "1. GitHub Personal Access Token (PAT)"}</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Dayprint%20Memory%20Vault"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline"
                  >
                    <span>{language === "zh" ? "去 GitHub 一键创建 Token (需勾选 repo 权限)" : "Create Token on GitHub (needs repo scope)"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={patInput}
                    onChange={handlePatChange}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx 或 github_pat_..."
                    className="w-full h-10 px-3.5 pr-20 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {isVerifyingToken && (
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {showToken ? (language === "zh" ? "隐藏" : "Hide") : (language === "zh" ? "显示" : "Show")}
                    </button>
                  </div>
                </div>

                {/* Detected User Feedback */}
                {detectedUser && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs text-emerald-900 animate-in fade-in duration-150">
                    {detectedUser.avatar_url && (
                      <img
                        src={detectedUser.avatar_url}
                        alt={detectedUser.login}
                        className="w-5 h-5 rounded-full border border-emerald-300"
                      />
                    )}
                    <span className="font-semibold">@{detectedUser.login}</span>
                    <span className="text-[11px] text-emerald-700">
                      {language === "zh" ? "身份验证通过 · 专属私有存储已就绪" : "Authenticated · Ready to link private vault"}
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />
                  </div>
                )}
              </div>

              {/* Repo Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 font-mono-meta">
                  <FolderGit2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>{language === "zh" ? "2. 目标私有仓库名称" : "2. Private Repository Name"}</span>
                </label>
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="my-dayprint-vault"
                  className="w-full h-10 px-3.5 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                />
                <p className="text-[11px] text-stone-500">
                  {language === "zh"
                    ? "提示：若仓库尚未创建，Dayprint 将使用您的 Token 自动在您的账号下新建私有 (Private) 仓库。"
                    : "Tip: If the repository doesn't exist, Dayprint will automatically create a private repository on your account."}
                </p>
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    statusMsg.isError
                      ? "bg-rose-50 border border-rose-200 text-rose-800"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  }`}
                >
                  {statusMsg.isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Primary Connect Button */}
              <button
                type="button"
                onClick={handleConnectGitHub}
                disabled={isConnecting}
                className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === "zh" ? "正在连接并初始化私有仓库..." : "Connecting & Initializing Vault..."}</span>
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span>{language === "zh" ? "连接并开启我的专属手账" : "Connect & Start Personal Journal"}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: EXPLORE DEMO MODE */}
          {activeTab === "demo" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{language === "zh" ? "零门槛直接体验" : "Instant Exploration Without Setup"}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {language === "zh"
                    ? "无需 GitHub 账号与 Token，一键载入已预置的蒙德里安星轨、生活小票存根与认知记忆卡片，即刻感受全部交互特性。后续随时可在顶部导航栏连接 GitHub 开启个人正式手账。"
                    : "No GitHub credentials needed. Instantly explore preloaded demo memories, visual constellation graphs, and daily receipts. You can link your private GitHub vault anytime later."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                  <div className="font-semibold text-stone-900">
                    {language === "zh" ? "🌟 蒙德里安双语图谱" : "🌟 Living Constellation"}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {language === "zh" ? "力导向关系网络与时间引力流" : "Force-directed relational nodes & timelines"}
                  </div>
                </div>
                <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                  <div className="font-semibold text-stone-900">
                    {language === "zh" ? "🧾 每日灵感小票存根" : "🧾 Daily Receipt Slips"}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {language === "zh" ? "复古热敏打印风每日总结与盖章" : "Thermal-print style end-of-day reflection"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSelectDemo}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === "zh" ? "以 Demo 模式进入体验" : "Enter in Demo Mode"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-stone-200/80 bg-stone-50/80 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-stone-400" />
            <span>
              {language === "zh"
                ? "所有凭据仅保存在当前浏览器本地，绝不上报中心服务器"
                : "Credentials stay in your local browser only"}
            </span>
          </div>
          <button
            type="button"
            onClick={completeOnboarding}
            className="text-stone-400 hover:text-stone-700 underline cursor-pointer"
          >
            {language === "zh" ? "稍后决定" : "Decide later"}
          </button>
        </div>
      </div>
    </div>
  );
}
