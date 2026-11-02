import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id") || "default_user";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const store = getMemoryStore();
    const events = await store.listEvents(userId, limit);

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list events" },
      { status: 500 }
    );
  }
}
