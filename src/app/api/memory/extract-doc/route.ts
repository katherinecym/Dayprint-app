import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

interface ExtractedCard {
  title: string;
  content: string;
  type: string;
  level: "L1" | "L2" | "L3" | "L4";
  topics: string[];
  rationale?: string;
}

// --------------------------------------------------------------------------
// 1. Feishu / Lark OpenAPI Helper
// --------------------------------------------------------------------------
async function fetchFeishuDocContent(url: string): Promise<{ title: string; content: string } | null> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  // Extract doc token from url:
  // e.g. https://domain.feishu.cn/docx/doxcnabcdefg...
  // or https://domain.feishu.cn/wiki/wikcnabcdefg...
  const docxMatch = url.match(/\/docx\/([a-zA-Z0-9]+)/);
  const wikiMatch = url.match(/\/wiki\/([a-zA-Z0-9]+)/);

  if (!docxMatch && !wikiMatch) return null;

  if (!appId || !appSecret) {
    // Attempt public fetch if no app credentials
    return null;
  }

  try {
    // 1. Get Tenant Access Token
    const tokenRes = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
      console.warn("Feishu auth failed:", tokenData);
      return null;
    }
    const accessToken = tokenData.tenant_access_token;

    let docToken = docxMatch ? docxMatch[1] : "";

    // If it's a wiki link, get the doc token
    if (wikiMatch) {
      const wikiToken = wikiMatch[1];
      const wikiRes = await fetch(`https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${wikiToken}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const wikiData = await wikiRes.json();
      if (wikiData.code === 0 && wikiData.data?.node?.obj_token) {
        docToken = wikiData.data.node.obj_token;
      } else {
        docToken = wikiToken;
      }
    }

    if (!docToken) return null;

    // 2. Fetch Document Raw Content
    const contentRes = await fetch(`https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/raw_content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const contentData = await contentRes.json();

    if (contentData.code === 0 && contentData.data?.content) {
      const lines = contentData.data.content.split("\n").filter(Boolean);
      const docTitle = lines[0]?.replace(/^#+\s*/, "") || "飞书笔记";
      return {
        title: docTitle,
        content: contentData.data.content,
      };
    }
  } catch (err) {
    console.error("Error fetching Feishu doc:", err);
  }
  return null;
}

// --------------------------------------------------------------------------
// 2. Google Docs Helper (Export as TXT for public/accessible docs)
// --------------------------------------------------------------------------
async function fetchGoogleDocContent(url: string): Promise<{ title: string; content: string } | null> {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  const docId = match[1];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  try {
    const res = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes("<!DOCTYPE html>")) {
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        return {
          title: lines[0]?.trim() || "Google Doc",
          content: text.trim(),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to fetch Google Doc text export:", e);
  }
  return null;
}

// --------------------------------------------------------------------------
// 3. General Webpage Reader Helper
// --------------------------------------------------------------------------
async function fetchWebpageContent(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "网页笔记";

    // Clean html to readable text
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { title, content: text.slice(0, 8000) };
  } catch (e) {
    console.warn("Webpage fetch error:", e);
    return null;
  }
}

// --------------------------------------------------------------------------
// 4. Rule-Based Fallback Splitter (When LLM is unavailable or offline)
// --------------------------------------------------------------------------
function ruleBasedExtract(text: string, defaultTitle: string): ExtractedCard[] {
  const cards: ExtractedCard[] = [];
  const sections = text.split(/\n(?=#{1,3}\s+|[0-9]+[\.、]\s+|第[一二三四五六七八九十]+[点条章节])/);

  for (const sec of sections) {
    const trimmed = sec.trim();
    if (trimmed.length < 25) continue;

    const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
    const firstLine = lines[0].replace(/^#+\s*|^[0-9]+[\.、]\s*/, "").trim();
    const body = lines.slice(1).join("\n").trim() || firstLine;

    let level: "L1" | "L2" | "L3" | "L4" = "L1";
    let type = "insight";

    if (/原则|底线|信条|非妥协|价值观|belief|principle/i.test(firstLine + body)) {
      level = "L4";
      type = "principle";
    } else if (/思维模型|心智|决策|框架|mental|framework/i.test(firstLine + body)) {
      level = "L3";
      type = "mental_model";
    } else if (/SOP|习惯|方法论|技巧|规范|habit|routine/i.test(firstLine + body)) {
      level = "L2";
      type = "habit";
    } else if (/书|作者|阅读|读后感|摘录|book|reading/i.test(firstLine + body)) {
      level = "L1";
      type = "reading";
    }

    cards.push({
      title: firstLine.slice(0, 40) || defaultTitle,
      content: body.slice(0, 300),
      type,
      level,
      topics: [type, "note_import"],
      rationale: "基于段落语义切分",
    });

    if (cards.length >= 6) break;
  }

  if (cards.length === 0) {
    cards.push({
      title: defaultTitle || "笔记提炼",
      content: text.slice(0, 260),
      type: "insight",
      level: "L2",
      topics: ["note_import"],
      rationale: "纯文本提取",
    });
  }

  return cards;
}

// --------------------------------------------------------------------------
// 5. Main Route POST Handler
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let rawText = "";
    let docTitle = "导入笔记";
    let sourceMeta = "direct_input";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      docTitle = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.split(".").pop()?.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());

      if (ext === "docx") {
        const mammothResult = await mammoth.extractRawText({ buffer });
        rawText = mammothResult.value;
        sourceMeta = `docx:${file.name}`;
      } else {
        // .md, .txt, .json, .csv
        rawText = buffer.toString("utf-8");
        sourceMeta = `${ext || "file"}:${file.name}`;
      }
    } else {
      const body = await req.json();
      const { text, url, title } = body;

      if (title) docTitle = title;

      if (url && typeof url === "string") {
        const trimmedUrl = url.trim();
        sourceMeta = `url:${trimmedUrl}`;

        // 1. Feishu / Lark Doc
        if (trimmedUrl.includes("feishu.cn") || trimmedUrl.includes("larksuite.com")) {
          const feishuResult = await fetchFeishuDocContent(trimmedUrl);
          if (feishuResult) {
            rawText = feishuResult.content;
            docTitle = feishuResult.title || docTitle;
          } else {
            return NextResponse.json(
              {
                error: "无法直接读取该飞书文档。请确保飞书应用已开通文档阅读权限，或者您可直接在飞书全选复制文档内容，粘贴到【文本输入】框中一键萃取！",
                needs_copy_paste: true,
              },
              { status: 403 }
            );
          }
        }
        // 2. Google Docs
        else if (trimmedUrl.includes("docs.google.com/document")) {
          const gdocResult = await fetchGoogleDocContent(trimmedUrl);
          if (gdocResult) {
            rawText = gdocResult.content;
            docTitle = gdocResult.title || docTitle;
          } else {
            return NextResponse.json(
              {
                error: "无法直接读取该 Google Doc。请确保文档分享设置为【知道链接的任何人可查看】，或者直接在文档中全选复制文本粘贴到输入框中！",
                needs_copy_paste: true,
              },
              { status: 403 }
            );
          }
        }
        // 3. General Webpage
        else {
          const webResult = await fetchWebpageContent(trimmedUrl);
          if (webResult) {
            rawText = webResult.content;
            docTitle = webResult.title || docTitle;
          }
        }
      } else if (text && typeof text === "string") {
        rawText = text.trim();
        sourceMeta = "pasted_text";
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "未能提取到有效文本内容，请检查文件或链接。" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------------------------
    // 6. AI Cognition Pyramid Distillation (Gemini 2.5/Flash)
    // --------------------------------------------------------------------------
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    let candidates: ExtractedCard[] = [];

    if (apiKey) {
      const prompt = `你是一个终身知识管理与个人认知操作系统（Dayprint）的资深架构师。
下面是一份来自用户的笔记/文档原始材料（来源: ${docTitle}）。
请深度阅读，并将其按照【认知金字塔】提炼为 2 到 6 张高度凝练、互不重叠的原子记忆卡片（Canonical Memory Cards）：

【认知层级标准】：
- L4 底层信念 (Core Beliefs / First Principles)：根本价值观、不妥协的人生/事业原则。type 为 "principle"。
- L3 心智模型 (Mental Models & Frameworks)：系统思考方式、决策框架、认知人设。type 为 "mental_model"。
- L2 习惯与技能 (Habits, SOPs & Methodologies)：经过验证的工作法、SOP、习惯与偏好。type 为 "habit"。
- L1 关键事实与创作 (Key Projects, Readings & Facts)：具体的项目历程、读书笔记提炼、重要事实与洞见。type 为 "creation" 或 "reading" 或 "insight"。

【提取要求】：
1. 彻底剔除套话、客套话、格式噪声与冗余废话，提炼出高信息浓度的干货。
2. title 必须清晰、具体且具备行动或反思意义（12~28字左右）。
3. content 为 80~180 字的精要叙述或结构化要点，保留核心公式、逻辑与思考。
4. topics 为 2~4 个简洁标签（如 ["架构", "精力管理", "选型"]）。
5. 必须严格输出 JSON 数组格式，不要使用任何解释性文字包裹：

[
  {
    "title": "记忆标题",
    "content": "精简内容要点",
    "type": "principle" | "mental_model" | "habit" | "insight" | "creation" | "reading",
    "level": "L4" | "L3" | "L2" | "L1",
    "topics": ["标签1", "标签2"],
    "rationale": "提炼依据说明"
  }
]

【原始文本材料】：
${rawText.slice(0, 10000)}`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          try {
            const parsed = JSON.parse(responseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              candidates = parsed;
            }
          } catch (pe) {
            console.warn("JSON parse fallback for Gemini response:", pe);
          }
        }
      } catch (err) {
        console.warn("Gemini distillation call failed, falling back to rule-based:", err);
      }
    }

    // Fallback if AI not configured or failed
    if (candidates.length === 0) {
      candidates = ruleBasedExtract(rawText, docTitle);
    }

    return NextResponse.json({
      success: true,
      doc_title: docTitle,
      source_meta: sourceMeta,
      raw_length: rawText.length,
      cards: candidates,
    });
  } catch (error: any) {
    console.error("Extract doc error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse document" },
      { status: 500 }
    );
  }
}
