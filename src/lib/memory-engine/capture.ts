import crypto from "crypto";
import fs from "fs";
import path from "path";
import { CaptureRequest, EventRecord, ProcessingJobRecord } from "./types";
import { getMemoryStore } from "./store";

function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content.trim()).digest("hex");
}

function getArchivePath(date: Date, eventId: string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `inbox/${yyyy}/${mm}/${dd}/event_${eventId}.json`;
}

async function archiveToGitHub(
  filePath: string,
  contentJson: string
): Promise<{ success: boolean; commitSha?: string }> {
  const pat = process.env.GITHUB_PAT || "";
  const repo =
    process.env.GITHUB_STORAGE_REPO ||
    process.env.GITHUB_REPO ||
    "";

  if (!pat || !repo) {
    return { success: false };
  }

  try {
    const cleanedRepo = repo.replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "");
    const base64Content = Buffer.from(contentJson).toString("base64");
    const url = `https://api.github.com/repos/${cleanedRepo}/contents/${filePath}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Dayprint-Engine",
      },
      body: JSON.stringify({
        message: `chore(archive): capture atomic event ${path.basename(filePath)}`,
        content: base64Content,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, commitSha: data?.commit?.sha };
    }
  } catch (e) {
    console.warn("[CaptureArchive] GitHub upload exception:", e);
  }
  return { success: false };
}

function archiveToLocalDisk(filePath: string, contentJson: string) {
  try {
    const fullPath = path.join(process.cwd(), ".dayprint-archive", filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, contentJson, "utf-8");
  } catch (e) {
    console.warn("[CaptureArchive] Local disk write error:", e);
  }
}

export async function processCaptureEvent(req: CaptureRequest): Promise<{
  success: boolean;
  event_id: string;
  archive_status: "synced" | "pending" | "failed";
  processing_status: "pending" | "completed";
  message: string;
}> {
  const store = getMemoryStore();
  const now = new Date();
  const eventId =
    req.event_id?.trim() ||
    `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const userId = req.user_id || "default_user";

  // 1. Idempotency Check by event_id
  const existingEvent = await store.getEventById(eventId);
  if (existingEvent) {
    return {
      success: true,
      event_id: existingEvent.event_id,
      archive_status: existingEvent.archive_status,
      processing_status: existingEvent.processing_status === "completed" ? "completed" : "pending",
      message: "Event already ingested (idempotent replay).",
    };
  }

  // 2. Hash Calculation & Deduplication Check
  const contentHash = computeHash(req.content);
  const existingHash = await store.getEventByHash(contentHash);
  if (existingHash && existingHash.user_id === userId) {
    return {
      success: true,
      event_id: existingHash.event_id,
      archive_status: existingHash.archive_status,
      processing_status: existingHash.processing_status === "completed" ? "completed" : "pending",
      message: "Identical content already captured previously.",
    };
  }

  // 3. Prepare Archive Payload
  const archivePath = getArchivePath(now, eventId);
  const rawPayload = JSON.stringify(
    {
      event_id: eventId,
      user_id: userId,
      source: req.source,
      source_type: req.source_type,
      content: req.content,
      content_hash: contentHash,
      created_at: req.created_at || now.toISOString(),
      attachments: req.attachments || [],
      metadata: req.metadata || {},
    },
    null,
    2
  );

  // 4. Archive to GitHub & Local Mirror
  archiveToLocalDisk(archivePath, rawPayload);
  const ghResult = await archiveToGitHub(archivePath, rawPayload);

  // 5. Save Event Record in Store
  const eventRecord: EventRecord = {
    id: `ev_${crypto.randomUUID()}`,
    event_id: eventId,
    user_id: userId,
    source: req.source,
    source_type: req.source_type,
    content: req.content,
    content_hash: contentHash,
    archive_path: archivePath,
    archive_commit_sha: ghResult.commitSha,
    created_at: req.created_at || now.toISOString(),
    received_at: now.toISOString(),
    archive_status: ghResult.success ? "synced" : "pending",
    processing_status: "pending",
    metadata: req.metadata || {},
  };
  await store.saveEvent(eventRecord);

  // 6. Enqueue Background Processing Job
  const job: ProcessingJobRecord = {
    id: `job_${crypto.randomUUID()}`,
    user_id: userId,
    event_id: eventId,
    job_type: "CAPTURE_PROCESSING",
    status: "pending",
    attempts: 0,
    max_attempts: 5,
    next_retry_at: now.toISOString(),
    created_at: now.toISOString(),
  };
  await store.saveJob(job);

  return {
    success: true,
    event_id: eventId,
    archive_status: eventRecord.archive_status,
    processing_status: "pending",
    message: "Event captured and queued for memory extraction and governance.",
  };
}
