import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";
import { getModelRouter } from "@/lib/memory-engine/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || "").trim();
    const userId = body.user_id || "default_user";
    const limit = parseInt(body.limit || "10", 10);

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    const store = getMemoryStore();
    const router = getModelRouter();

    // 1. Semantic Embedding Search
    const queryVec = await router.embed(query);
    const semanticResults = await store.searchEmbeddings(userId, queryVec, limit * 2);

    // 2. Keyword Relevance Matching
    const allMemories = await store.listMemories(userId, { status: "active" });
    const memoryMap = new Map(allMemories.map((m) => [m.memory_id, m]));

    const scoredList: { memory: any; score: number; match_type: string }[] = [];

    // Aggregate semantic matches
    for (const item of semanticResults) {
      const mem = memoryMap.get(item.memory_id);
      if (mem) {
        scoredList.push({
          memory: mem,
          score: item.score,
          match_type: "semantic",
        });
      }
    }

    // Boost with keyword match
    const lowerQuery = query.toLowerCase();
    for (const mem of allMemories) {
      if (mem.content.toLowerCase().includes(lowerQuery)) {
        const existingIdx = scoredList.findIndex((s) => s.memory.memory_id === mem.memory_id);
        if (existingIdx >= 0) {
          scoredList[existingIdx].score += 0.3; // Boost hybrid score
          scoredList[existingIdx].match_type = "hybrid";
        } else {
          scoredList.push({
            memory: mem,
            score: 0.8,
            match_type: "keyword",
          });
        }
      }
    }

    // Sort by final score descending
    scoredList.sort((a, b) => b.score - a.score);
    const finalResults = scoredList.slice(0, limit);

    return NextResponse.json({
      success: true,
      query,
      count: finalResults.length,
      results: finalResults,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}
