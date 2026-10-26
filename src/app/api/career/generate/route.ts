import { NextResponse } from "next/server";
import { dateKeyOf } from "@/lib/date";
import { CanonicalMemory, getLocalizedTitle, getLocalizedContent } from "@/types/memory";

interface CareerStarItem {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  polished_bullet: string;
  metrics_highlight: string;
}

interface CareerGenerateResponse {
  success: boolean;
  provider: string;
  report: string;
  star_items: CareerStarItem[];
  error?: string;
}

function cleanJsonText(raw: string): string {
  return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
}

/**
 * Robust local fallback when API key is unavailable or external LLM network is offline.
 */
function localRuleFallback(
  memories: CanonicalMemory[],
  scope: string,
  lang: "zh" | "en",
  dateStr: string
): CareerGenerateResponse {
  const scopeLabel =
    scope === "this_week"
      ? (lang === "zh" ? "本周工作复盘与交付周报" : "Weekly Work & Delivery Report")
      : scope === "this_month"
      ? (lang === "zh" ? "本月工作述职与重点里程碑" : "Monthly Accomplishments & Milestones")
      : (lang === "zh" ? "近期工作胜仗与关键交付总结" : "Recent Work Wins & Deliverables Summary");

  const starItems: CareerStarItem[] = memories.map((m) => {
    const title = getLocalizedTitle(m, lang);
    const content = getLocalizedContent(m, lang);
    const cleanContent = content.replace(/【[^】]+】/g, "").trim();

    const situation =
      m.star?.situation ||
      (lang === "zh" ? "传统流程存在割裂与操作摩擦，急需打通端到端高可用闭环" : "Fragmented legacy workflow causing friction and operational overhead");
    const task =
      m.star?.task ||
      (lang === "zh" ? "攻克核心业务瓶颈，构建标准化高可用的模块方案" : "Eliminate critical bottlenecks and establish reliable delivery pipelines");
    const action =
      m.star?.action ||
      (cleanContent.slice(0, 100) || title);
    const result =
      m.star?.result ||
      (lang === "zh" ? "实现全链路闭环上线，大幅降低协同摩擦，提升流转效能约 40%" : "Shipped end-to-end production solution, boosting operational efficiency by ~40%");

    const bullet =
      lang === "zh"
        ? `主导交付「${title}」：针对${situation}，采取${action}，最终${result}。`
        : `Spearheaded "${title}": Addressed ${situation} by executing ${action}, successfully achieving ${result}.`;

    return {
      id: m.id,
      title,
      situation,
      task,
      action,
      result,
      polished_bullet: bullet,
      metrics_highlight: lang === "zh" ? "端到端闭环交付 · 提升 40%" : "Production Delivery · +40% Boost",
    };
  });

  const deliverables = memories
    .map((m) => `- **${getLocalizedTitle(m, lang)}**：${getLocalizedContent(m, lang).slice(0, 100)}...`)
    .join("\n");

  const report =
    lang === "zh"
      ? `# ${scopeLabel}
**生成日期**：${dateStr} | **记录样本**：${memories.length} 条工作脉冲

---

### 一、 核心交付与重点产出 (Key Deliverables)
${deliverables || "- 持续推进核心功能迭代与稳定性保障。"}

### 二、 技术攻关与难题突破 (Technical Breakthroughs)
- **架构重构与交互解耦**：从底层消除跨端渲染与状态同步隐患，提升系统健壮性。
- **协议与接口标准化**：打通多平台数据回路，规范入库与持久化管线。

### 三、 业务收益与量化影响 (Impact & Value)
- **效能提升**：消除了大量重复手动整理与跨端流转成本，日常操作流转提速约 40%。
- **用户体验**：交付了符合直觉的高保真交互与即时状态反馈，降低心智阻力。

### 四、 下阶段推进规划 (Next Steps)
- 持续推进后续版本特性交付，拓展多端互通与深层智能推理能力。
`
      : `# ${scopeLabel}
**Date**: ${dateStr} | **Sample Size**: ${memories.length} pulses

---

### 1. Key Deliverables & Progress
${deliverables || "- Continued core feature iterations and system resilience upgrades."}

### 2. Technical Breakthroughs & Architecture
- **Structural Decoupling**: Eliminated cross-platform state sync friction and elevated system reliability.
- **Protocol Standardization**: Unified data ingestion and persistent pipeline flow.

### 3. Business Impact & Measurable Value
- **Efficiency**: Slashed manual overhead by ~40% with zero-friction automation.
- **Experience**: Shipped responsive, tactile feedback that minimizes user cognitive load.

### 4. Next Steps
- Continue planned feature iterations and scale multi-device synchronization capabilities.
`;

  return {
    success: true,
    provider: lang === "zh" ? "Dayprint 内置启发式引擎" : "Dayprint Built-in Engine",
    report,
    star_items: starItems,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memories: CanonicalMemory[] = body.memories || [];
    const scope: string = body.scope || "this_week";
    // The report is dated in the *user's* calendar, not the server's. The route
    // can run in any timezone (UTC in most deployments), so deriving it from
    // `new Date()` here stamps yesterday's date for anyone east of the server
    // between local midnight and the UTC offset. The client sends its own day.
    const clientDate: string =
      typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : new Date().toISOString().slice(0, 10);
    const lang: "zh" | "en" = body.language === "en" ? "en" : "zh";
    const provider: string = body.provider || "gemini";
    const userApiKey: string = (body.apiKey || "").trim();
    const customBaseUrl: string = (body.baseUrl || "").trim();
    const model: string = (body.model || "").trim();

    if (!memories || memories.length === 0) {
      return NextResponse.json(localRuleFallback([], scope, lang, clientDate));
    }

    // Determine effective key
    const effectiveGeminiKey =
      (provider === "gemini" ? userApiKey : "") ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    const promptMemories = memories.slice(0, 15).map((m) => ({
      id: m.id,
      date: dateKeyOf(m.occurred_at),
      title: getLocalizedTitle(m, lang),
      content: getLocalizedContent(m, lang),
      type: m.type,
      topics: m.topics,
    }));

    const prompt = `You are an elite Silicon Valley executive coach and performance reviewer (Principal Engineer / VP of Product level).
Analyze the following ${promptMemories.length} work pulses and accomplishment entries recorded by the user:

${JSON.stringify(promptMemories, null, 2)}

Target Language: ${lang === "zh" ? "Simplified Chinese" : "English"}
Time Scope: ${scope}

Generate two high-value deliverables in a single JSON response:
1. "report": A comprehensive, executive-ready Markdown Periodic Work Report (周报/述职报告).
   Structure it with standard professional headings:
   - Title & Executive Summary
   - 一、 核心交付与重点产出 (Key Deliverables)
   - 二、 技术攻关与难题突破 (Technical Breakthroughs & Solutions)
   - 三、 业务收益与量化价值 (Business & Engineering Impact)
   - 四、 下阶段推进规划 (Next Steps & Forward Outlook)
   Use concise, professional language. Focus on concrete facts from the memories.

2. "star_items": An array of STAR objects corresponding to the achievements/work memories:
   Each element must have:
   - "id": The matching memory id from the input.
   - "title": A crisp milestone title.
   - "situation": The business or technical challenge.
   - "task": The objective to achieve.
   - "action": Concrete technical/engineering actions executed.
   - "result": The measurable impact, quality boost, or efficiency gains.
   - "polished_bullet": A ready-to-paste resume bullet point starting with a strong active verb (e.g. "Spearheaded...", "Architected...", "主导/负责...").
   - "metrics_highlight": A short badge label (e.g. "交付闭环 · 效能提升 40%").

Return ONLY a valid JSON object matching this schema without any markdown formatting or commentary:
{
  "report": "string (markdown)",
  "star_items": [
    {
      "id": "string",
      "title": "string",
      "situation": "string",
      "task": "string",
      "action": "string",
      "result": "string",
      "polished_bullet": "string",
      "metrics_highlight": "string"
    }
  ]
}`;

    // -------------------------------------------------------------
    // Provider 1: Google Gemini (local Antigravity or user key)
    // -------------------------------------------------------------
    if (provider === "gemini" && effectiveGeminiKey) {
      try {
        const geminiModel = model || "gemini-3.8-flash";
        let geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveGeminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        // Fallback to gemini-2.5-flash if 3.8-flash or custom id returns non-ok
        if (!geminiRes.ok && geminiModel !== "gemini-2.5-flash") {
          geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${effectiveGeminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  responseMimeType: "application/json",
                },
              }),
            }
          );
        }

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(cleanJsonText(text));
          if (parsed && (parsed.report || parsed.star_items)) {
            return NextResponse.json({
              success: true,
              provider: `Google Gemini (${geminiModel})`,
              report: parsed.report || "",
              star_items: parsed.star_items || [],
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Career Gemini generate failed, falling back:", geminiErr);
      }
    }

    // -------------------------------------------------------------
    // Provider 2: OpenAI or Custom OpenAI-Compatible
    // -------------------------------------------------------------
    if ((provider === "openai" || provider === "custom") && userApiKey) {
      try {
        const openAiUrl = customBaseUrl
          ? `${customBaseUrl.replace(/\/+$/, "")}/chat/completions`
          : "https://api.openai.com/v1/chat/completions";
        const openAiModel = model || (provider === "custom" ? "gpt-4o-mini" : "gpt-4o-mini");

        const oaiRes = await fetch(openAiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: openAiModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          const text = data.choices?.[0]?.message?.content || "";
          const parsed = JSON.parse(cleanJsonText(text));
          return NextResponse.json({
            success: true,
            provider: provider === "custom" ? `Custom (${openAiModel})` : `OpenAI (${openAiModel})`,
            report: parsed.report || "",
            star_items: parsed.star_items || [],
          });
        }
      } catch (oaiErr) {
        console.warn("Career OpenAI generate failed, falling back:", oaiErr);
      }
    }

    // -------------------------------------------------------------
    // Provider 3: Anthropic Claude
    // -------------------------------------------------------------
    if (provider === "claude" && userApiKey) {
      try {
        const claudeModel = model || "claude-3-5-sonnet-20241022";
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": userApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 3500,
            temperature: 0.3,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (claudeRes.ok) {
          const data = await claudeRes.json();
          const text = data.content?.[0]?.text || "";
          const parsed = JSON.parse(cleanJsonText(text));
          return NextResponse.json({
            success: true,
            provider: `Anthropic Claude (${claudeModel})`,
            report: parsed.report || "",
            star_items: parsed.star_items || [],
          });
        }
      } catch (claudeErr) {
        console.warn("Career Claude generate failed, falling back:", claudeErr);
      }
    }

    // -------------------------------------------------------------
    // Provider 4: DeepSeek
    // -------------------------------------------------------------
    if (provider === "deepseek" && userApiKey) {
      try {
        const dsModel = model || "deepseek-chat";
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: dsModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (dsRes.ok) {
          const data = await dsRes.json();
          const text = data.choices?.[0]?.message?.content || "";
          const parsed = JSON.parse(cleanJsonText(text));
          return NextResponse.json({
            success: true,
            provider: `DeepSeek (${dsModel})`,
            report: parsed.report || "",
            star_items: parsed.star_items || [],
          });
        }
      } catch (dsErr) {
        console.warn("Career DeepSeek generate failed, falling back:", dsErr);
      }
    }

    // Fallback: local rule-based generation
    return NextResponse.json(localRuleFallback(memories, scope, lang, clientDate));
  } catch (err: any) {
    console.error("Career Generate Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
