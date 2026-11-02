import { NextRequest, NextResponse } from "next/server";
import { CaptureRequestSchema } from "@/lib/memory-engine/types";
import { processCaptureEvent } from "@/lib/memory-engine/capture";
import { runPendingJobs } from "@/lib/memory-engine/jobs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = CaptureRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const captureResult = await processCaptureEvent(parsed.data);

    // Eagerly trigger background processing if serverless window allows
    try {
      await runPendingJobs(1);
    } catch (e) {
      console.warn("[CaptureAPI] Immediate job processing deferred:", e);
    }

    return NextResponse.json(captureResult, { status: 200 });
  } catch (error: any) {
    console.error("[CaptureAPI] Internal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during capture",
      },
      { status: 500 }
    );
  }
}
