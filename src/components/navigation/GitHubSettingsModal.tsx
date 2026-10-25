"use client";

import React, { useState, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import {
  X,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Key,
  FolderGit2,
  ShieldCheck,
  Radio,
  Cpu,
  Activity,
  Sliders,
  CheckCircle2,
  User,
  Database,
  Trash2,
  RotateCcw,
  Lock,
  Sparkles,
  Leaf,
} from "lucide-react";
import confetti from "canvas-confetti";

interface GitHubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "ai" | "github" | "data";
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

export function GitHubSettingsModal({
  isOpen,
  onClose,
  initialTab = "ai",
}: GitHubSettingsModalProps) {
  const {
    settings,
    updateSettings,
    syncWithGitHub,
    pullFromGitHub,
    isSyncing,
    language,
    memories,
    clearAllData,
    clearTestData,
    resetDemoData,
    appMode,
    loadDemoData,
    switchToProductionMode,
  } = useMemory();

  const [activeTab, setActiveTab] = useState<"ai" | "github" | "data">(initialTab);

  // GitHub State
  const [repoInput, setRepoInput] = useState(settings.github.repo || "");
  const [patInput, setPatInput] = useState(settings.github.pat || "");
  const [autoSyncInput, setAutoSyncInput] = useState<boolean>(
    Boolean(settings.github.auto_sync)
  );
  const [showToken, setShowToken] = useState(false);
  const [detectedUser, setDetectedUser] = useState<{
    login: string;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);

  // AI State
  const [aiProvider, setAiProvider] = useState<
    "gemini" | "openai" | "claude" | "deepseek" | "custom" | "local"
  >(settings.ai?.provider || "gemini");
  const [aiApiKey, setAiApiKey] = useState(settings.ai?.apiKey || "");
  const [aiModel, setAiModel] = useState(settings.ai?.model || "gemini-3.8-flash");
  const [aiBaseUrl, setAiBaseUrl] = useState(settings.ai?.baseUrl || "");
  const [showAiKey, setShowAiKey] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);

  // Sync inputs when settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setRepoInput(settings.github.repo || "");
      setPatInput(settings.github.pat || "");
      setAutoSyncInput(Boolean(settings.github.auto_sync));

      setAiProvider(settings.ai?.provider || "gemini");
      setAiApiKey(settings.ai?.apiKey || "");
      setAiModel(settings.ai?.model || "gemini-3.8-flash");
      setAiBaseUrl(settings.ai?.baseUrl || "");
      setStatusMsg(null);

      if (settings.github.pat) {
        verifyToken(settings.github.pat);
      }
    }
  }, [isOpen, settings]);

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

  if (!isOpen) return null;

  // Preset model options per provider
  const MODEL_OPTIONS: Record<string, string[]> = {
    gemini: ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    claude: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    deepseek: ["deepseek-chat", "deepseek-coder"],
    custom: ["custom-model"],
    local: ["built-in-heuristics"],
  };

  const handleProviderChange = (
    newProvider: "gemini" | "openai" | "claude" | "deepseek" | "custom" | "local"
  ) => {
    setAiProvider(newProvider);
    const presets = MODEL_OPTIONS[newProvider];
    if (presets && presets[0]) {
      setAiModel(presets[0]);
    }
  };

  const handleSaveAISettings = () => {
    updateSettings({
      ai: {
        provider: aiProvider,
        apiKey: aiApiKey.trim(),
        model: aiModel.trim(),
        baseUrl: aiBaseUrl.trim(),
      },
    });

    setStatusMsg({
      text:
        language === "zh"
          ? "AI 模型与配置已保存至本地浏览器 (localStorage)。"
          : "AI configuration saved securely to local storage.",
      isError: false,
    });
  };

  const handleTestAIConnection = async () => {
    setIsTestingAI(true);
    setStatusMsg({
      text:
        language === "zh"
          ? `正在验证 ${aiProvider.toUpperCase()} 连通性...`
          : `Testing connection to ${aiProvider.toUpperCase()}...`,
    });

    try {
      const sampleMemories =
        memories.length > 0
          ? memories.slice(0, 3)
          : [
              {
                id: "test-1",
                schema_version: "1.0",
                type: "moment",
                title: "Morning coffee & architecture reflections",
                content: "Thinking about minimalist systems and clear data contracts.",
                language: "en",
                occurred_at: new Date().toISOString(),
                recorded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                topics: ["coffee", "architecture"],
                source_ids: [],
                relations: [],
                confidence: null,
                status: "active",
                provenance: { capture_method: "manual", ai_generated: false },
              },
            ];

      const res = await fetch("/api/memory/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memories: sampleMemories,
          language,
          provider: aiProvider,
          apiKey: aiApiKey.trim(),
          baseUrl: aiBaseUrl.trim(),
          model: aiModel.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          text:
            language === "zh"
              ? `连通性测试通过！响应引擎：${data.provider}`
              : `Connection successful! Engine: ${data.provider}`,
          isError: false,
        });
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.6 },
          colors: ["#22C55E", "#1D45B8", "#F7C928"],
        });
      } else {
        setStatusMsg({
          text:
            data.error ||
            (language === "zh" ? "连通性测试未通过，请检查 Key 或网络" : "Test failed. Check key or network"),
          isError: true,
        });
      }
    } catch (e: any) {
      setStatusMsg({
        text: language === "zh" ? `测试出错: ${e?.message || e}` : `Test error: ${e?.message || e}`,
        isError: true,
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleSaveAndSyncGitHub = async () => {
    let cleanRepo = normalizeGitHubRepo(repoInput);

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

    // Default to 'my-dayprint-vault' if empty
    if (!cleanRepo) {
      cleanRepo = "my-dayprint-vault";
      setRepoInput(cleanRepo);
    }

    // If single name (no slash), prefix with detected username if available
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

    // Update settings in state & localStorage
    updateSettings({
      github: {
        ...settings.github,
        repo: fullRepo,
        owner: owner || settings.github.owner || "",
        pat: patInput.trim(),
        auto_sync: autoSyncInput,
      },
    });

    setStatusMsg({
      text:
        language === "zh"
          ? "正在连接 GitHub 仓库（若不存在将自动创建私有仓库）..."
          : "Connecting to GitHub (auto-creating private repo if needed)...",
    });

    const res = await syncWithGitHub();
    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#DD2E1E", "#1D45B8", "#F7C928", "#181818"],
      });
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handlePullFromGitHub = async () => {
    const normalized = normalizeGitHubRepo(repoInput);
    if (!patInput.trim()) {
      setStatusMsg({
        text:
          language === "zh"
            ? "请先填写 GitHub Token"
            : "Please specify token first",
        isError: true,
      });
      return;
    }

    setStatusMsg({
      text:
        language === "zh"
          ? "正在从 GitHub 拉取归档数据..."
          : "Pulling archive from GitHub...",
    });

    const res = await pullFromGitHub();
    if (res.success) {
      setStatusMsg({ text: res.message, isError: false });
    } else {
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleDemoSimulateSync = async () => {
    setIsVerifyingToken(true);
    const demoToken = "github_pat_demo_alexreed_sovereign_vault";
    const demoRepo = "alexreed/aetheros-vault";
    setPatInput(demoToken);
    setRepoInput(demoRepo);
    setDetectedUser({
      login: "alexreed",
      name: "Alex Reed",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    });

    setStatusMsg({
      text:
        language === "zh"
          ? "[1/3] 正在验证 GitHub Token 并连接 @alexreed..."
          : "[1/3] Authenticating token & resolving profile @alexreed...",
      isError: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    setStatusMsg({
      text:
        language === "zh"
          ? "[2/3] 正在将 12 条生活小票与 18 条星轨关系编译为 Git 提交树..."
          : "[2/3] Compiling 12 Markdown memory cards & 18 graph edges into Git tree...",
      isError: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const simulatedSha = "886c5e9";
    const nowIso = new Date().toISOString();

    updateSettings({
      github: {
        ...settings.github,
        connected: true,
        repo: demoRepo,
        owner: "alexreed",
        branch: "main",
        pat: demoToken,
        auto_sync: true,
        last_sync: nowIso,
        last_commit_sha: simulatedSha,
      },
    });

    setIsVerifyingToken(false);
    setStatusMsg({
      text:
        language === "zh"
          ? `[3/3] 同步成功！已提交至私有仓库 main 分支 (Commit: ${simulatedSha})`
          : `[3/3] Sync complete! Committed to private vault main branch (Commit: ${simulatedSha})`,
      isError: false,
    });

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#DD2E1E", "#1D45B8", "#F7C928", "#181818"],
    });
  };

  const handleDisconnectGitHub = () => {
    const disconnectedGithub = {
      connected: false,
      repo: "",
      owner: "",
      branch: "main",
      pat: "",
      auto_sync: false,
      last_sync: undefined,
    };
    updateSettings({
      github: disconnectedGithub,
    });
    setRepoInput("");
    setPatInput("");
    setDetectedUser(null);
    setAutoSyncInput(false);
    try {
      const stored = localStorage.getItem("dayprint_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.github = disconnectedGithub;
        localStorage.setItem("dayprint_settings", JSON.stringify(parsed));
      }
    } catch {}
    setStatusMsg({
      text:
        language === "zh"
          ? "已断开与 GitHub 仓库的连接，恢复为本地模式。"
          : "Disconnected from GitHub.",
    });
  };

  const isGitHubConnected = Boolean(
    settings.github.connected && settings.github.pat
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#E5A93C]" />
            <span className="font-semibold text-xs tracking-wider uppercase font-sans">
              {language === "zh"
                ? "系统偏好设置：AI 模型与云端持久化"
                : "PREFERENCES: AI ENGINE & GITHUB SYNC"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-stone-200 bg-stone-100/80 p-1.5 gap-1.5 text-xs font-sans">
          <button
            onClick={() => {
              setActiveTab("ai");
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "ai"
                ? "bg-white text-stone-900 shadow-xs font-semibold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#5B7B94]" />
            <span>{language === "zh" ? "AI 模型与 API Key 配置" : "AI Models & API Keys"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("github");
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "github"
                ? "bg-white text-stone-900 shadow-xs font-semibold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#D9483B]" />
            <span>{language === "zh" ? "GitHub 同步" : "GitHub Sync"}</span>
            {isGitHubConnected && (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.2 font-semibold font-mono">
                ON
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("data");
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "data"
                ? "bg-white text-stone-900 shadow-xs font-semibold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#C49A56]" />
            <span>{language === "zh" ? "数据管理与清空" : "Data Management"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs flex flex-col gap-4 bg-[var(--canvas-paper)] font-sans">
          {/* TAB 1: AI MODEL & API KEY */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              {/* Security Privacy Guarantee */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-stone-700">
                  <span className="font-semibold text-stone-900">
                    {language === "zh" ? "私密安全保障：" : "Zero-Upload Privacy Guarantee: "}
                  </span>
                  {language === "zh"
                    ? "您的 API Key 仅保存在当前浏览器的 localStorage 中，绝不上传到任何远程服务器或代码仓库。"
                    : "Your API key is stored exclusively in your browser's local storage and used directly for requests. It is never committed or saved on our servers."}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block font-medium text-stone-900 mb-1.5 flex items-center justify-between">
                  <span>{language === "zh" ? "1. 选择 AI 模型服务商 (Provider)：" : "1. Select AI Provider:"}</span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {aiProvider.toUpperCase()}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "gemini", name: "Google Gemini", tag: "3.8 / 2.5 Flash" },
                    { id: "openai", name: "OpenAI", tag: "GPT-4o / mini" },
                    { id: "claude", name: "Anthropic Claude", tag: "Sonnet / Haiku" },
                    { id: "deepseek", name: "DeepSeek", tag: "V3 / R1" },
                    { id: "custom", name: "Custom Proxy", tag: "OpenAI Spec" },
                    { id: "local", name: "内置本地引擎", tag: "No Key Needed" },
                  ].map((p) => {
                    const isSelected = aiProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProviderChange(p.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                            : "bg-white text-stone-800 border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{p.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#E5A93C]" />}
                        </div>
                        <span
                          className={`text-[9px] block mt-0.5 ${
                            isSelected ? "text-stone-300" : "text-stone-500"
                          }`}
                        >
                          {p.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Key Input */}
              {aiProvider !== "local" && (
                <div>
                  <label className="block font-bold text-black mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-neutral-600" />
                      <span>
                        {language === "zh"
                          ? `2. ${aiProvider.toUpperCase()} API Key：`
                          : `2. ${aiProvider.toUpperCase()} API Key:`}
                      </span>
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {aiProvider === "gemini" && "本地默认已注入，线上可留空"}
                      {aiProvider === "openai" && "sk-..."}
                      {aiProvider === "claude" && "sk-ant-..."}
                      {aiProvider === "deepseek" && "sk-..."}
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type={showAiKey ? "text" : "password"}
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={
                        aiProvider === "gemini"
                          ? "本地自动读取 .env.local，或在此自定义粘贴"
                          : aiProvider === "claude"
                          ? "sk-ant-api03-..."
                          : "sk-..."
                      }
                      className="w-full p-2.5 pr-16 bg-white rounded-lg border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-2.5 top-2.5 text-[10px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                    >
                      {showAiKey ? (language === "zh" ? "隐藏" : "Hide") : (language === "zh" ? "显示" : "Show")}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {language === "zh"
                      ? "若留空，将自动使用本地认知自演进启发式引擎完成分析，无需担心白屏。"
                      : "If left blank, the app gracefully falls back to built-in local heuristics."}
                  </p>
                </div>
              )}

              {/* Model Selection */}
              {aiProvider !== "local" && (
                <div>
                  <label className="block font-medium text-stone-900 mb-1">
                    {language === "zh" ? "3. 具体模型名称 (Model Name)：" : "3. Model Name:"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="e.g. gemini-3.8-flash / gpt-4o-mini"
                      className="flex-1 p-2.5 bg-white rounded-lg border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-500 shadow-xs"
                    />
                  </div>
                  {MODEL_OPTIONS[aiProvider] && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-stone-500">
                        {language === "zh" ? "推荐选项:" : "Presets:"}
                      </span>
                      {MODEL_OPTIONS[aiProvider].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAiModel(preset)}
                          className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                            aiModel === preset
                              ? "bg-stone-900 text-white border-stone-900 font-semibold"
                              : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Base URL */}
              {(aiProvider === "custom" || aiProvider === "openai" || aiProvider === "deepseek") && (
                <div>
                  <label className="block font-medium text-stone-900 mb-1">
                    {language === "zh"
                      ? "4. 自定义接口地址 (Base URL，选填)："
                      : "4. Custom API Base URL (Optional):"}
                  </label>
                  <input
                    type="text"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full p-2.5 bg-white rounded-lg border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-500 shadow-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GITHUB STORAGE & SYNC - ULTRA STREAMLINED */}
          {activeTab === "github" && (
            <div className="space-y-4">
              {/* Concept Callout & Privacy Notice */}
              <div className="space-y-2">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-stone-700">
                    <span className="font-semibold text-stone-900">
                      {language === "zh" ? "极简 2 步绑定（免手动在 GitHub 建仓）：" : "2-Step Easy Binding: "}
                    </span>
                    {language === "zh"
                      ? "只需粘贴 Token 并输入仓库名。若该仓库不存在，系统将自动在 GitHub 创建私有仓库 (Private Repo)，零繁琐配置！"
                      : "Just paste your token and type a repo name. If it doesn't exist, we auto-create the private repository for you!"}
                  </div>
                </div>

                {/* Explicit Privacy Banner */}
                <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-rose-900">
                    <span className="font-semibold text-rose-950">
                      {language === "zh" ? "隐私安全提醒：" : "Privacy Safety Notice: "}
                    </span>
                    {language === "zh"
                      ? "手账与日记属于私密个人记忆，请确保该仓库必须为【Private 私有仓库】！切勿使用公开 (Public) 仓库，防止个人隐私外泄。系统自动新建仓库时将默认且强制为 Private。"
                      : "Memories contain private personal traces. Always ensure this repository is 【Private】! Never use a Public repository. Auto-created repositories are strictly set to Private."}
                  </div>
                </div>
              </div>

              {/* Demo Mode Interactive Sync Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/90 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {language === "zh" ? "Demo 演示：一键模拟 GitHub 绑定与云端同步" : "Demo Mode: 1-Click Interactive GitHub Sync"}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {language === "zh" ? "无需真实 Token · 自动化全流程体验" : "No real token needed · Test full git workflow"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="demo-sync-btn"
                    onClick={handleDemoSimulateSync}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "体验模拟同步" : "Simulate Sync Now"}</span>
                  </button>
                </div>
              </div>

              {/* Step 1: Personal Access Token (PAT) with Auto-Detection */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-stone-900 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>{language === "zh" ? "输入 GitHub Token (PAT)" : "Enter GitHub Token"}</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Dayprint-Sync"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#2E5AAC] font-medium hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === "zh" ? "一键生成 Token (带权限)" : "Generate Token"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={patInput}
                    onChange={handlePatChange}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full p-2.5 pr-16 bg-white rounded-lg border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-[10px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                  >
                    {showToken ? (language === "zh" ? "隐藏" : "Hide") : (language === "zh" ? "显示" : "Show")}
                  </button>
                </div>

                {/* Live Account Recognition Badge */}
                {isVerifyingToken && (
                  <div className="text-[10px] text-stone-500 flex items-center gap-1.5 pt-0.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#2E5AAC]" />
                    <span>{language === "zh" ? "正在验证 Token 并识别账号..." : "Verifying token..."}</span>
                  </div>
                )}

                {detectedUser && !isVerifyingToken && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-emerald-800 text-[11px] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === "zh" ? "已成功识别 GitHub 账号：" : "Identified Account: "}
                      <span className="font-mono text-stone-900 font-semibold">@{detectedUser.login}</span>
                      {detectedUser.name && ` (${detectedUser.name})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Repository Name (Any name, fully flexible) */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl space-y-2.5 shadow-xs">
                <label className="font-medium text-stone-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>{language === "zh" ? "仓库名称（务必设为私有 Private）" : "Repository Name (Must be Private)"}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    {language === "zh" ? "私密保障 · 自动新建私有库" : "Strictly Private Repo"}
                  </span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="my-dayprint-vault"
                    className="flex-1 p-2.5 bg-white rounded-lg border border-stone-300 font-mono text-xs focus:outline-none focus:border-stone-500 shadow-xs"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-stone-500">{language === "zh" ? "常用快捷填入:" : "Presets:"}</span>
                  {[
                    "my-dayprint-vault",
                    "my-notes",
                    "personal-archive",
                    "life-journal",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRepoInput(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                        repoInput === preset
                          ? "bg-stone-900 text-white border-stone-900 font-semibold"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-stone-500 leading-relaxed">
                  {language === "zh"
                    ? "可直接输入短名字（如 my-notes），或粘贴已存在的仓库网页链接。数据将被保存在该仓库的 dayprint-memory/archive.json 中。"
                    : "Enter any short name (e.g. my-notes) or full URL. All memories are saved to dayprint-memory/archive.json."}
                </p>
              </div>

              {/* Step 3: Real-time Auto-Sync Toggle */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-medium text-stone-900 flex items-center gap-2">
                    <Radio
                      className={`w-3.5 h-3.5 ${
                        autoSyncInput ? "text-emerald-600" : "text-stone-400"
                      }`}
                    />
                    <span>
                      {language === "zh" ? "实时自动同步 (Real-time Auto Sync)" : "Auto-Sync on Changes"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {language === "zh"
                      ? "开启后，添加碎片或归档小票 5 秒后在后台静默提交至 GitHub"
                      : "Automatically commits to GitHub in background 5s after any edit"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoSyncInput(!autoSyncInput)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center cursor-pointer p-0.5 ${
                    autoSyncInput ? "bg-emerald-600" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform transform ${
                      autoSyncInput ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Connected Status Details */}
              {isGitHubConnected && (
                <div className="p-3.5 bg-stone-100/80 rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-600">
                      {language === "zh" ? "关联仓库：" : "Repository: "}
                    </span>
                    <a
                      href={`https://github.com/${settings.github.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#2E5AAC] hover:underline flex items-center gap-1"
                    >
                      <span>{settings.github.repo}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">
                      {language === "zh" ? "云端归档路径：" : "Remote File: "}
                    </span>
                    <span className="font-mono text-stone-800">
                      dayprint-memory/archive.json
                    </span>
                  </div>
                  {settings.github.last_sync && (
                    <div className="flex justify-between">
                      <span className="text-stone-600">
                        {language === "zh" ? "上次同步：" : "Last Sync: "}
                      </span>
                      <span className="font-mono text-stone-700">
                        {new Date(settings.github.last_sync).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {settings.github.last_commit_sha && (
                    <div className="flex justify-between">
                      <span className="text-stone-600">
                        {language === "zh" ? "Git Commit SHA：" : "Verified Commit: "}
                      </span>
                      <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {settings.github.last_commit_sha}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 mt-1 border-t border-stone-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      {language === "zh"
                        ? "断开后将停止云端同步，本地记忆完好保留"
                        : "Stops cloud sync; local memories remain intact"}
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectGitHub}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {language === "zh" ? "断开 GitHub 连接" : "Disconnect GitHub"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATA MANAGEMENT & RESET */}
          {activeTab === "data" && (
            <div className="space-y-4">
              {/* App Mode Switch Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono-meta">
                    {language === "zh" ? "运行版本模式" : "Application Mode"}
                  </h4>
                  <span className="text-[10px] text-stone-500">
                    {language === "zh" ? "随时可无缝切换与载入" : "Switch or restore anytime"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Demo Card */}
                  <div
                    onClick={() => {
                      if (appMode !== "demo") {
                        loadDemoData();
                        setStatusMsg({
                          text: language === "zh" ? "已切换至演示版，并载入全部评测示例数据！" : "Switched to Demo Mode with mock memories loaded!",
                          isError: false,
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      appMode === "demo"
                        ? "border-amber-400 bg-amber-50/70 shadow-xs"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-stone-900">
                          {language === "zh" ? "✨ 演示体验版" : "✨ Demo Mode"}
                        </span>
                      </div>
                      {appMode === "demo" && (
                        <span className="text-[10px] font-mono-meta font-bold px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                          {language === "zh" ? "当前运行" : "ACTIVE"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      {language === "zh"
                        ? "专为 Hackathon 评测与特性探索设计。预置蒙德里安、代官山旧书店等丰富图谱、小票存根与认知档案。"
                        : "Designed for hackathon review & feature exploration. Preloaded with rich constellation graphs, daily notes & receipts."}
                    </p>
                  </div>

                  {/* Production Card */}
                  <div
                    onClick={() => {
                      if (appMode !== "production") {
                        const confirmClear = window.confirm(
                          language === "zh"
                            ? "切换至正式版：是否同时清空演示 Mock 数据，开启一张全新空白画卷？\n(确定 = 纯净空白手账，取消 = 保留现有记录继续)"
                            : "Switch to Personal Journal: Wipe mock data for a clean canvas?\n(OK = Clean canvas, Cancel = Keep existing notes)"
                        );
                        switchToProductionMode(confirmClear);
                        setStatusMsg({
                          text: language === "zh" ? "已切换至正式版！" : "Switched to Personal Journal Mode!",
                          isError: false,
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      appMode === "production"
                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-stone-900">
                          {language === "zh" ? "🌱 正式个人手账" : "🌱 Personal Journal"}
                        </span>
                      </div>
                      {appMode === "production" && (
                        <span className="text-[10px] font-mono-meta font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                          {language === "zh" ? "当前运行" : "ACTIVE"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      {language === "zh"
                        ? "专属你的私密日常手账与终身思考资产。纯净空白，无冗余数据，支持随时一键载入示例数据。"
                        : "Your authentic personal memory ledger. Clean slate without mock items, with 1-click demo restore anytime."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-stone-700">
                  <span className="font-semibold text-stone-900">
                    {language === "zh" ? "数据状态：" : "Current Data: "}
                  </span>
                  {language === "zh"
                    ? `当前本地共沉淀 ${memories.length} 条记忆碎片。您可以在此一键移除内置的测试数据，或彻底清空以重获干净空白页。`
                    : `Currently ${memories.length} memory records stored locally. You can clear demo data or wipe clean anytime.`}
                </div>
              </div>

              {/* Action 1: Clear Test/Demo Data */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs">
                    {language === "zh" ? "仅清空内置测试数据" : "Remove Demo / Test Data"}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === "zh"
                      ? "移除蒙德里安、代官山旧书店等初始测试数据，保留您自己创建的真实记忆。"
                      : "Removes default Mondrian / bookstore test entries while keeping your own notes."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        language === "zh"
                          ? "确定要移除所有内置测试数据吗？"
                          : "Remove all built-in demo items?"
                      )
                    ) {
                      clearTestData();
                      setStatusMsg({
                        text: language === "zh" ? "已成功清理所有内置测试数据！" : "Demo data removed successfully!",
                        isError: false,
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium cursor-pointer transition-colors shrink-0"
                >
                  {language === "zh" ? "清理测试数据" : "Clean Demo Data"}
                </button>
              </div>

              {/* Action 2: Clear All Data */}
              <div className="p-4 bg-white border border-rose-200/80 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <h4 className="font-semibold text-rose-700 text-xs flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "彻底清空全部数据" : "Wipe All Records (Clean Slate)"}</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === "zh"
                      ? "抹去本地所有记忆、关系图谱连线及小票存根，回到全新纯净状态。"
                      : "Erases all local memories, relationships, and receipts for a completely fresh start."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        language === "zh"
                          ? "警告：此操作将清空本地全部记忆与画板记录，确认清空吗？"
                          : "Warning: This will wipe all local memories and notes. Proceed?"
                      )
                    ) {
                      clearAllData();
                      setStatusMsg({
                        text: language === "zh" ? "已彻底清空所有本地数据，画布已重置！" : "All local data wiped successfully!",
                        isError: false,
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 text-xs font-medium cursor-pointer transition-colors shrink-0"
                >
                  {language === "zh" ? "清空全部" : "Wipe All"}
                </button>
              </div>

              {/* Action 3: Restore Demo Data */}
              <div className="p-4 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#5B7B94]" />
                    <span>{language === "zh" ? "重新载入官方示例" : "Restore Demo Memories"}</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === "zh"
                      ? "若您想再次体验完整的图谱星轨与多维排版联动，可一键重装示例数据。"
                      : "Reload full knowledge constellation demo to explore features and layouts."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        language === "zh"
                          ? "重新载入示例数据将覆盖当前画板，确认载入吗？"
                          : "Restore demo data? This will overwrite current canvas."
                      )
                    ) {
                      resetDemoData();
                      setStatusMsg({
                        text: language === "zh" ? "已重新载入官方示例数据！" : "Demo memories restored!",
                        isError: false,
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium cursor-pointer transition-colors shrink-0"
                >
                  {language === "zh" ? "载入示例" : "Load Demo"}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 ${
                statusMsg.isError
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {statusMsg.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            {activeTab === "github" && isGitHubConnected && (
              <button
                type="button"
                onClick={handleDisconnectGitHub}
                className="text-xs text-red-600 hover:text-red-800 underline font-medium cursor-pointer"
              >
                {language === "zh" ? "断开 GitHub 连接" : "Disconnect GitHub"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "data" ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
              >
                {language === "zh" ? "完成" : "Done"}
              </button>
            ) : activeTab === "ai" ? (
              <>
                <button
                  type="button"
                  onClick={handleTestAIConnection}
                  disabled={isTestingAI}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                  title="Test AI model connection"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingAI ? "animate-spin text-[#2E5AAC]" : "text-stone-500"}`} />
                  <span>
                    {isTestingAI
                      ? language === "zh"
                        ? "测试中..."
                        : "Testing..."
                      : language === "zh"
                      ? "测试连通性"
                      : "Test Connection"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAISettings}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#E5A93C] text-stone-900 hover:bg-[#d89b2b] transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "保存 AI 配置" : "Save AI Config"}</span>
                </button>
              </>
            ) : (
              <>
                {isGitHubConnected && (
                  <button
                    type="button"
                    onClick={handlePullFromGitHub}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                    title="Pull and restore archive from GitHub"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === "zh" ? "从 GitHub 拉取" : "Pull"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAndSyncGitHub}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#E5A93C] text-stone-900 hover:bg-[#d89b2b] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSyncing
                      ? language === "zh"
                        ? "正在提交..."
                        : "Committing..."
                      : language === "zh"
                      ? "一键绑定并备份"
                      : "One-Click Bind & Sync"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
