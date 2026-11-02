import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  EventRecord,
  MemoryCandidateRecord,
  MemoryRecord,
  MemoryHistoryRecord,
  MemoryRelationRecord,
  ProcessingJobRecord,
  MemoryEmbeddingRecord,
} from "./types";

export interface IMemoryStore {
  saveEvent(event: EventRecord): Promise<EventRecord>;
  getEventByHash(hash: string): Promise<EventRecord | null>;
  getEventById(eventId: string): Promise<EventRecord | null>;
  listEvents(userId: string, limit?: number): Promise<EventRecord[]>;

  saveCandidate(candidate: MemoryCandidateRecord): Promise<MemoryCandidateRecord>;
  getCandidate(candidateId: string): Promise<MemoryCandidateRecord | null>;
  listCandidates(userId: string, status?: string): Promise<MemoryCandidateRecord[]>;
  updateCandidateStatus(
    candidateId: string,
    status: MemoryCandidateRecord["status"],
    reason?: string
  ): Promise<void>;

  saveMemory(memory: MemoryRecord): Promise<MemoryRecord>;
  getMemory(memoryId: string): Promise<MemoryRecord | null>;
  updateMemory(memory: MemoryRecord): Promise<void>;
  listMemories(
    userId: string,
    filter?: { status?: string; memory_type?: string }
  ): Promise<MemoryRecord[]>;

  addHistory(history: MemoryHistoryRecord): Promise<void>;
  getMemoryHistory(memoryId: string): Promise<MemoryHistoryRecord[]>;

  saveEmbedding(embedding: MemoryEmbeddingRecord): Promise<void>;
  searchEmbeddings(
    userId: string,
    queryEmbedding: number[],
    limit?: number
  ): Promise<{ memory_id: string; score: number }[]>;

  saveJob(job: ProcessingJobRecord): Promise<void>;
  getPendingJobs(limit?: number): Promise<ProcessingJobRecord[]>;
  updateJobStatus(
    jobId: string,
    status: ProcessingJobRecord["status"],
    errorMessage?: string
  ): Promise<void>;
}

// Helper: Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

interface LocalStoreData {
  events: EventRecord[];
  candidates: MemoryCandidateRecord[];
  memories: MemoryRecord[];
  history: MemoryHistoryRecord[];
  relations: MemoryRelationRecord[];
  jobs: ProcessingJobRecord[];
  embeddings: MemoryEmbeddingRecord[];
}

export class LocalMemoryStore implements IMemoryStore {
  private filePath: string;

  constructor(customPath?: string) {
    const dir = path.join(process.cwd(), ".dayprint-store");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // ignore
      }
    }
    this.filePath = customPath || path.join(dir, "store.json");
    if (!fs.existsSync(this.filePath)) {
      this.write({
        events: [],
        candidates: [],
        memories: [],
        history: [],
        relations: [],
        jobs: [],
        embeddings: [],
      });
    }
  }

  private read(): LocalStoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const text = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn("[LocalMemoryStore] Read warning, initializing empty store:", e);
    }
    return {
      events: [],
      candidates: [],
      memories: [],
      history: [],
      relations: [],
      jobs: [],
      embeddings: [],
    };
  }

  private write(data: LocalStoreData) {
    try {
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      console.error("[LocalMemoryStore] Write error:", e);
    }
  }

  async saveEvent(event: EventRecord): Promise<EventRecord> {
    const data = this.read();
    const idx = data.events.findIndex((e) => e.event_id === event.event_id);
    if (idx >= 0) {
      data.events[idx] = event;
    } else {
      data.events.push(event);
    }
    this.write(data);
    return event;
  }

  async getEventByHash(hash: string): Promise<EventRecord | null> {
    const data = this.read();
    return data.events.find((e) => e.content_hash === hash) || null;
  }

  async getEventById(eventId: string): Promise<EventRecord | null> {
    const data = this.read();
    return data.events.find((e) => e.event_id === eventId) || null;
  }

  async listEvents(userId: string, limit = 50): Promise<EventRecord[]> {
    const data = this.read();
    return data.events
      .filter((e) => e.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  async saveCandidate(candidate: MemoryCandidateRecord): Promise<MemoryCandidateRecord> {
    const data = this.read();
    const idx = data.candidates.findIndex((c) => c.candidate_id === candidate.candidate_id);
    if (idx >= 0) {
      data.candidates[idx] = candidate;
    } else {
      data.candidates.push(candidate);
    }
    this.write(data);
    return candidate;
  }

  async getCandidate(candidateId: string): Promise<MemoryCandidateRecord | null> {
    const data = this.read();
    return data.candidates.find((c) => c.candidate_id === candidateId) || null;
  }

  async listCandidates(userId: string, status?: string): Promise<MemoryCandidateRecord[]> {
    const data = this.read();
    return data.candidates
      .filter((c) => c.user_id === userId && (!status || c.status === status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateCandidateStatus(
    candidateId: string,
    status: MemoryCandidateRecord["status"],
    reason?: string
  ): Promise<void> {
    const data = this.read();
    const c = data.candidates.find((item) => item.candidate_id === candidateId);
    if (c) {
      c.status = status;
      c.reviewed_at = new Date().toISOString();
      if (reason) c.review_reason = reason;
      this.write(data);
    }
  }

  async saveMemory(memory: MemoryRecord): Promise<MemoryRecord> {
    const data = this.read();
    const idx = data.memories.findIndex((m) => m.memory_id === memory.memory_id);
    if (idx >= 0) {
      data.memories[idx] = memory;
    } else {
      data.memories.push(memory);
    }
    this.write(data);
    return memory;
  }

  async getMemory(memoryId: string): Promise<MemoryRecord | null> {
    const data = this.read();
    return data.memories.find((m) => m.memory_id === memoryId) || null;
  }

  async updateMemory(memory: MemoryRecord): Promise<void> {
    const data = this.read();
    const idx = data.memories.findIndex((m) => m.memory_id === memory.memory_id);
    if (idx >= 0) {
      data.memories[idx] = memory;
      this.write(data);
    }
  }

  async listMemories(
    userId: string,
    filter?: { status?: string; memory_type?: string }
  ): Promise<MemoryRecord[]> {
    const data = this.read();
    return data.memories
      .filter((m) => {
        if (m.user_id !== userId) return false;
        if (filter?.status && m.status !== filter.status) return false;
        if (filter?.memory_type && m.memory_type !== filter.memory_type) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async addHistory(history: MemoryHistoryRecord): Promise<void> {
    const data = this.read();
    data.history.push(history);
    this.write(data);
  }

  async getMemoryHistory(memoryId: string): Promise<MemoryHistoryRecord[]> {
    const data = this.read();
    return data.history
      .filter((h) => h.memory_id === memoryId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async saveEmbedding(embedding: MemoryEmbeddingRecord): Promise<void> {
    const data = this.read();
    const idx = data.embeddings.findIndex((e) => e.memory_id === embedding.memory_id);
    if (idx >= 0) {
      data.embeddings[idx] = embedding;
    } else {
      data.embeddings.push(embedding);
    }
    this.write(data);
  }

  async searchEmbeddings(
    userId: string,
    queryEmbedding: number[],
    limit = 10
  ): Promise<{ memory_id: string; score: number }[]> {
    const data = this.read();
    const results = data.embeddings
      .filter((e) => e.user_id === userId)
      .map((e) => ({
        memory_id: e.memory_id,
        score: cosineSimilarity(queryEmbedding, e.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return results;
  }

  async saveJob(job: ProcessingJobRecord): Promise<void> {
    const data = this.read();
    const idx = data.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      data.jobs[idx] = job;
    } else {
      data.jobs.push(job);
    }
    this.write(data);
  }

  async getPendingJobs(limit = 10): Promise<ProcessingJobRecord[]> {
    const data = this.read();
    return data.jobs
      .filter((j) => j.status === "pending" || j.status === "processing")
      .slice(0, limit);
  }

  async updateJobStatus(
    jobId: string,
    status: ProcessingJobRecord["status"],
    errorMessage?: string
  ): Promise<void> {
    const data = this.read();
    const job = data.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = status;
      if (status === "completed") {
        job.completed_at = new Date().toISOString();
      }
      if (errorMessage) {
        job.error_message = errorMessage;
      }
      this.write(data);
    }
  }
}

// Global Singleton
let memoryStoreInstance: IMemoryStore | null = null;

export function setMemoryStore(store: IMemoryStore | null) {
  memoryStoreInstance = store;
}

export function getMemoryStore(): IMemoryStore {
  if (!memoryStoreInstance) {
    // If DATABASE_URL is available, an enterprise/cloud Neon driver can hook here.
    // For local-first and seamless zero-config out-of-the-box operation, LocalMemoryStore provides 100% full fidelity.
    memoryStoreInstance = new LocalMemoryStore();
  }
  return memoryStoreInstance;
}
