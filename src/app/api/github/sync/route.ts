import { NextRequest, NextResponse } from "next/server";
import { parseMarkdownContent } from "@/lib/vault-parser";
import { sendFeishuAlert } from "@/lib/feishu-notify";

function cleanGitHubRepo(
  input: string,
  fallbackOwner?: string
): { owner: string; repoName: string; fullRepo: string } | null {
  if (!input) return null;
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^github\.com\//i, "");
  cleaned = cleaned.replace(/\.git$/i, "");
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repoName: parts[1],
      fullRepo: `${parts[0]}/${parts[1]}`,
    };
  } else if (parts.length === 1 && fallbackOwner) {
    return {
      owner: fallbackOwner,
      repoName: parts[0],
      fullRepo: `${fallbackOwner}/${parts[0]}`,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pat = body.pat || process.env.GITHUB_PAT || "";
    const repo =
      body.repo ||
      process.env.GITHUB_STORAGE_REPO ||
      process.env.GITHUB_REPO ||
      "katherinecym/Dayprint-storage";
    const { memories, relationships, receipts, autoCreate = true } = body;

    if (!pat) {
      await sendFeishuAlert({
        title: "Dayprint Storage 同步告警：缺失 GitHub Token",
        message: "Dayprint 云端同步被触发，但未检测到有效的 GitHub Personal Access Token (PAT)。",
        actionGuide: "请在 Dayprint App 偏好设置中配置您的 GitHub PAT，或在 .env.local 中配置 GITHUB_PAT。",
      });
      return NextResponse.json(
        { error: "Personal Access Token is required to commit to GitHub" },
        { status: 400 }
      );
    }

    // 1. Get authenticated user profile to resolve fallback username & verify token
    let authedUser = "";
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Dayprint-App",
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        authedUser = userData.login || "";
      } else if (userRes.status === 401) {
        await sendFeishuAlert({
          title: "Dayprint Storage 告警：GitHub Token 已过期或失效",
          message:
            "Dayprint 云端同步失败：GitHub Personal Access Token 鉴权失败 (HTTP 401 Unauthorized)。",
          actionGuide:
            "请前往 GitHub Settings > Developer settings > Personal access tokens 重新生成 Token 并更新至 Dayprint App 中。",
        });
        return NextResponse.json(
          {
            error:
              "GitHub Personal Access Token 已过期或失效 (401 Unauthorized)。已自动通过飞书机器人向您发送提醒。",
          },
          { status: 401 }
        );
      }
    } catch (e: any) {
      console.warn("User auth verification warning:", e);
    }

    const parsedRepo = cleanGitHubRepo(repo, authedUser);
    if (!parsedRepo) {
      return NextResponse.json(
        {
          error:
            "Invalid repository name. Please enter a repo name (e.g. Dayprint-storage) or full URL.",
        },
        { status: 400 }
      );
    }

    const { owner, repoName, fullRepo } = parsedRepo;

    // 2. Check if repository exists. If not, auto-create it as private repository!
    const repoCheckUrl = `https://api.github.com/repos/${owner}/${repoName}`;
    const repoCheckRes = await fetch(repoCheckUrl, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Dayprint-App",
      },
    });

    let isPublicRepo = false;
    if (repoCheckRes.ok) {
      try {
        const repoData = await repoCheckRes.json();
        if (repoData && repoData.private === false) {
          isPublicRepo = true;
        }
      } catch {
        // ignore JSON parse error
      }
    } else if (repoCheckRes.status === 404 && autoCreate) {
      // Auto-create private repo for the authenticated user
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Dayprint-App",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          private: true,
          description: "Dayprint Personal Memory Workspace (Auto-created, strictly private)",
          auto_init: true,
        }),
      });

      if (!createRes.ok) {
        const createErr = await createRes.json();
        await sendFeishuAlert({
          title: "Dayprint Storage 告警：自动创建私有仓库失败",
          message: `尝试为用户自动创建私有仓库 ${fullRepo} 失败 (HTTP ${createRes.status}): ${createErr.message || "权限不足"}`,
          actionGuide: "请在 GitHub 上手动新建名为 `Dayprint-storage` 的私有仓库，或检查 Token 是否包含仓库管理权限。",
        });
        return NextResponse.json(
          {
            error:
              createErr.message ||
              `Could not auto-create repo '${repoName}'. Please verify PAT permissions.`,
          },
          { status: createRes.status }
        );
      }
      // Brief pause to allow GitHub git tree initialization
      await new Promise((r) => setTimeout(r, 1200));
    } else if (!repoCheckRes.ok && repoCheckRes.status !== 404) {
      const err = await repoCheckRes.json();
      if (repoCheckRes.status === 401) {
        await sendFeishuAlert({
          title: "Dayprint Storage 告警：GitHub Token 已过期",
          message: `访问仓库 ${fullRepo} 失败 (HTTP 401 Unauthorized)。`,
          actionGuide: "请重新生成并更新 GitHub PAT。",
        });
      } else if (repoCheckRes.status === 403) {
        await sendFeishuAlert({
          title: "Dayprint Storage 权限告警：无写入权限",
          message: `Token 无法写入或访问私有仓库 ${fullRepo} (HTTP 403 Forbidden)。`,
          actionGuide: "请确保使用的 Token 已授权给该仓库且勾选了 `repo`（或 Contents 写入）权限。",
        });
      }
      return NextResponse.json(
        { error: err.message || "Failed to access GitHub repository" },
        { status: repoCheckRes.status }
      );
    }

    // 3. Commit snapshot of memories, relationships, and receipts
    const contentPayload = {
      timestamp: new Date().toISOString(),
      memories_count: memories?.length || 0,
      relationships_count: relationships?.length || 0,
      receipts_count: Object.keys(receipts || {}).length,
      memories: memories || [],
      relationships: relationships || [],
      receipts: receipts || {},
    };

    const path = "dayprint-memory/archive.json";
    const message = `chore(dayprint): sync ${contentPayload.memories_count} memories, ${contentPayload.receipts_count} receipts`;

    // Check if archive.json already exists to get its SHA
    const checkUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?t=${Date.now()}`;
    const checkRes = await fetch(checkUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Dayprint-App",
      },
    });

    let sha: string | undefined = undefined;
    if (checkRes.ok) {
      const fileData = await checkRes.json();
      sha = fileData.sha;
    }

    // Upload / Commit file contents
    const uploadUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    let putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Dayprint-App",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(contentPayload, null, 2)).toString("base64"),
        sha,
      }),
    });

    // Auto-recover on 409 conflict
    if (putRes.status === 409) {
      const retryCheck = await fetch(`${uploadUrl}?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Dayprint-App",
        },
      });
      if (retryCheck.ok) {
        const retryData = await retryCheck.json();
        putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Dayprint-App",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            content: Buffer.from(JSON.stringify(contentPayload, null, 2)).toString("base64"),
            sha: retryData.sha,
          }),
        });
      }
    }

    if (!putRes.ok) {
      const errData = await putRes.json();
      if (putRes.status === 401 || putRes.status === 403) {
        await sendFeishuAlert({
          title: "Dayprint Storage 提交失败：Token 权限异常",
          message: `向仓库 ${fullRepo} 提交文件时遇到权限错误 (HTTP ${putRes.status}): ${errData.message || "Forbidden"}`,
          actionGuide: "请检查 Token 是否拥有 Contents 写入权限并重新绑定。",
        });
      }
      return NextResponse.json(
        { error: errData.message || "Failed to commit changes to GitHub" },
        { status: putRes.status }
      );
    }

    const commitData = await putRes.json();

    return NextResponse.json({
      success: true,
      repo: fullRepo,
      owner,
      is_private: !isPublicRepo,
      warning: isPublicRepo
        ? "严重隐私安全风险：检测到该 GitHub 仓库为【公开 (Public)】状态！任何人都能在互联网上看到您的日记与生活轨迹。强烈建议立即前往 GitHub 仓库 Settings > Danger Zone 将其设为【Private 私有】！"
        : undefined,
      message: isPublicRepo
        ? `已同步至 ${fullRepo}（注意：当前为公开仓库，请尽快设为私有）`
        : `已安全同步至私有仓库 ${fullRepo}`,
      commit_url: commitData.commit?.html_url,
      sha: commitData.content?.sha,
      timestamp: contentPayload.timestamp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error during GitHub sync" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Provide default server configurations if requested
    if (action === "default") {
      const envPat = process.env.GITHUB_PAT || "";
      const envRepo =
        process.env.GITHUB_STORAGE_REPO ||
        process.env.GITHUB_REPO ||
        "katherinecym/Dayprint-storage";
      return NextResponse.json({
        success: true,
        has_default: Boolean(envPat),
        default_repo: envRepo,
        default_pat: envPat,
      });
    }

    const pat = searchParams.get("pat") || process.env.GITHUB_PAT || "";
    const repo =
      searchParams.get("repo") ||
      process.env.GITHUB_STORAGE_REPO ||
      process.env.GITHUB_REPO ||
      "katherinecym/Dayprint-storage";

    if (!pat) {
      return NextResponse.json(
        { connected: false, error: "Personal Access Token is required" },
        { status: 400 }
      );
    }

    // 1. Quick User Profile / Token Check
    if (action === "user" || !repo) {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Dayprint-App",
        },
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          await sendFeishuAlert({
            title: "Dayprint Storage 告警：GitHub Token 已过期或失效",
            message: "验证用户 Token 失败 (HTTP 401 Unauthorized)。",
            actionGuide: "请在 GitHub 重新生成 Token 并更新至 Dayprint App 中。",
          });
        }
        return NextResponse.json(
          { error: "Invalid GitHub token. Please verify PAT permissions." },
          { status: userRes.status }
        );
      }

      const userData = await userRes.json();
      return NextResponse.json({
        success: true,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
        },
      });
    }

    // 2. Fetch from GitHub: Try archive.json first, then fallback to reading vault/ directly
    const parsedRepo = cleanGitHubRepo(repo);
    if (!parsedRepo) {
      return NextResponse.json(
        { error: "Valid repository format (owner/repo or URL) is required" },
        { status: 400 }
      );
    }

    const { owner, repoName } = parsedRepo;
    const authHeaders = {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Dayprint-App",
    };

    // A. Check if archive.json already exists in GitHub
    const archivePath = "dayprint-memory/archive.json";
    const checkUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${archivePath}?t=${Date.now()}`;

    const archiveRes = await fetch(checkUrl, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (archiveRes.ok) {
      const data = await archiveRes.json();
      const contentStr = Buffer.from(data.content, "base64").toString("utf-8");
      const parsed = JSON.parse(contentStr);

      return NextResponse.json({
        exists: true,
        connected: true,
        source: "archive.json",
        data: parsed,
        sha: data.sha,
      });
    }

    // B. Direct GitHub Vault Sync: Scan markdown files in vault/ directly via GitHub API
    const vaultUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/vault?t=${Date.now()}`;
    const vaultRes = await fetch(vaultUrl, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (vaultRes.ok) {
      const vaultItems = await vaultRes.json();
      if (Array.isArray(vaultItems)) {
        const mdFiles = vaultItems.filter((item: any) => item.type === "file" && item.name.endsWith(".md"));
        const allMemories: any[] = [];

        for (const file of mdFiles) {
          try {
            const fileRes = await fetch(file.url, { headers: authHeaders, cache: "no-store" });
            if (fileRes.ok) {
              const fileData = await fileRes.json();
              const text = Buffer.from(fileData.content, "base64").toString("utf-8");
              const parsedItems = parseMarkdownContent(file.name, text);

              for (let i = 0; i < parsedItems.length; i++) {
                const p = parsedItems[i];
                allMemories.push({
                  schema_version: "1.0",
                  id: `mem_gh_${file.name.replace(".md", "")}_${i}`,
                  type: p.type || "moment",
                  title: p.title,
                  content: p.content,
                  language: "zh",
                  occurred_at: p.occurred_at || new Date().toISOString(),
                  recorded_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  topics: p.topics,
                  source_ids: [],
                  relations: [],
                  confidence: 0.9,
                  status: "active",
                  provenance: {
                    capture_method: "github_sync",
                    ai_generated: true,
                    source: `github://${owner}/${repoName}/${file.path}`,
                  },
                });
              }
            }
          } catch (fileErr) {
            console.error(`Failed to parse file ${file.name} from GitHub:`, fileErr);
          }
        }

        return NextResponse.json({
          exists: true,
          connected: true,
          source: "github-vault",
          data: {
            memories: allMemories,
            relationships: [],
            receipts: {},
          },
        });
      }
    }

    return NextResponse.json({
      exists: false,
      connected: true,
      message: "Repository accessed successfully, but no archive.json or vault/ directory found.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error during GitHub check" },
      { status: 500 }
    );
  }
}
