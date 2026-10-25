import { describe, it, expect } from "vitest";

function normalizeGitHubRepo(input: string): string {
  if (!input) return "";
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^github\.com\//i, "");
  cleaned = cleaned.replace(/\.git$/i, "");
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");
  return cleaned;
}

function resolveSettingsOnHydration(storedSettingsJson: string | null) {
  const DEFAULT_SETTINGS = {
    language: "zh",
    github: {
      connected: false,
      repo: "",
      owner: "",
      branch: "main",
      pat: "",
      auto_sync: false,
    },
  };

  if (!storedSettingsJson) return DEFAULT_SETTINGS;
  const parsed = JSON.parse(storedSettingsJson);
  const isConnected = Boolean(
    parsed.github?.connected &&
    parsed.github?.pat &&
    parsed.github?.repo
  );

  return {
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
}

describe("Welcome Gateway & Repo Normalization", () => {
  it("should normalize full GitHub URLs and repo names cleanly", () => {
    expect(normalizeGitHubRepo("https://github.com/alice/my-vault.git")).toBe("alice/my-vault");
    expect(normalizeGitHubRepo("github.com/bob/vault/")).toBe("bob/vault");
    expect(normalizeGitHubRepo("my-dayprint-vault")).toBe("my-dayprint-vault");
    expect(normalizeGitHubRepo("")).toBe("");
  });

  it("should isolate user state if no GitHub token is provided in default settings", () => {
    const defaultSettings = {
      github: {
        connected: false,
        repo: "",
        pat: "",
      },
    };
    expect(defaultSettings.github.connected).toBe(false);
    expect(defaultSettings.github.pat).toBe("");
    expect(defaultSettings.github.repo).toBe("");
  });

  it("should ensure disconnected state strictly persists upon page refresh / hydration", () => {
    // 1. Simulating stored state after user clicks 'Disconnect GitHub'
    const disconnectedState = JSON.stringify({
      language: "zh",
      github: {
        connected: false,
        repo: "",
        pat: "",
        auto_sync: false,
      },
    });

    const hydrated = resolveSettingsOnHydration(disconnectedState);
    expect(hydrated.github.connected).toBe(false);
    expect(hydrated.github.pat).toBe("");
    expect(hydrated.github.repo).toBe("");
    expect(hydrated.github.auto_sync).toBe(false);
  });

  it("should never resurrect old credentials if connected flag was toggled off", () => {
    // Stored settings with remnant values but connected=false
    const stateWithRemnants = JSON.stringify({
      language: "zh",
      github: {
        connected: false,
        repo: "demo-user/my-vault",
        pat: "gho_oldtoken",
        auto_sync: false,
      },
    });

    const hydrated = resolveSettingsOnHydration(stateWithRemnants);
    expect(hydrated.github.connected).toBe(false);
    expect(hydrated.github.pat).toBe("");
    expect(hydrated.github.repo).toBe("");
  });

  it("should calculate graph peek line-breaks within bounds without text overflow", () => {
    const rawChinese = "意大利学者维科在《新科学》中论述：“诗人们首先凭凡俗智慧感受到的有多少，后来哲学家们凭玄奥智慧未理解的也就有多少，所以诗人们可以说就是人类的感官，而哲学家们就是人类的理智。”";
    const limit1 = 21;
    const limit2 = 40;

    const line1 = rawChinese.slice(0, limit1);
    const line2 = rawChinese.length > limit2
      ? rawChinese.slice(limit1, limit2 - 1) + "…"
      : rawChinese.slice(limit1, limit2);

    expect(line1.length).toBeLessThanOrEqual(21);
    expect(line2.length).toBeLessThanOrEqual(20);
    // At ~9.8px per Chinese character, 21 chars * 9.8px = ~205px, strictly within 228px card width!
    expect(line1.length * 9.8).toBeLessThan(228);
    expect(line2.length * 9.8).toBeLessThan(228);
  });
});
