import {
  ClassificationResult,
  CandidateExtraction,
  ReconcileResult,
  EventRecord,
  MemoryCandidateRecord,
  MemoryRecord,
  ClassificationSchema,
  CandidateExtractionSchema,
  ReconcileResultSchema,
} from "./types";

export interface IModelRouter {
  classify(content: string): Promise<ClassificationResult>;
  extract(event: EventRecord): Promise<CandidateExtraction[]>;
  reconcile(
    candidate: MemoryCandidateRecord,
    existingMemories: MemoryRecord[]
  ): Promise<ReconcileResult>;
  embed(text: string): Promise<number[]>;
}

// Fallback deterministic pseudo-embedding (768 dimensions) for offline / test scenarios
function generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * 31 + i * 17) % dimensions;
    vec[index] = (vec[index] + Math.sin(charCode + i)) / 2;
  }
  // Normalize vector
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

export class GeminiModelRouter implements IModelRouter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  }

  private async callGeminiJson<T>(
    prompt: string,
    systemInstruction?: string
  ): Promise<T | null> {
    if (!this.apiKey) return null;

    try {
      const url = `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const payload: any = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`[GeminiRouter] API call failed with status ${res.status}`);
        return null;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.warn("[GeminiRouter] JSON generation failed:", e);
      return null;
    }
  }

  async classify(content: string): Promise<ClassificationResult> {
    // 1. Try Gemini LLM
    if (this.apiKey) {
      const systemPrompt = `You are Dayprint's Memory Classifier. Analyze the input text and return a JSON object with:
- memory_worthy: boolean (is this information durable and worth remembering long-term?)
- categories: array of strings (e.g. "preference", "fact", "project", "goal", "reflection", "episodic")
- explicitness: "explicit" | "implicit"
- temporal_scope: "temporary" | "long_term"
- risk_level: "normal" | "sensitive" | "critical"
- reason: short explanation`;

      const result = await this.callGeminiJson<any>(content, systemPrompt);
      if (result) {
        const validated = ClassificationSchema.safeParse(result);
        if (validated.success) return validated.data;
      }
    }

    // 2. Deterministic Heuristic Fallback
    const isPreference = /(prefer|like|hate|偏好|喜欢|讨厌|倾向)/i.test(content);
    const isGoal = /(plan to|goal|aim|target|打算|目标|计划)/i.test(content);
    const isFact = /(is|are|learned|studied|was born|是|学习|掌握)/i.test(content);

    const categories: string[] = [];
    if (isPreference) categories.push("preference");
    if (isGoal) categories.push("goal");
    if (isFact) categories.push("fact");
    if (categories.length === 0) categories.push("episodic");

    return {
      memory_worthy: content.trim().length > 5,
      categories,
      explicitness: "explicit",
      temporal_scope: isPreference || isGoal ? "long_term" : "temporary",
      risk_level: "normal",
      reason: "Classified via deterministic fallback rules.",
    };
  }

  async extract(event: EventRecord): Promise<CandidateExtraction[]> {
    if (this.apiKey) {
      const systemPrompt = `You are the Dayprint Memory Extraction Engine.
Extract durable, evidence-backed memories from the given event.
RULES:
1. Only extract information strictly supported by the text.
2. Every candidate must include verbatim quote evidence from this event.
3. Distinguish temporary notes from persistent preferences and facts.
4. Return a JSON object with a "candidates" array:
[
  {
    "memory_type": "preference" | "fact" | "project" | "goal" | "reflection" | "episodic",
    "content": "concise distilled atomic memory statement",
    "explicitness": "explicit" | "implicit",
    "evidence": [{"quote": "exact quote from text", "event_id": "${event.event_id}"}],
    "source_event_ids": ["${event.event_id}"],
    "temporal_scope": "long_term" | "temporary",
    "confidence": number between 0.0 and 1.0,
    "risk_level": "normal" | "sensitive" | "critical"
  }
]`;

      const result = await this.callGeminiJson<{ candidates: any[] }>(
        `Event ID: ${event.event_id}\nContent:\n${event.content}`,
        systemPrompt
      );

      if (result && Array.isArray(result.candidates)) {
        const validCandidates: CandidateExtraction[] = [];
        for (const c of result.candidates) {
          const parsed = CandidateExtractionSchema.safeParse(c);
          if (parsed.success) {
            validCandidates.push(parsed.data);
          }
        }
        if (validCandidates.length > 0) return validCandidates;
      }
    }

    // Heuristic Fallback
    const content = event.content.trim();
    let memory_type = "episodic";
    if (/(prefer|like|偏好|喜欢)/i.test(content)) memory_type = "preference";
    else if (/(goal|aim|target|目标|计划)/i.test(content)) memory_type = "goal";
    else if (/(learn|study|学到|体会)/i.test(content)) memory_type = "reflection";
    else if (/(fact|is|are|成立|上线)/i.test(content)) memory_type = "fact";

    return [
      {
        memory_type,
        content: content.slice(0, 300),
        explicitness: "explicit",
        evidence: [{ quote: content.slice(0, 100), event_id: event.event_id }],
        source_event_ids: [event.event_id],
        temporal_scope: "long_term",
        confidence: 0.85,
        risk_level: "normal",
      },
    ];
  }

  async reconcile(
    candidate: MemoryCandidateRecord,
    existingMemories: MemoryRecord[]
  ): Promise<ReconcileResult> {
    if (existingMemories.length === 0) {
      return {
        operation: "ADD",
        target_memory_id: null,
        reason: "No existing active memories found. Auto ADD.",
        confidence: 0.95,
        related_memory_ids: [],
      };
    }

    if (this.apiKey) {
      const systemPrompt = `You are the Dayprint Memory Reconciliation Engine.
Compare the new candidate memory against existing active memories.
Determine whether to:
- "ADD": completely new concept
- "MERGE": duplicate or near-duplicate
- "UPDATE": user corrected or refined an existing memory
- "SUPERSEDE": replaces an older version (e.g. preference changed)
- "LINK": complementary, keep both and relate
- "REVIEW": ambiguous or conflicting, requires user confirmation
- "REJECT": unsupported or invalid

Return JSON:
{
  "operation": "ADD" | "MERGE" | "UPDATE" | "SUPERSEDE" | "LINK" | "REVIEW" | "REJECT",
  "target_memory_id": string or null (the id of the existing memory being merged/updated/superseded),
  "reason": "explanation",
  "confidence": number between 0.0 and 1.0,
  "related_memory_ids": ["ids of related memories"]
}`;

      const userPrompt = `New Candidate:
Type: ${candidate.memory_type}
Content: ${candidate.content}

Existing Memories:
${existingMemories
  .map((m) => `ID: ${m.memory_id} | Type: ${m.memory_type} | Content: ${m.content}`)
  .join("\n")}`;

      const res = await this.callGeminiJson<any>(userPrompt, systemPrompt);
      if (res) {
        const validated = ReconcileResultSchema.safeParse(res);
        if (validated.success) return validated.data;
      }
    }

    // Heuristic Fallback
    const normNew = candidate.content.toLowerCase().trim();
    for (const existing of existingMemories) {
      const normOld = existing.content.toLowerCase().trim();
      if (normNew === normOld) {
        return {
          operation: "MERGE",
          target_memory_id: existing.memory_id,
          reason: "Identical content detected. Auto MERGE.",
          confidence: 0.99,
          related_memory_ids: [existing.memory_id],
        };
      }
      if (
        candidate.memory_type === existing.memory_type &&
        (normNew.includes(normOld) || normOld.includes(normNew))
      ) {
        return {
          operation: "SUPERSEDE",
          target_memory_id: existing.memory_id,
          reason: "Direct evolutionary refinement of existing memory.",
          confidence: 0.88,
          related_memory_ids: [existing.memory_id],
        };
      }
    }

    return {
      operation: "ADD",
      target_memory_id: null,
      reason: "Distinct semantic concept. Adding new memory.",
      confidence: 0.9,
      related_memory_ids: [],
    };
  }

  async embed(text: string): Promise<number[]> {
    if (this.apiKey) {
      try {
        const url = `${this.baseUrl}/models/text-embedding-004:embedContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const values = data?.embedding?.values;
          if (Array.isArray(values) && values.length > 0) {
            return values;
          }
        }
      } catch (e) {
        console.warn("[GeminiRouter] EmbedContent failed, using fallback:", e);
      }
    }
    return generateDeterministicEmbedding(text, 768);
  }
}

// Global Singleton Router
let modelRouterInstance: IModelRouter | null = null;
export function getModelRouter(): IModelRouter {
  if (!modelRouterInstance) {
    modelRouterInstance = new GeminiModelRouter();
  }
  return modelRouterInstance;
}
