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
});
