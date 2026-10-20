import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INBOX_FILE = path.join(process.cwd(), ".dayprint-inbox.json");

function readInbox(): any[] {
  try {
    if (fs.existsSync(INBOX_FILE)) {
      const data = fs.readFileSync(INBOX_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read inbox:", e);
  }
  return [];
}

function writeInbox(items: any[]) {
  try {
    fs.writeFileSync(INBOX_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write inbox:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type, topics, occurred_at, source } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: "At least 'title' or 'content' is required." },
        { status: 400 }
      );
    }

    const now = new Date();
    const id = `mem_ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newMemory = {
      schema_version: "1.0",
      id,
      type: type || "moment",
      title: title?.trim() || content?.trim().slice(0, 40) || "Captured Memory",
      content: content?.trim() || "",
      language: "zh",
      occurred_at: occurred_at || now.toISOString(),
      recorded_at: now.toISOString(),
      updated_at: now.toISOString(),
      topics: Array.isArray(topics) ? topics : ["you+bot"],
      source_ids: [],
      relations: [],
      confidence: null,
      status: "active",
      provenance: {
        capture_method: "api_ingest",
        ai_generated: Boolean(source === "you+bot"),
        source: source || "you+bot",
      },
    };

    const inbox = readInbox();
    inbox.push(newMemory);
    writeInbox(inbox);

    return NextResponse.json({
      success: true,
      message: "Memory successfully captured and queued into Dayprint inbox",
      memory: newMemory,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to ingest memory" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inbox = readInbox();
    // Return items and clear the inbox so they are absorbed once into live UI
    writeInbox([]);
    return NextResponse.json({
      success: true,
      count: inbox.length,
      memories: inbox,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
