import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEFAULT_VAULT_DIR = process.env.OBSIDIAN_VAULT_DIR || path.join(process.cwd(), "vault");
const INBOX_FILE = path.join(process.cwd(), ".dayprint-inbox.json");

function readInbox(): any[] {
  try {
    if (fs.existsSync(INBOX_FILE)) {
      return JSON.parse(fs.readFileSync(INBOX_FILE, "utf-8"));
    }
  } catch {
    // fallback
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

interface ParsedMemory {
  title: string;
  content: string;
  type: string;
  topics: string[];
  occurred_at?: string;
  source: string;
}

function parseMarkdownFile(filePath: string): ParsedMemory[] {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);
  const results: ParsedMemory[] = [];
  const now = new Date().toISOString();

  // 1. Projects and SOP/Skills files: 02_Work_and_Projects.md, 03_Learning_and_Skills.md (has ### sections)
  if (fileName.includes("Work_and_Projects") || (fileName.includes("Learning_and_Skills") && text.includes("### "))) {
    const sections = text.split(/^###\s+/m);
    for (let i = 1; i < sections.length; i++) {
      const sec = sections[i];
      const lines = sec.split("\n");
      const title = lines[0].replace(/^[\d\.\s⚡️🚀🏛️💡]+/, "").trim();
      const body = lines.slice(1).join("\n").trim();
      if (title && body) {
        const isLearningOrSop = 
          title.toLowerCase().includes("framework") || 
          title.toLowerCase().includes("sop") || 
          title.toLowerCase().includes("case study") ||
          title.toLowerCase().includes("benchmark") ||
          title.includes("流程") || 
          title.includes("架构") || 
          title.includes("模式");
        results.push({
          title,
          content: body,
          type: isLearningOrSop ? "learning" : "creation",
          topics: ["you+bot", isLearningOrSop ? "sop" : "project", "work", "architecture"],
          occurred_at: now,
          source: "you+obsidian",
        });
      }
    }
  }

  // 2. Reading Notes: 05_Reading_Notes.md or books/*.md
  if (fileName.includes("Reading_Notes") || filePath.includes("/books/")) {
    const bookTitle = fileName.replace(".md", "").replace(/^05_Reading_Notes/, "");
    // Extract bullets: - [YYYY-MM-DD] 《书名》: 内容
    const lines = text.split("\n");
    for (const line of lines) {
      const bulletMatch = line.match(/^-\s+\[(.*?)\]\s+(.*)/);
      if (bulletMatch) {
        const dateStr = bulletMatch[1];
        const contentStr = bulletMatch[2].trim();
        if (contentStr.length > 5) {
          results.push({
            title: `读书摘抄: ${contentStr.slice(0, 30)}`,
            content: contentStr,
            type: "learning",
            topics: ["you+bot", "reading", bookTitle || "books"],
            occurred_at: dateStr ? `${dateStr}T10:00:00.000Z` : now,
            source: "you+obsidian",
          });
        }
      }
    }
  }

  // 3. General bullet parser for 01_Persona, 03_Learning, 04_Preferences
  const lines = text.split("\n");
  let currentHeader = "";
  for (const line of lines) {
    if (line.startsWith("## ")) {
      currentHeader = line
        .replace("## ", "")
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦★]/gu, "")
        .trim();
      continue;
    }
    // Match: - [ ] [YYYY-MM-DD] text  or  - [YYYY-MM-DD] text  or  - [✓] **title**  or plain bullet: - text
    const todoBullet = line.match(/^-\s+\[[\sxX]\]\s*(?:\[(\d{4}-\d{2}-\d{2})\])?\s*(.*)/);
    const dateBullet = line.match(/^-\s+\[(\d{4}-\d{2}-\d{2})\]\s+(.*)/);
    const traitBullet = line.match(/^-\s+\[[\?✓]\]\s+\*\*(.*?)\*\*(.*)/);
    const plainBullet = line.match(/^-\s+([^\-\[\*\#].*)/);

    if (todoBullet) {
      const dateStr = todoBullet[1];
      const content = todoBullet[2].trim();
      if (content.length > 5) {
        let memType = "plan";
        let topics = ["you+bot", "todo", currentHeader.slice(0, 15)];
        if (currentHeader.includes("待读") || currentHeader.toLowerCase().includes("read later")) {
          memType = "learning";
          topics = ["you+bot", "read-later", "reading"];
        } else if (currentHeader.includes("机会雷达") || currentHeader.includes("投递")) {
          memType = "plan";
          topics = ["you+bot", "job_todo", "career", "radar"];
        } else if (currentHeader.includes("收件箱") || currentHeader.includes("待分类") || fileName.includes("Pending_Inbox")) {
          memType = "moment";
          topics = ["you+bot", "inbox", "triage"];
        }
        results.push({
          title: content.replace(/\[|\]|\*+/g, "").slice(0, 35),
          content,
          type: memType,
          topics,
          occurred_at: dateStr ? `${dateStr}T12:00:00.000Z` : now,
          source: "you+obsidian",
        });
      }
    } else if (dateBullet) {
      const dateStr = dateBullet[1];
      const content = dateBullet[2]
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦★]/gu, "")
        .replace(/\(?\s*置信度[：:]\s*\d+%?\s*\)?/gi, "")
        .trim();
      if (content.length > 5) {
        let memType = "fact";
        if (currentHeader.includes("学习") || currentHeader.includes("技能")) memType = "learning";
        if (currentHeader.includes("项目") || currentHeader.includes("决策")) memType = "decision";
        if (currentHeader.includes("偏好") || currentHeader.includes("习惯")) memType = "fact";

        results.push({
          title: content.slice(0, 35),
          content,
          type: memType,
          topics: ["you+bot", "obsidian", currentHeader.slice(0, 15)],
          occurred_at: `${dateStr}T12:00:00.000Z`,
          source: "you+obsidian",
        });
      }
    } else if (traitBullet) {
      const traitName = traitBullet[1]
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦★]/gu, "")
        .trim();
      const extra = traitBullet[2]
        .replace(/\(?\s*置信度[：:]\s*\d+%?\s*\)?/gi, "")
        .trim();
      results.push({
        title: `人设/认知模式: ${traitName}`,
        content: `【${currentHeader}】${traitName} ${extra}`.trim(),
        type: "fact",
        topics: ["you+bot", "persona", "cognitive_pattern"],
        occurred_at: now,
        source: "you+obsidian",
      });
    } else if (plainBullet && currentHeader && !fileName.includes("Work_and_Projects")) {
      const rawContent = plainBullet[1].trim();
      if (rawContent.length > 5 && !rawContent.startsWith("置信度")) {
        results.push({
          title: rawContent.slice(0, 35),
          content: `【${currentHeader}】${rawContent}`,
          type: "fact",
          topics: ["you+bot", "obsidian", currentHeader.slice(0, 15)],
          occurred_at: now,
          source: "you+obsidian",
        });
      }
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    let vaultDir = DEFAULT_VAULT_DIR;
    try {
      const body = await req.json();
      if (body && body.vaultPath) vaultDir = body.vaultPath;
    } catch {
      // no custom body
    }

    if (!fs.existsSync(vaultDir)) {
      return NextResponse.json(
        { error: `Vault directory not found at: ${vaultDir}` },
        { status: 404 }
      );
    }

    const filesToScan: string[] = [
      path.join(vaultDir, "01_Persona_and_Values.md"),
      path.join(vaultDir, "02_Work_and_Projects.md"),
      path.join(vaultDir, "03_Learning_and_Skills.md"),
      path.join(vaultDir, "04_Preferences_and_Habits.md"),
      path.join(vaultDir, "05_Reading_Notes.md"),
    ];

    const booksDir = path.join(vaultDir, "books");
    if (fs.existsSync(booksDir)) {
      const bookFiles = fs.readdirSync(booksDir);
      for (const bf of bookFiles) {
        if (bf.endsWith(".md")) {
          filesToScan.push(path.join(booksDir, bf));
        }
      }
    }

    const allParsed: ParsedMemory[] = [];
    for (const f of filesToScan) {
      allParsed.push(...parseMarkdownFile(f));
    }

    const now = new Date();
    const createdItems = allParsed.map((p, idx) => ({
      schema_version: "1.0",
      id: `mem_obsidian_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      type: p.type || "moment",
      title: p.title,
      content: p.content,
      language: "zh",
      occurred_at: p.occurred_at || now.toISOString(),
      recorded_at: now.toISOString(),
      updated_at: now.toISOString(),
      topics: p.topics,
      source_ids: [],
      relations: [],
      confidence: 0.9,
      status: "active",
      provenance: {
        capture_method: "obsidian_sync",
        ai_generated: true,
        source: p.source,
      },
    }));

    const inbox = readInbox();
    inbox.push(...createdItems);
    writeInbox(inbox);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdItems.length} memories from local Obsidian vault!`,
      imported_count: createdItems.length,
      sample_titles: createdItems.slice(0, 5).map((m) => m.title),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to sync obsidian vault" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return status of Obsidian Vault
  const exists = fs.existsSync(DEFAULT_VAULT_DIR);
  return NextResponse.json({
    status: exists ? "connected" : "path_not_found",
    vault_path: DEFAULT_VAULT_DIR,
  });
}
