import { NextRequest, NextResponse } from "next/server";
import { applyCandidateCommit } from "@/lib/memory-engine/governance";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const changedBy = body.changed_by || "user_review";

    const result = await applyCandidateCommit(id, changedBy);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      memoryId: result.memoryId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to approve candidate" },
      { status: 500 }
    );
  }
}
