import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory-engine/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Rejected by user during review";

    const store = getMemoryStore();
    await store.updateCandidateStatus(id, "rejected", reason);

    return NextResponse.json({
      success: true,
      message: "Candidate memory rejected successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reject candidate" },
      { status: 500 }
    );
  }
}
