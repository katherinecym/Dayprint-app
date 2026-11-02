import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id") || "default_user";
    const status = searchParams.get("status") || "pending";

    const store = getMemoryStore();
    const candidates = await store.listCandidates(userId, status);

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list candidates" },
      { status: 500 }
    );
  }
}
