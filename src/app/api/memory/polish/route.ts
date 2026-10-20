import { NextResponse } from "next/server";

interface StarImpact {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface PolishResponse {
  success: boolean;
  polished_title: string;
  polished_statement: string;
  star: StarImpact;
  topics: string[];
  metrics_highlight: string;
}

/**
 * Intelligent local fallback parser for when LLM keys are absent or offline.
 * Extracts STAR components, removes colloquial slang, and formats active-verb statements.
 */
function localRuleBasedPolish(rawText: string, rawTitle?: string, lang: "zh" | "en" = "zh"): PolishResponse {
  const clean = (rawText || "").trim();
  const titleHint = (rawTitle || "").trim();

  if (lang === "zh") {
    // 1. Identify core action
    let action = clean
      .replace(/^(今天|周[一二三四五六日天]|刚刚|搞定了|完成了|做了|主要是)\s*[，,、]?\s*/g, "")
      .replace(/等信息|等等/g, "");

    // Title generation
    let title = titleHint;
    if (!title) {
      if (clean.includes("企业微信") || clean.includes("企微")) {
        title = "打通企业微信 API 并封装为 MCP 协议服务";
      } else if (clean.includes("UI") || clean.includes("设计")) {
        title = "完成智能助理板块首版 UI 与高保真交互设计";
      } else if (clean.includes("bug") || clean.includes("修复")) {
        title = "定位并攻克核心链路异常与稳定性缺陷";
      } else if (clean.includes("优化") || clean.includes("性能")) {
        title = "重构数据流转管线并大幅优化端到端性能";
      } else {
        const firstSentence = clean.split(/[。！？\n]/)[0] || clean;
        title = firstSentence.slice(0, 24);
      }
    }

    // Situation & Challenge
    let situation = "多平台数据与消息通道分散，人工处理与同步存在显著延迟与检索摩擦";
    if (clean.includes("企业微信") || clean.includes("api") || clean.includes("mcp")) {
      situation = "外部协同平台（企业微信）通知与未读消息处于孤岛状态，难以直接接入 AI 上下文";
    } else if (clean.includes("ui") || clean.includes("设计")) {
      situation = "原有功能缺乏系统化视觉指引，用户交互心智成本高，急需统一的设计规范";
    }

    // Task
    let task = `针对目标业务痛点，构建高质量可复用的技术方案并实现端到端交付`;
    if (clean.includes("mcp") || clean.includes("api")) {
      task = "打通第三方开放接口鉴权与协议封装，为智能助理构建标准 MCP 读写能力";
    } else if (clean.includes("ui")) {
      task = "输出高质感现代 UI 布局与动效交互规范，确立产品体验基调";
    }

    // Polished statement
    let statement = `主导${action}，打通关键技术链路并实现全流程闭环，显著提升了系统可用性与信息流转效能。`;
    if (clean.includes("企业微信") || clean.includes("mcp")) {
      statement = `主导打通企业微信 API 对接并将其封装为标准 Model Context Protocol (MCP) 服务，消除了跨平台通知孤岛，实现未读消息实时感知与语义检索，大幅降低信息同步摩擦。`;
    }

    // Topics
    const topics = ["工作胜仗", "工程交付"];
    if (clean.toLowerCase().includes("api")) topics.push("API对接");
    if (clean.toLowerCase().includes("mcp")) topics.push("MCP协议");
    if (clean.toLowerCase().includes("ui")) topics.push("UI设计");
    if (clean.includes("企业微信") || clean.includes("企微")) topics.push("企业微信");

    return {
      success: true,
      polished_title: title,
      polished_statement: statement,
      star: {
        situation,
        task,
        action,
        result: "打通关键数据回路，减少人工重复同步成本，核心流程流转效率提升约 40%",
      },
      topics,
      metrics_highlight: "关键链路闭环 · 效能提升约 40%",
    };
  } else {
    // English fallback
    const action = clean
      .replace(/^(today|yesterday|just|done with|completed)\s*[:,-]?\s*/i, "");

    const title = titleHint || (clean.length > 30 ? clean.slice(0, 30) + "..." : clean);

    return {
      success: true,
      polished_title: `Architected & Delivered: ${title}`,
      polished_statement: `Spearheaded ${action}, resolving key infrastructure bottlenecks and shipping an end-to-end production solution that reduced operational latency.`,
      star: {
        situation: "Disparate tooling and fragmented data channels causing operational latency and sync friction",
        task: "Design and implement a robust, standardized integration pipeline",
        action: action,
        result: "Delivered production-ready module with estimated 40% reduction in coordination overhead",
      },
      topics: ["Work Win", "Engineering", "Delivery"],
      metrics_highlight: "End-to-End Delivery · 40% Efficiency Boost",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawText: string = (body.text || "").trim();
    const rawTitle: string = (body.title || "").trim();
    const lang: "zh" | "en" = body.language === "en" ? "en" : "zh";
    const provider: string = body.provider || "gemini";
    const userApiKey: string = (body.apiKey || "").trim();
    const customBaseUrl: string = (body.baseUrl || "").trim();
    const model: string = (body.model || "").trim();

    if (!rawText && !rawTitle) {
      return NextResponse.json(
        { success: false, error: lang === "zh" ? "请输入需要润色的文字内容" : "Text is required" },
        { status: 400 }
      );
    }

    const effectiveKey =
      userApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      "";

    // If an API key is available, call the LLM for deep transformation
    if (effectiveKey) {
      const prompt = `You are an elite Silicon Valley staff engineer and career performance reviewer.
The user wrote raw, colloquial notes about their daily work:
"""
Title: ${rawTitle}
Content: ${rawText}
"""

Your task is to transform this into:
1. polished_title: A concise, impactful title (max 20 characters in Chinese or 8 words in English).
2. polished_statement: A professional, high-impact accomplishment statement using strong active verbs and emphasizing business/technical value (standard performance review / brag doc style).
3. star: An object with 4 fields:
   - situation: The underlying business or architectural challenge/pain point.
   - task: The goal that needed to be achieved.
   - action: The concrete technical/product implementation actions taken.
   - result: The deliverable outcome and quantified/estimated impact.
4. topics: 2-5 relevant keyword tags (e.g., ["企业微信", "MCP", "API对接"]).
5. metrics_highlight: A short 1-line badge of the impact (e.g., "检索效率提升 40%").

Return in ${lang === "zh" ? "Simplified Chinese" : "English"}.
Return ONLY a valid JSON object matching this schema without any markdown wrapper:
{
  "polished_title": "string",
  "polished_statement": "string",
  "star": {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  },
  "topics": ["string"],
  "metrics_highlight": "string"
}`;

      try {
        let textResult = "";

        if (provider === "gemini" || (!provider && effectiveKey.startsWith("AIza"))) {
          const geminiModel = model || "gemini-2.5-flash";
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveKey}`,
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
          if (res.ok) {
            const data = await res.json();
            textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        } else if (provider === "claude") {
          const claudeModel = model || "claude-3-5-sonnet-20241022";
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": effectiveKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: claudeModel,
              max_tokens: 2000,
              temperature: 0.3,
              messages: [{ role: "user", content: prompt }],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            textResult = data.content?.[0]?.text || "";
          }
        } else if (provider === "openai" || provider === "deepseek" || provider === "custom") {
          const baseUrl = customBaseUrl || (provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1");
          const defaultModel = provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
          const res = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: model || defaultModel,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.3,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            textResult = data.choices?.[0]?.message?.content || "";
          }
        }

        if (textResult) {
          const cleaned = textResult.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.polished_statement && parsed.star) {
            return NextResponse.json({
              success: true,
              polished_title: parsed.polished_title || rawTitle,
              polished_statement: parsed.polished_statement,
              star: parsed.star,
              topics: parsed.topics || ["工作胜仗"],
              metrics_highlight: parsed.metrics_highlight || "交付闭环",
            });
          }
        }
      } catch (llmErr) {
        console.warn("LLM polish call failed, falling back to local heuristic rule:", llmErr);
      }
    }

    // Fallback: rule-based local transformation
    const fallback = localRuleBasedPolish(rawText, rawTitle, lang);
    return NextResponse.json(fallback);
  } catch (err: any) {
    console.error("Polish API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to polish content" },
      { status: 500 }
    );
  }
}
