"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  CanonicalMemory,
  Relationship,
  Collection,
  LayoutType,
  SortOrder,
  AppSettings,
  CanonicalMemorySchema,
  DailyReceipt,
  DEFAULT_TYPE_COLORS,
  MORANDI_PIGMENTS,
  MemoryTimelineLog,
} from "@/types/memory";
import { SEED_MEMORIES, SEED_RELATIONSHIPS, SEED_COLLECTIONS } from "@/lib/seed";
import { Language, translations } from "@/lib/i18n";
import { ensureBilingualMemoryFields } from "@/lib/translator";

export type AppMode = "demo" | "production";

interface MemoryContextType {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  loadDemoData: () => void;
  switchToProductionMode: (clearExisting?: boolean) => void;
  memories: CanonicalMemory[];
  relationships: Relationship[];
  collections: Collection[];
  activeLayout: LayoutType;
  setActiveLayout: (l: LayoutType) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  selectedMemoryId: string | null;
  setSelectedMemoryId: (id: string | null) => void;
  temporalLevel: "all" | "year" | "month" | "day";
  setTemporalLevel: (lvl: "all" | "year" | "month" | "day") => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations["en"];
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  addMemory: (m: Partial<CanonicalMemory>) => CanonicalMemory;
  appendToMemory: (
    id: string,
    update: {
      note: string;
      occurred_at?: string;
      media_url?: string;
      topics?: string[];
    }
  ) => CanonicalMemory | null;
  updateMemory: (id: string, m: Partial<CanonicalMemory>) => void;
  deleteMemory: (id: string) => void;
  addRelationship: (rel: Omit<Relationship, "id" | "created_at">) => void;
  bulkAddRelationships: (rels: Relationship[]) => void;
  deleteRelationship: (id: string) => void;
  syncWithGitHub: () => Promise<{ success: boolean; message: string }>;
  pullFromGitHub: () => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
  resetDemoData: () => void;
  clearAllData: () => void;
  clearTestData: () => void;
  customPositions: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }>;
  setCustomPositions: React.Dispatch<
    React.SetStateAction<Record<string, { col: number; row: number; colSpan: number; rowSpan: number }>>
  >;
  getDailyReceipt: (date: string) => DailyReceipt;
  saveDailyReceipt: (receipt: DailyReceipt) => void;
  storedReceipts: Record<string, DailyReceipt>; // Keyed by YYYY-MM-DD
  connectionModalMemoryId: string | null;
  setConnectionModalMemoryId: (id: string | null) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  viewMode: "daily" | "memory_os" | "graph";
  setViewMode: (mode: "daily" | "memory_os" | "graph") => void;
  customTypes: string[];
  availableTypes: string[];
  addCustomType: (type: string) => void;
  typeColors: Record<string, string>;
  getTypeColor: (type: string) => string;
  updateTypeColor: (type: string, colorHex: string) => void;
}

const MemoryContext = createContext<MemoryContextType | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  language: "zh",
  github: {
    connected: false,
    repo: "",
    owner: "",
    branch: "main",
    pat: "",
    auto_sync: false,
  },
  ai: {
    provider: "gemini",
    apiKey: "",
    model: "gemini-3.8-flash",
    baseUrl: "",
  },
  default_layout: "boogie_matrix",
  time_zone: "Asia/Shanghai",
  reduced_motion: false,
  theme: "boogie-paper",
};

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<CanonicalMemory[]>(SEED_MEMORIES);
  const [relationships, setRelationships] = useState<Relationship[]>(SEED_RELATIONSHIPS);
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS);
  const [activeLayout, setActiveLayout] = useState<LayoutType>("boogie_matrix");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [temporalLevel, setTemporalLevel] = useState<"all" | "year" | "month" | "day">("day");
  // Default to today's date (set dynamically on mount to avoid Next.js prerender error)
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-15");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [language, setLanguage] = useState<Language>("en");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [connectionModalMemoryId, setConnectionModalMemoryId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [customPositions, setCustomPositions] = useState<
    Record<string, { col: number; row: number; colSpan: number; rowSpan: number }>
  >({});
  // Stored daily receipts keyed by date (YYYY-MM-DD)
  const [storedReceipts, setStoredReceipts] = useState<Record<string, DailyReceipt>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"daily" | "memory_os" | "graph">("daily");
  const [appMode, setAppModeState] = useState<AppMode>("demo");
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [typeColors, setTypeColors] = useState<Record<string, string>>(DEFAULT_TYPE_COLORS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dayprint_type_colors");
      if (stored) {
        setTypeColors((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}
  }, []);

  const getTypeColor = (type: string): string => {
    const clean = (type || "").toLowerCase().trim();
    if (typeColors[clean]) return typeColors[clean];
    if (DEFAULT_TYPE_COLORS[clean]) return DEFAULT_TYPE_COLORS[clean];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    return MORANDI_PIGMENTS[Math.abs(hash) % MORANDI_PIGMENTS.length].hex;
  };

  const updateTypeColor = (type: string, colorHex: string) => {
    const clean = (type || "").toLowerCase().trim();
    if (!clean || !colorHex) return;
    setTypeColors((prev) => {
      const next = { ...prev, [clean]: colorHex };
      try {
        localStorage.setItem("dayprint_type_colors", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHydrated = useRef(false);

  // Initialize and load from localStorage or clean canvas
  useEffect(() => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);

      const storedMems = localStorage.getItem("dayprint_memories");
      const storedRels = localStorage.getItem("dayprint_relationships");
      const storedCols = localStorage.getItem("dayprint_collections");
      const storedSettings = localStorage.getItem("dayprint_settings");
      const storedPos = localStorage.getItem("dayprint_custom_positions");
      const storedRcpts = localStorage.getItem("dayprint_receipts");
      const storedMode = localStorage.getItem("dayprint_app_mode") as AppMode | null;
      const currentMode: AppMode = storedMode === "production" ? "production" : "demo";
      setAppModeState(currentMode);

      // 1. Load memories: demo mode guarantees mock seed data is present; production mode keeps personal canvas
      let loadedMems: CanonicalMemory[] = [];
      if (storedMems) {
        try {
          const parsed = JSON.parse(storedMems);
          if (Array.isArray(parsed)) {
            loadedMems = parsed;
          }
        } catch {}
      }

      if (currentMode === "demo") {
        const hasYouPlus = loadedMems.some((m) => m.id.startsWith("mem_you_"));
        if (!hasYouPlus || loadedMems.length === 0) {
          const existingIds = new Set(loadedMems.map((m) => m.id));
          const missing = SEED_MEMORIES.filter((sm) => !existingIds.has(sm.id));
          loadedMems = [...loadedMems, ...missing];
          localStorage.setItem("dayprint_memories", JSON.stringify(loadedMems));
        }
      }
      setMemories(loadedMems);

      // 2. Load relationships
      let loadedRels: Relationship[] = [];
      if (storedRels) {
        try {
          const parsed = JSON.parse(storedRels);
          if (Array.isArray(parsed)) {
            loadedRels = parsed;
          }
        } catch {}
      }

      if (currentMode === "demo") {
        const hasYouPlusRels = loadedRels.some((r) => r.id.startsWith("rel_you_"));
        if (!hasYouPlusRels || loadedRels.length === 0) {
          const existingRelIds = new Set(loadedRels.map((r) => r.id));
          const missingRels = SEED_RELATIONSHIPS.filter((sr) => !existingRelIds.has(sr.id));
          loadedRels = [...loadedRels, ...missingRels];
          localStorage.setItem("dayprint_relationships", JSON.stringify(loadedRels));
        }
      }
      setRelationships(loadedRels);

      // 3. Load collections
      let loadedCols: Collection[] = [];
      if (storedCols) {
        try {
          const parsed = JSON.parse(storedCols);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedCols = parsed;
          }
        } catch {}
      }
      if (loadedCols.length === 0) {
        loadedCols = SEED_COLLECTIONS;
        localStorage.setItem("dayprint_collections", JSON.stringify(SEED_COLLECTIONS));
      }
      setCollections(loadedCols);

      if (storedRcpts !== null) {
        setStoredReceipts(JSON.parse(storedRcpts));
      }

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        const isConnected = Boolean(
          parsed.github?.connected &&
          parsed.github?.pat &&
          parsed.github?.repo
        );
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          github: {
            ...DEFAULT_SETTINGS.github,
            repo: isConnected ? (parsed.github?.repo || "") : "",
            owner: isConnected ? (parsed.github?.owner || "") : "",
            pat: isConnected ? (parsed.github?.pat || "") : "",
            connected: isConnected,
            auto_sync: isConnected ? Boolean(parsed.github?.auto_sync) : false,
          },
        };
        setSettings(mergedSettings);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.default_layout) setActiveLayout(parsed.default_layout);
      }

      if (storedPos) {
        setCustomPositions(JSON.parse(storedPos));
      }

      const storedCustomTypes = localStorage.getItem("dayprint_custom_types");
      if (storedCustomTypes) {
        try {
          const parsed = JSON.parse(storedCustomTypes);
          if (Array.isArray(parsed)) setCustomTypes(parsed);
        } catch {}
      }
    } catch {
      setMemories([]);
      setRelationships([]);
      setCollections([]);
    } finally {
      isHydrated.current = true;
    }
  }, []);

  // Sync state changes to localStorage reliably (including empty arrays)
  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_memories", JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_relationships", JSON.stringify(relationships));
  }, [relationships]);

  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_receipts", JSON.stringify(storedReceipts));
  }, [storedReceipts]);

  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_collections", JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_custom_positions", JSON.stringify(customPositions));
  }, [customPositions]);

  // Real-time synchronization directly with GitHub repository (Single Remote Source of Truth)
  useEffect(() => {
    let isFetching = false;
    const syncWithGitHubCloud = async () => {
      // Guard: Only poll or fetch if user explicitly connected GitHub with valid credentials
      if (!settings.github.connected || !settings.github.pat || !settings.github.repo) {
        return;
      }
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch(
          `/api/github/sync?repo=${encodeURIComponent(settings.github.repo)}&pat=${encodeURIComponent(settings.github.pat)}`
        );
        if (res.ok) {
          const result = await res.json();
          if (result.exists && result.data && Array.isArray(result.data.memories) && result.data.memories.length > 0) {
            setMemories((prev) => {
              const isOnlySeed = prev.length > 0 && prev.every((m) => m.id.startsWith("mem_00") || m.id.startsWith("mem_01"));
              if (isOnlySeed) {
                return result.data.memories;
              }
              const existingIds = new Set(prev.map((m) => m.id));
              const freshItems = result.data.memories.filter((m: any) => !existingIds.has(m.id));
              return freshItems.length > 0 ? [...freshItems, ...prev] : prev;
            });
          }
        }
      } catch {
        // Silently ignore background polling errors
      } finally {
        isFetching = false;
      }
    };

    // Also poll ingest inbox for instant hot messages
    const checkIngestInbox = async () => {
      try {
        const res = await fetch("/api/memory/ingest");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.memories) && data.memories.length > 0) {
          setMemories((prev) => {
            const isOnlySeed = prev.length > 0 && prev.every((m) => m.id.startsWith("mem_00") || m.id.startsWith("mem_01"));
            const existingIds = new Set(prev.map((m) => m.id));
            const freshItems = data.memories.filter((m: any) => !existingIds.has(m.id));
            if (isOnlySeed && freshItems.length > 0) {
              return freshItems;
            }
            return freshItems.length > 0 ? [...freshItems, ...prev] : prev;
          });
        }
      } catch {}
    };

    if (settings.github.connected && settings.github.pat && settings.github.repo) {
      syncWithGitHubCloud();
    }
    checkIngestInbox();

    // Poll GitHub every 20 seconds, and on window focus (only when connected)
    const ghInterval = settings.github.connected && settings.github.pat && settings.github.repo
      ? setInterval(syncWithGitHubCloud, 20000)
      : null;
    const inboxInterval = setInterval(checkIngestInbox, 3000);
    window.addEventListener("focus", syncWithGitHubCloud);

    return () => {
      if (ghInterval) clearInterval(ghInterval);
      clearInterval(inboxInterval);
      window.removeEventListener("focus", syncWithGitHubCloud);
    };
  }, [settings.github.connected, settings.github.pat, settings.github.repo]);

  useEffect(() => {
    if (!isHydrated.current) return;
    localStorage.setItem("dayprint_settings", JSON.stringify({ ...settings, language }));
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", settings.theme || "boogie-paper");
    }
  }, [settings, language]);

  useEffect(() => {
    if (Object.keys(customPositions).length > 0) {
      localStorage.setItem("dayprint_custom_positions", JSON.stringify(customPositions));
    }
  }, [customPositions]);

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      try {
        localStorage.setItem("dayprint_settings", JSON.stringify({ ...next, language }));
      } catch {}
      return next;
    });
  };

  const availableTypes = React.useMemo(() => {
    const base = ["idea", "moment", "learning", "decision", "plan", "achievement"];
    const set = new Set<string>(base);
    customTypes.forEach((t) => {
      const clean = t?.trim();
      if (clean) set.add(clean);
    });
    memories.forEach((m) => {
      const clean = m.type?.trim();
      if (clean) set.add(clean);
    });
    return Array.from(set);
  }, [customTypes, memories]);

  const addCustomType = (type: string) => {
    const clean = type?.trim();
    if (!clean) return;
    setCustomTypes((prev) => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      try {
        localStorage.setItem("dayprint_custom_types", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addMemory = (m: Partial<CanonicalMemory>): CanonicalMemory => {
    const nowIso = new Date().toISOString();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const titleZh = m.title_zh ?? (m.language === "zh" || (!m.language && language === "zh") ? m.title : undefined);
    const titleEn = m.title_en ?? (m.language === "en" || (!m.language && language === "en") ? m.title : undefined);
    const contentZh = m.content_zh ?? (m.language === "zh" || (!m.language && language === "zh") ? m.content : undefined);
    const contentEn = m.content_en ?? (m.language === "en" || (!m.language && language === "en") ? m.content : undefined);

    const primaryTitle = (language === "zh" ? (titleZh || titleEn) : (titleEn || titleZh)) || m.title || "Untitled Memory";
    const primaryContent = (language === "zh" ? (contentZh || contentEn) : (contentEn || contentZh)) || m.content || "";

    const memType = m.type?.trim() || "moment";
    if (m.type && !["idea", "moment", "learning", "decision", "plan"].includes(memType)) {
      addCustomType(memType);
    }

    const occurredAtToUse = m.occurred_at || `${selectedDate}T12:00:00+08:00`;
    const initialLog: MemoryTimelineLog = {
      id: `log_${Date.now()}_0`,
      timestamp: occurredAtToUse,
      content: primaryContent,
      media_url: m.media_url,
    };

    const newRecord: CanonicalMemory = {
      schema_version: "1.0",
      id,
      type: memType,
      title: primaryTitle,
      title_zh: titleZh || (language === "zh" ? primaryTitle : undefined),
      title_en: titleEn || (language === "en" ? primaryTitle : undefined),
      content: primaryContent,
      content_zh: contentZh || (language === "zh" ? primaryContent : undefined),
      content_en: contentEn || (language === "en" ? primaryContent : undefined),
      language,
      memory_level: m.memory_level,
      occurred_at: occurredAtToUse,
      recorded_at: nowIso,
      updated_at: nowIso,
      topics: m.topics || [],
      source_ids: m.source_ids || [],
      relations: m.relations || [],
      confidence: m.confidence ?? null,
      status: "active",
      provenance: m.provenance || { capture_method: "manual", ai_generated: false },
      color_accent: m.color_accent || getTypeColor(memType),
      media_url: m.media_url,
      timeline_logs: m.timeline_logs && m.timeline_logs.length > 0 ? m.timeline_logs : (primaryContent ? [initialLog] : []),
    };

    const validated = CanonicalMemorySchema.parse(newRecord);
    setMemories((prev) => [validated, ...prev]);

    // Background auto-translate if one language is missing
    const hasZh = Boolean(validated.title_zh || validated.content_zh);
    const hasEn = Boolean(validated.title_en || validated.content_en);
    if ((!hasZh || !hasEn) && (hasZh || hasEn)) {
      ensureBilingualMemoryFields({
        title: validated.title,
        title_zh: validated.title_zh,
        title_en: validated.title_en,
        content: validated.content,
        content_zh: validated.content_zh,
        content_en: validated.content_en,
        currentLang: language,
      }).then((bilingual) => {
        setMemories((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title: language === "zh" ? bilingual.title_zh : bilingual.title_en,
                  title_zh: bilingual.title_zh,
                  title_en: bilingual.title_en,
                  content: language === "zh" ? bilingual.content_zh : bilingual.content_en,
                  content_zh: bilingual.content_zh,
                  content_en: bilingual.content_en,
                }
              : item
          )
        );
      }).catch(console.error);
    }

    return validated;
  };

  const appendToMemory = (
    id: string,
    update: {
      note: string;
      occurred_at?: string;
      media_url?: string;
      topics?: string[];
    }
  ): CanonicalMemory | null => {
    let resultMem: CanonicalMemory | null = null;
    const nowIso = new Date().toISOString();
    const logTime = update.occurred_at || nowIso;
    const timeLabel = new Date(logTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateLabel = logTime.slice(0, 10);

    setMemories((prev) => {
      return prev.map((item) => {
        if (item.id !== id) return item;

        const newLog: MemoryTimelineLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: logTime,
          content: update.note.trim(),
          media_url: update.media_url,
        };

        const existingLogs = (item.timeline_logs && item.timeline_logs.length > 0)
          ? item.timeline_logs
          : item.content
          ? [{
              id: `log_init_${item.id}`,
              timestamp: item.occurred_at,
              content: item.content,
              media_url: item.media_url,
            }]
          : [];

        const updatedLogs = [...existingLogs, newLog];

        const appendedNarrative = item.content
          ? `${item.content}\n\n---\n**[${dateLabel} ${timeLabel} 演进记录]**\n${update.note.trim()}`
          : update.note.trim();

        const updatedTopics = Array.from(new Set([...item.topics, ...(update.topics || [])]));

        const updated: CanonicalMemory = {
          ...item,
          content: appendedNarrative,
          content_zh: item.content_zh
            ? `${item.content_zh}\n\n---\n**[${dateLabel} ${timeLabel} 演进记录]**\n${update.note.trim()}`
            : appendedNarrative,
          content_en: item.content_en
            ? `${item.content_en}\n\n---\n**[${dateLabel} ${timeLabel} Update]**\n${update.note.trim()}`
            : appendedNarrative,
          occurred_at: logTime,
          updated_at: nowIso,
          topics: updatedTopics,
          media_url: update.media_url || item.media_url,
          timeline_logs: updatedLogs,
        };

        resultMem = updated;
        return updated;
      });
    });

    return resultMem;
  };

  const updateMemory = (id: string, m: Partial<CanonicalMemory>) => {
    if (m.type) {
      const cleanType = m.type.trim();
      if (cleanType && !["idea", "moment", "learning", "decision", "plan"].includes(cleanType)) {
        addCustomType(cleanType);
      }
    }

    setMemories((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Preserve independent language edits without mutual interference
        const updatedTitleZh = m.title_zh !== undefined ? m.title_zh : item.title_zh;
        const updatedTitleEn = m.title_en !== undefined ? m.title_en : item.title_en;
        const updatedContentZh = m.content_zh !== undefined ? m.content_zh : item.content_zh;
        const updatedContentEn = m.content_en !== undefined ? m.content_en : item.content_en;

        const updated: CanonicalMemory = {
          ...item,
          ...m,
          title_zh: updatedTitleZh,
          title_en: updatedTitleEn,
          content_zh: updatedContentZh,
          content_en: updatedContentEn,
          title: language === "zh"
            ? (updatedTitleZh || updatedTitleEn || m.title || item.title)
            : (updatedTitleEn || updatedTitleZh || m.title || item.title),
          content: language === "zh"
            ? (updatedContentZh || updatedContentEn || m.content || item.content)
            : (updatedContentEn || updatedContentZh || m.content || item.content),
          updated_at: new Date().toISOString(),
        };

        // If one language is filled and the other is empty, trigger default auto-translation
        const hasZh = Boolean(updated.title_zh || updated.content_zh);
        const hasEn = Boolean(updated.title_en || updated.content_en);
        if ((!hasZh || !hasEn) && (hasZh || hasEn)) {
          ensureBilingualMemoryFields({
            title: updated.title,
            title_zh: updated.title_zh,
            title_en: updated.title_en,
            content: updated.content,
            content_zh: updated.content_zh,
            content_en: updated.content_en,
            currentLang: language,
          }).then((bilingual) => {
            setMemories((latest) =>
              latest.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      title_zh: it.title_zh || bilingual.title_zh,
                      title_en: it.title_en || bilingual.title_en,
                      content_zh: it.content_zh || bilingual.content_zh,
                      content_en: it.content_en || bilingual.content_en,
                    }
                  : it
              )
            );
          }).catch(console.error);
        }

        return updated;
      })
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((item) => item.id !== id));
    setRelationships((prev) =>
      prev.filter((rel) => rel.from_memory_id !== id && rel.to_memory_id !== id)
    );
    if (selectedMemoryId === id) setSelectedMemoryId(null);
  };

  const addRelationship = (rel: Omit<Relationship, "id" | "created_at">) => {
    const newRel: Relationship = {
      ...rel,
      id: `rel_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRelationships((prev) => [newRel, ...prev]);

    setMemories((prev) =>
      prev.map((m) => {
        if (m.id === rel.from_memory_id && !m.relations.includes(rel.to_memory_id)) {
          return { ...m, relations: [...m.relations, rel.to_memory_id] };
        }
        return m;
      })
    );
  };

  const bulkAddRelationships = (newRels: Relationship[]) => {
    setRelationships(newRels);
    setMemories((prev) =>
      prev.map((m) => {
        const relatedIds = newRels
          .filter((r) => r.from_memory_id === m.id || r.to_memory_id === m.id)
          .map((r) => (r.from_memory_id === m.id ? r.to_memory_id : r.from_memory_id));
        return {
          ...m,
          relations: Array.from(new Set([...m.relations, ...relatedIds])),
        };
      })
    );
  };

  const deleteRelationship = (id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
  };

  const syncWithGitHub = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.github.pat || !settings.github.repo) {
      return {
        success: false,
        message:
          language === "zh"
            ? "未配置 GitHub 仓库或 Personal Access Token。可在设置中配置以写入远程仓库。"
            : "No GitHub repo or token provided. Please configure it in Settings.",
      };
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: settings.github.repo,
          pat: settings.github.pat,
          memories,
          relationships,
          receipts: storedReceipts,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        updateSettings({
          github: {
            ...settings.github,
            connected: true,
            last_sync: new Date().toISOString(),
          },
        });
        return {
          success: true,
          message:
            language === "zh"
              ? "已成功同步并提交到您的 GitHub 仓库！"
              : "Successfully committed and synced with your GitHub repository!",
        };
      } else {
        return { success: false, message: data.error || "GitHub sync failed" };
      }
    } catch {
      return { success: false, message: "Network error during GitHub sync" };
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromGitHub = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.github.pat || !settings.github.repo) {
      return {
        success: false,
        message: language === "zh" ? "未配置 GitHub 仓库或 Token" : "Missing GitHub repo or token",
      };
    }

    setIsSyncing(true);
    try {
      const res = await fetch(
        `/api/github/sync?repo=${encodeURIComponent(settings.github.repo)}&pat=${encodeURIComponent(settings.github.pat)}`
      );
      const result = await res.json();

      if (!res.ok) {
        return { success: false, message: result.error || "Failed to pull from GitHub" };
      }

      if (result.exists && result.data) {
        if (Array.isArray(result.data.memories) && result.data.memories.length > 0) {
          setMemories(result.data.memories);
        }
        if (Array.isArray(result.data.relationships)) {
          setRelationships(result.data.relationships);
        }
        if (result.data.receipts && typeof result.data.receipts === "object") {
          setStoredReceipts(result.data.receipts);
        }
        updateSettings({
          github: {
            ...settings.github,
            connected: true,
            last_sync: new Date().toISOString(),
          },
        });
        return {
          success: true,
          message: language === "zh" ? "已成功从 GitHub 拉取并恢复数据！" : "Successfully pulled archive from GitHub!",
        };
      } else {
        return {
          success: true,
          message: language === "zh" ? "仓库连接正常，尚无 archive.json 档案" : "Connected! No archive.json yet.",
        };
      }
    } catch {
      return { success: false, message: "Network error during GitHub pull" };
    } finally {
      setIsSyncing(false);
    }
  };

  // Real-time background auto-sync debouncer (2s after local edits) + beforeunload keepalive flush
  useEffect(() => {
    if (!settings.github.connected || !settings.github.auto_sync || !settings.github.pat || !settings.github.repo) {
      return;
    }

    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    autoSyncTimerRef.current = setTimeout(() => {
      fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: settings.github.repo,
          pat: settings.github.pat,
          memories,
          relationships,
          receipts: storedReceipts,
        }),
      })
        .then((res) => {
          if (res.ok) {
            updateSettings({
              github: {
                ...settings.github,
                last_sync: new Date().toISOString(),
              },
            });
          }
        })
        .catch(() => {});
    }, 2000);

    // Guaranteed flush before browser window/tab closes (using fetch keepalive)
    const handleBeforeUnload = () => {
      if (!settings.github.connected || !settings.github.auto_sync || !settings.github.pat || !settings.github.repo) {
        return;
      }
      try {
        fetch("/api/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            repo: settings.github.repo,
            pat: settings.github.pat,
            memories,
            relationships,
            receipts: storedReceipts,
          }),
        });
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [memories, relationships, storedReceipts, settings.github.connected, settings.github.auto_sync]);

  const setAppMode = (mode: AppMode) => {
    setAppModeState(mode);
    try {
      localStorage.setItem("dayprint_app_mode", mode);
    } catch {}
  };

  const loadDemoData = () => {
    setAppModeState("demo");
    setMemories(SEED_MEMORIES);
    setRelationships(SEED_RELATIONSHIPS);
    setCollections(SEED_COLLECTIONS);
    setStoredReceipts({});
    try {
      localStorage.setItem("dayprint_app_mode", "demo");
      localStorage.setItem("dayprint_memories", JSON.stringify(SEED_MEMORIES));
      localStorage.setItem("dayprint_relationships", JSON.stringify(SEED_RELATIONSHIPS));
      localStorage.setItem("dayprint_collections", JSON.stringify(SEED_COLLECTIONS));
      localStorage.removeItem("dayprint_test_cleaned_v2");
    } catch {}
  };

  const switchToProductionMode = (clearExisting: boolean = false) => {
    setAppModeState("production");
    try {
      localStorage.setItem("dayprint_app_mode", "production");
    } catch {}
    if (clearExisting) {
      setMemories([]);
      setRelationships([]);
      setCollections([]);
      setCustomPositions({});
      setStoredReceipts({});
      setSelectedMemoryId(null);
      try {
        localStorage.setItem("dayprint_memories", JSON.stringify([]));
        localStorage.setItem("dayprint_relationships", JSON.stringify([]));
        localStorage.setItem("dayprint_collections", JSON.stringify([]));
        localStorage.setItem("dayprint_custom_positions", JSON.stringify({}));
        localStorage.setItem("dayprint_receipts", JSON.stringify({}));
      } catch {}
    }
  };

  const resetDemoData = () => {
    loadDemoData();
  };

  const clearAllData = () => {
    switchToProductionMode(true);
  };

  const clearTestData = () => {
    const seedIds = new Set(SEED_MEMORIES.map((s) => s.id));
    setMemories((prev) => {
      const remaining = prev.filter((m) => !seedIds.has(m.id) && !m.id.startsWith("mem_2026101"));
      localStorage.setItem("dayprint_memories", JSON.stringify(remaining));
      return remaining;
    });
    setRelationships((prev) => {
      const remaining = prev.filter(
        (r) => !seedIds.has(r.from_memory_id) && !seedIds.has(r.to_memory_id)
      );
      localStorage.setItem("dayprint_relationships", JSON.stringify(remaining));
      return remaining;
    });
    localStorage.setItem("dayprint_test_cleaned_v2", "true");
  };

  // Generate or retrieve existing receipt for a specific date
  const getDailyReceipt = (date: string): DailyReceipt => {
    if (storedReceipts[date]) {
      return storedReceipts[date];
    }

    const dayMems = memories.filter((m) => m.occurred_at.startsWith(date));
    return {
      id: `receipt_${date}`,
      date,
      moments: dayMems.filter((m) => m.type === "moment").map((m) => m.title),
      ideas: dayMems.filter((m) => m.type === "idea").map((m) => m.title),
      learning: dayMems.filter((m) => m.type === "learning").map((m) => m.title),
      decisions: dayMems.filter((m) => m.type === "decision").map((m) => m.title),
      tomorrow: dayMems.filter((m) => m.type === "plan").map((m) => m.title),
      open_loops: dayMems
        .filter((m) => m.type === "idea" || m.type === "plan")
        .map((m) => `Review: ${m.title}`),
      referenced_memory_ids: dayMems.map((m) => m.id),
      created_at: new Date().toISOString(),
    };
  };

  const saveDailyReceipt = (receipt: DailyReceipt) => {
    setStoredReceipts((prev) => ({
      ...prev,
      [receipt.date]: receipt,
    }));
  };

  const t = translations[language];

  return (
    <MemoryContext.Provider
      value={{
        appMode,
        setAppMode,
        loadDemoData,
        switchToProductionMode,
        memories,
        relationships,
        collections,
        activeLayout,
        setActiveLayout,
        sortOrder,
        setSortOrder,
        selectedMemoryId,
        setSelectedMemoryId,
        temporalLevel,
        setTemporalLevel,
        selectedDate,
        setSelectedDate,
        searchQuery,
        setSearchQuery,
        language,
        setLanguage,
        t,
        settings,
        updateSettings,
        addMemory,
        updateMemory,
        deleteMemory,
        addRelationship,
        bulkAddRelationships,
        deleteRelationship,
        syncWithGitHub,
        pullFromGitHub,
        isSyncing,
        resetDemoData,
        clearAllData,
        clearTestData,
        customPositions,
        setCustomPositions,
        getDailyReceipt,
        saveDailyReceipt,
        storedReceipts,
        connectionModalMemoryId,
        setConnectionModalMemoryId,
        isQuickAddOpen,
        setIsQuickAddOpen,
        viewMode,
        setViewMode,
        customTypes,
        availableTypes,
        addCustomType,
        typeColors,
        getTypeColor,
        updateTypeColor,
        appendToMemory,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
}
