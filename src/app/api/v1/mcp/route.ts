import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";
import { getModelRouter } from "@/lib/memory-engine/models";
import { processCaptureEvent } from "@/lib/memory-engine/capture";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tool, arguments: args, user_id = "default_user" } = body;

    const store = getMemoryStore();
    const router = getModelRouter();

    // 1. Tool Discovery Request
    if (action === "list_tools" || !tool) {
      return NextResponse.json({
        tools: [
          {
            name: "search_memory",
            description: "Semantic and keyword search over user's long-term personal memory vault.",
            input_schema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query or concept" },
                limit: { type: "number", description: "Maximum results to return" },
              },
              required: ["query"],
            },
          },
          {
            name: "get_memory",
            description: "Retrieve details and audit history of a specific memory by its ID.",
            input_schema: {
              type: "object",
              properties: {
                memory_id: { type: "string", description: "Unique memory ID" },
              },
              required: ["memory_id"],
            },
          },
          {
            name: "get_profile",
            description: "Retrieve summarized core preferences, habits, and principles of the user.",
            input_schema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "save_memory",
            description: "Submit a new candidate memory for user governance and storage.",
            input_schema: {
              type: "object",
              properties: {
                content: { type: "string", description: "Atomic memory text" },
                memory_type: {
                  type: "string",
                  enum: ["preference", "fact", "project", "goal", "reflection", "episodic"],
                },
                quote_evidence: { type: "string", description: "Supporting source quote" },
              },
              required: ["content"],
            },
          },
          {
            name: "create_journal",
            description: "Ingest a raw journal entry or event into Dayprint's immutable archive.",
            input_schema: {
              type: "object",
              properties: {
                content: { type: "string", description: "Journal raw text" },
                source: { type: "string", description: "Agent or source name" },
              },
              required: ["content"],
            },
          },
        ],
      });
    }

    // 2. Tool Execution
    if (tool === "search_memory") {
      const query = args?.query || "";
      const limit = args?.limit || 5;
      const queryVec = await router.embed(query);
      const searchHits = await store.searchEmbeddings(user_id, queryVec, limit);

      const allActive = await store.listMemories(user_id, { status: "active" });
      const memMap = new Map(allActive.map((m) => [m.memory_id, m]));

      const results = searchHits
        .map((h) => {
          const mem = memMap.get(h.memory_id);
          return mem ? { ...mem, score: h.score } : null;
        })
        .filter(Boolean);

      return NextResponse.json({
        tool: "search_memory",
        success: true,
        data: results,
      });
    }

    if (tool === "get_memory") {
      const memoryId = args?.memory_id;
      const mem = await store.getMemory(memoryId);
      const history = await store.getMemoryHistory(memoryId);
      return NextResponse.json({
        tool: "get_memory",
        success: Boolean(mem),
        data: mem ? { ...mem, history } : null,
      });
    }

    if (tool === "get_profile") {
      const activeMemories = await store.listMemories(user_id, { status: "active" });
      const preferences = activeMemories.filter((m) => m.memory_type === "preference");
      const goals = activeMemories.filter((m) => m.memory_type === "goal");
      const facts = activeMemories.filter((m) => m.memory_type === "fact");
      const reflections = activeMemories.filter((m) => m.memory_type === "reflection");

      return NextResponse.json({
        tool: "get_profile",
        success: true,
        profile: {
          total_active_memories: activeMemories.length,
          preferences: preferences.map((p) => p.content),
          goals: goals.map((g) => g.content),
          facts: facts.map((f) => f.content),
          reflections: reflections.map((r) => r.content),
        },
      });
    }

    if (tool === "save_memory") {
      const content = args?.content;
      const memoryType = args?.memory_type || "reflection";
      const quote = args?.quote_evidence || content;

      // Submit as candidate memory requiring governance review
      const cand = await store.saveCandidate({
        id: `mcp_c_${Date.now()}`,
        candidate_id: `cand_mcp_${Date.now()}`,
        user_id,
        memory_type: memoryType,
        content,
        evidence: [{ quote, event_id: "mcp_agent_submission" }],
        source_event_ids: ["mcp_agent_submission"],
        confidence: 0.9,
        risk_level: "normal",
        operation: "ADD",
        status: "pending",
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        tool: "save_memory",
        success: true,
        message: "Memory successfully submitted to Dayprint Review Queue.",
        candidate_id: cand.candidate_id,
      });
    }

    if (tool === "create_journal") {
      const content = args?.content;
      const source = args?.source || "mcp_agent";
      const captureResult = await processCaptureEvent({
        source,
        source_type: "mcp_call",
        content,
        user_id,
        attachments: [],
        metadata: { agent_origin: source },
      });

      return NextResponse.json({
        tool: "create_journal",
        success: captureResult.success,
        event_id: captureResult.event_id,
      });
    }

    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "MCP server internal error" },
      { status: 500 }
    );
  }
}
