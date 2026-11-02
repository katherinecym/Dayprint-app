-- Dayprint Personal Memory Engine - Neon PostgreSQL Schema
-- Based on prd-chatgpt.md (v1.0)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- A. events table (Metadata for immutable raw events archived in GitHub)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    archive_path TEXT,
    archive_commit_sha TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    archive_status TEXT DEFAULT 'pending',
    processing_status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_hash ON events(content_hash);

-- B. memory_candidates table (Unapproved AI-generated candidate memories)
CREATE TABLE IF NOT EXISTS memory_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]',
    source_event_ids JSONB NOT NULL DEFAULT '[]',
    confidence NUMERIC(4,3),
    risk_level TEXT DEFAULT 'normal',
    operation TEXT DEFAULT 'ADD',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    review_reason TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_candidates_user_status ON memory_candidates(user_id, status);

-- C. memories table (Active canonical long-term memories)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    confidence NUMERIC(4,3),
    source_event_ids JSONB NOT NULL DEFAULT '[]',
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    supersedes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_user_status ON memories(user_id, status);

-- D. memory_history table (Audit trail preserving every evolution / mutation)
CREATE TABLE IF NOT EXISTS memory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    previous_content TEXT,
    new_content TEXT,
    operation TEXT NOT NULL,
    reason TEXT,
    evidence JSONB DEFAULT '[]',
    changed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_memory ON memory_history(memory_id, created_at DESC);

-- E. memory_relations table (Associative graph between memories)
CREATE TABLE IF NOT EXISTS memory_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default_user',
    source_memory_id TEXT NOT NULL,
    target_memory_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    confidence NUMERIC(4,3),
    evidence JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_memory_id, target_memory_id, relation_type)
);

-- F. processing_jobs table (Background job state machine)
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default_user',
    event_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(event_id, job_type)
);

CREATE INDEX IF NOT EXISTS idx_jobs_pending ON processing_jobs(status, next_retry_at);

-- G. review_queue table (Disputed or low-confidence candidate triage)
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default_user',
    candidate_id TEXT NOT NULL,
    review_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- H. memory_embeddings table (pgvector semantic embeddings, default 768 or 1536 dims)
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default_user',
    memory_id TEXT NOT NULL UNIQUE,
    embedding VECTOR(768),
    model_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
