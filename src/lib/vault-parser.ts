/**
 * Shared Obsidian Vault Markdown Parser
 * Parses Obsidian Vault markdown content (e.g. from GitHub API or local fs) into Canonical Memory items.
 */

export interface ParsedMemory {
  title: string;
  content: string;
  type: string;
  topics: string[];
  occurred_at?: string;
  source: string;
}

export function parseMarkdownContent(fileName: string, text: string): ParsedMemory[] {
  if (!text) return [];
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
          source: "github-vault",
        });
      }
    }
  }

  // 2. Reading Notes: 05_Reading_Notes.md or books/*.md
  if (fileName.includes("Reading_Notes") || fileName.includes("book_") || fileName.startsWith("books/")) {
    const bookTitle = fileName.replace(".md", "").replace(/^05_Reading_Notes/, "").replace(/^books\//, "");
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
            occurred_at: dateStr && dateStr.length === 10 ? `${dateStr}T10:00:00.000Z` : now,
            source: "github-vault",
          });
        }
      }
    }
  }

  // 3. General bullet parser for 01_Persona, 03_Learning, 04_Preferences, 00_Pending_Inbox
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
          source: "github-vault",
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
          source: "github-vault",
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
        source: "github-vault",
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
          source: "github-vault",
        });
      }
    }
  }

  return results;
}
