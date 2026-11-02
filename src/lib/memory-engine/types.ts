import { z } from "zod";

export type MemoryType =
  | "episodic"
  | "semantic"
  | "preference"
  | "project"
  | "goal"
  | "procedural"
  | "reflection"
  | "fact"
  | "moment";

export type GovernanceOperation =
  | "ADD"
  | "MERGE"
  | "UPDATE"
  | "SUPERSEDE"
  | "LINK"
  | "REJECT"
  | "REVIEW";

export interface EvidenceItem {
  quote: string;
  event_id: string;
}

export interface EventRecord {
  id: string;
  event_id: string;
  user_id: string;
  source: string;
  source_type: string;
  content: string;
  content_hash: string;
  archive_path?: string;
  archive_commit_sha?: string;
  created_at: string;
  received_at: string;
  archive_status: "pending" | "synced" | "failed";
  processing_status: "pending" | "processing" | "completed" | "failed";
  metadata?: Record<string, any>;
}

export interface MemoryCandidateRecord {
  id: string;
  candidate_id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  evidence: EvidenceItem[];
  source_event_ids: string[];
  confidence: number;
  risk_level: "normal" | "sensitive" | "critical";
  operation: GovernanceOperation;
  status: "pending" | "approved" | "rejected" | "merged";
  created_at: string;
  reviewed_at?: string;
  review_reason?: string;
  metadata?: Record<string, any>;
}

export interface MemoryRecord {
  id: string;
  memory_id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  status: "active" | "historical" | "deleted";
  confidence: number;
  source_event_ids: string[];
  valid_from?: string;
  valid_until?: string;
  supersedes?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface MemoryHistoryRecord {
  id: string;
  memory_id: string;
  user_id: string;
  previous_content: string | null;
  new_content: string;
  operation: GovernanceOperation;
  reason?: string;
  evidence: EvidenceItem[];
  changed_by: string;
  created_at: string;
}

export interface MemoryRelationRecord {
  id: string;
  user_id: string;
  source_memory_id: string;
  target_memory_id: string;
  relation_type:
    | "RELATED_TO"
    | "SUPPORTS"
    | "CONTRADICTS"
    | "PART_OF"
    | "EVOLVED_FROM"
    | "CAUSED_BY"
    | "BELONGS_TO_PROJECT";
  confidence: number;
  evidence?: EvidenceItem[];
  created_at: string;
}

export interface ProcessingJobRecord {
  id: string;
  user_id: string;
  event_id: string;
  job_type:
    | "CAPTURE_PROCESSING"
    | "MEMORY_EXTRACTION"
    | "MEMORY_RECONCILIATION"
    | "MEMORY_INDEX_SYNC"
    | "DAILY_REFLECTION";
  status: "pending" | "processing" | "completed" | "failed" | "review_required";
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  locked_at?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface MemoryEmbeddingRecord {
  id: string;
  user_id: string;
  memory_id: string;
  embedding: number[];
  model_name: string;
  created_at: string;
}

// Zod validation schemas for input/output verification
export const CaptureRequestSchema = z.object({
  event_id: z.string().optional(),
  source: z.string().default("web"),
  source_type: z.string().default("note"),
  content: z.string().min(1, "Content cannot be empty"),
  created_at: z.string().optional(),
  user_id: z.string().default("default_user"),
  attachments: z.array(z.any()).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
});
export type CaptureRequest = z.infer<typeof CaptureRequestSchema>;

export const ClassificationSchema = z.object({
  memory_worthy: z.boolean(),
  categories: z.array(z.string()),
  explicitness: z.enum(["explicit", "implicit"]),
  temporal_scope: z.enum(["temporary", "long_term"]),
  risk_level: z.enum(["normal", "sensitive", "critical"]),
  reason: z.string(),
});
export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export const CandidateExtractionSchema = z.object({
  memory_type: z.string(),
  content: z.string(),
  explicitness: z.string().default("explicit"),
  evidence: z.array(
    z.object({
      quote: z.string(),
      event_id: z.string(),
    })
  ),
  source_event_ids: z.array(z.string()),
  temporal_scope: z.string().default("long_term"),
  confidence: z.number().min(0).max(1),
  risk_level: z.enum(["normal", "sensitive", "critical"]).default("normal"),
});
export type CandidateExtraction = z.infer<typeof CandidateExtractionSchema>;

export const ReconcileResultSchema = z.object({
  operation: z.enum(["ADD", "MERGE", "UPDATE", "SUPERSEDE", "LINK", "REJECT", "REVIEW"]),
  target_memory_id: z.string().nullable().optional(),
  reason: z.string(),
  confidence: z.number(),
  related_memory_ids: z.array(z.string()).default([]),
});
export type ReconcileResult = z.infer<typeof ReconcileResultSchema>;
