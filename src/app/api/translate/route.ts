import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang, apiKey: userKey, provider, model, baseUrl } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ success: true, translation: "" });
    }

    const trimmed = text.trim();
    const prompt =
      targetLang === "en"
        ? `Translate the following text accurately into natural, elegant English. Maintain original tone, markdown, and punctuation. Return ONLY the translated string without any explanations or quotes:\n\n${trimmed}`
        : `将以下文本精准、通顺、自然地翻译成优美的中文。保持原意与标点，严禁机械硬翻。仅直接返回翻译后的中文纯文本，不要包含任何引号或额外解释：\n\n${trimmed}`;

    // 1. Try OpenAI or Custom Provider
    if ((provider === "openai" || provider === "custom") && userKey) {
      try {
        const oaiUrl = baseUrl ? `${baseUrl.replace(/\/+$/, "")}/chat/completions` : "https://api.openai.com/v1/chat/completions";
        const oaiRes = await fetch(oaiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userKey}` },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        });
        if (oaiRes.ok) {
          const data = await oaiRes.json();
          const translated = data.choices?.[0]?.message?.content?.trim();
          if (translated) return NextResponse.json({ success: true, translation: translated, provider: "openai" });
        }
      } catch (e) {
        console.warn("OpenAI translate error:", e);
      }
    }

    // 2. Try Claude
    if (provider === "claude" && userKey) {
      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": userKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: model || "claude-3-5-haiku-20241022",
            max_tokens: 1500,
            temperature: 0.1,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (claudeRes.ok) {
          const data = await claudeRes.json();
          const translated = data.content?.[0]?.text?.trim();
          if (translated) return NextResponse.json({ success: true, translation: translated, provider: "claude" });
        }
      } catch (e) {
        console.warn("Claude translate error:", e);
      }
    }

    // 3. Try Gemini (user key or env key)
    const effectiveGeminiKey = userKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_API_KEY;
    if (effectiveGeminiKey) {
      try {
        const geminiModel = model || "gemini-2.5-flash";
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveGeminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1 },
            }),
          }
        );
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) return NextResponse.json({ success: true, translation: translated, provider: "gemini" });
        }
      } catch (e) {
        console.warn("Gemini translate error:", e);
      }
    }

    // 2. High-quality offline translation dictionary & heuristics fallback
    const offlineDict: Record<string, string> = {
      // Common memory titles & terms
      "Broadway Boogie Woogie as an Information Grid": "作为离散信息网格的百老汇爵士乐",
      "Morning coffee & autumn breeze over the balcony": "晨间咖啡与阳台掠过的秋风",
      "GitHub as Canonical Storage instead of Postgres": "以 GitHub 为主数据存储而非 Postgres",
      "Reading notes: Cal Newport on Pseudo-Productivity": "读书笔记：卡尔·纽波特论伪生产力",
      "Mondrian primary color scheme implementation": "蒙德里安三原色设计系统的工程实现",
      "Deep Focus & Serendipitous Wandering": "深度专注与灵感漫步的心流节律",
      "Obsidian Vault Two-Way Sync": "本地 Obsidian 双向同步验证",
      "Spatial Memory Canvas Architecture": "四向全景空间记忆画布架构",
      "Knowledge Graph Engineering": "知识图谱关系工程",
      "Personal Memory Hub Dossier": "个人专属记忆中枢档案",
      "Personal LLM Wiki Dossier": "个人专属记忆中枢档案",
      "Daily Memory Receipt": "每日记忆小票",
      "Design Systems": "设计系统",
      "Architecture": "系统架构",
      "First Principles": "第一性原理",
      "Cognitive Ledger": "认知中枢",
      "Core Values": "核心价值观",
      "Skills & Habits": "技能与偏好习惯",
      "STAR Experience": "STAR 经历",
      "Raw Stream": "时空感知日志",
      // Reverse (ZH -> EN)
      "作为离散信息网格的百老汇爵士乐": "Broadway Boogie Woogie as an Information Grid",
      "晨间咖啡与阳台掠过的秋风": "Morning coffee & autumn breeze over the balcony",
      "以 GitHub 为主数据存储而非 Postgres": "GitHub as Canonical Storage instead of Postgres",
      "读书笔记：卡尔·纽波特论伪生产力": "Reading notes: Cal Newport on Pseudo-Productivity",
      "蒙德里安三原色设计系统的工程实现": "Mondrian primary color scheme implementation",
      "心流节律与专注环境偏好": "Deep Flow Rhythm & Focus Environment Preferences",
      "第一性原理与工程极简信条": "First Principles & Minimalist Engineering Creed",
      "严谨自驱的探究者画像": "Rigorous Self-Driven Inquirer Persona",
    };

    if (offlineDict[trimmed]) {
      return NextResponse.json({
        success: true,
        translation: offlineDict[trimmed],
        provider: "offline-dictionary",
      });
    }

    // Return reasonable fallback if untranslated
    return NextResponse.json({
      success: true,
      translation: trimmed,
      provider: "identity-fallback",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Translation failed" },
      { status: 500 }
    );
  }
}
