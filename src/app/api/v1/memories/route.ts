import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id") || "default_user";
    const status = searchParams.get("status") || "active";
    const memoryType = searchParams.get("type") || undefined;

    const store = getMemoryStore();
    const memories = await store.listMemories(userId, {
      status,
      memory_type: memoryType,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list memories" },
      { status: 500 }
    );
  }
}
