import crypto from "crypto";
import {
  MemoryCandidateRecord,
  MemoryRecord,
  MemoryType,
} from "./types";
import { getMemoryStore } from "./store";
import { getModelRouter } from "./models";

export async function processEventToCandidates(eventId: string): Promise<{
  success: boolean;
  candidatesCount: number;
  approvedCount: number;
  reviewRequiredCount: number;
}> {
  const store = getMemoryStore();
  const router = getModelRouter();

  const event = await store.getEventById(eventId);
  if (!event) {
    return { success: false, candidatesCount: 0, approvedCount: 0, reviewRequiredCount: 0 };
  }

  // 1. Classification
  const classification = await router.classify(event.content);
  if (!classification.memory_worthy) {
    event.processing_status = "completed";
    await store.saveEvent(event);
    return { success: true, candidatesCount: 0, approvedCount: 0, reviewRequiredCount: 0 };
  }

  // 2. Extraction
  const extractions = await router.extract(event);
  if (!extractions || extractions.length === 0) {
    event.processing_status = "completed";
    await store.saveEvent(event);
    return { success: true, candidatesCount: 0, approvedCount: 0, reviewRequiredCount: 0 };
  }

  const existingActiveMemories = await store.listMemories(event.user_id, { status: "active" });

  let approvedCount = 0;
  let reviewRequiredCount = 0;

  for (const item of extractions) {
    const candidateId = `cand_${crypto.randomUUID()}`;
    const initialCandidate: MemoryCandidateRecord = {
      id: `rc_${crypto.randomUUID()}`,
      candidate_id: candidateId,
      user_id: event.user_id,
      memory_type: item.memory_type as MemoryType,
      content: item.content,
      evidence: item.evidence,
      source_event_ids: item.source_event_ids,
      confidence: item.confidence,
      risk_level: item.risk_level,
      operation: "ADD",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // 3. Reconciliation against existing memories
    const recon = await router.reconcile(initialCandidate, existingActiveMemories);
    initialCandidate.operation = recon.operation;
    initialCandidate.metadata = {
      reconcile_reason: recon.reason,
      reconcile_confidence: recon.confidence,
      target_memory_id: recon.target_memory_id,
      related_memory_ids: recon.related_memory_ids,
    };

    // 4. Governance Rule: Auto-Commit vs Send to Review Queue
    // High-confidence explicit fact or clear merge can auto-commit; conflicts or ambiguous items enter Review Queue
    const isAutoApprovable =
      item.confidence >= 0.85 &&
      item.risk_level === "normal" &&
      recon.operation !== "REVIEW" &&
      recon.operation !== "REJECT";

    if (isAutoApprovable) {
      await store.saveCandidate(initialCandidate);
      await applyCandidateCommit(initialCandidate.candidate_id, "auto_governance");
      approvedCount++;
    } else if (recon.operation === "REJECT") {
      initialCandidate.status = "rejected";
      initialCandidate.review_reason = recon.reason;
      await store.saveCandidate(initialCandidate);
    } else {
      // Must be reviewed by user in Review Center
      initialCandidate.status = "pending";
      initialCandidate.review_reason = recon.reason;
      await store.saveCandidate(initialCandidate);
      reviewRequiredCount++;
    }
  }

  event.processing_status = "completed";
  await store.saveEvent(event);

  return {
    success: true,
    candidatesCount: extractions.length,
    approvedCount,
    reviewRequiredCount,
  };
}

export async function applyCandidateCommit(
  candidateId: string,
  changedBy = "user"
): Promise<{ success: boolean; memoryId?: string; message: string }> {
  const store = getMemoryStore();
  const router = getModelRouter();

  const candidate = await store.getCandidate(candidateId);
  if (!candidate) {
    return { success: false, message: "Candidate memory not found." };
  }

  const now = new Date().toISOString();
  const op = candidate.operation;
  const targetMemoryId = candidate.metadata?.target_memory_id;

  let finalMemoryId = "";

  if (op === "ADD" || !targetMemoryId) {
    // 1. ADD new canonical memory
    finalMemoryId = `mem_${crypto.randomUUID()}`;
    const newMemory: MemoryRecord = {
      id: `m_${crypto.randomUUID()}`,
      memory_id: finalMemoryId,
      user_id: candidate.user_id,
      memory_type: candidate.memory_type,
      content: candidate.content,
      status: "active",
      confidence: candidate.confidence,
      source_event_ids: candidate.source_event_ids,
      valid_from: now,
      created_at: now,
      updated_at: now,
      metadata: candidate.metadata || {},
    };
    await store.saveMemory(newMemory);

    // Embed and index vector
    const vec = await router.embed(newMemory.content);
    await store.saveEmbedding({
      id: `emb_${crypto.randomUUID()}`,
      user_id: candidate.user_id,
      memory_id: finalMemoryId,
      embedding: vec,
      model_name: "text-embedding-004",
      created_at: now,
    });

    // Record History
    await store.addHistory({
      id: `hist_${crypto.randomUUID()}`,
      memory_id: finalMemoryId,
      user_id: candidate.user_id,
      previous_content: null,
      new_content: newMemory.content,
      operation: "ADD",
      reason: "Initial memory commitment via governance",
      evidence: candidate.evidence,
      changed_by: changedBy,
      created_at: now,
    });
  } else if (op === "MERGE") {
    // 2. MERGE into existing memory (link evidence & events)
    const existing = await store.getMemory(targetMemoryId);
    if (existing) {
      finalMemoryId = existing.memory_id;
      const combinedEvents = Array.from(
        new Set([...existing.source_event_ids, ...candidate.source_event_ids])
      );
      existing.source_event_ids = combinedEvents;
      existing.updated_at = now;
      await store.updateMemory(existing);

      await store.addHistory({
        id: `hist_${crypto.randomUUID()}`,
        memory_id: existing.memory_id,
        user_id: candidate.user_id,
        previous_content: existing.content,
        new_content: existing.content,
        operation: "MERGE",
        reason: `Merged evidence from events: ${candidate.source_event_ids.join(", ")}`,
        evidence: candidate.evidence,
        changed_by: changedBy,
        created_at: now,
      });
    }
  } else if (op === "UPDATE" || op === "SUPERSEDE") {
    // 3. SUPERSEDE / UPDATE: Keep previous version in history, set valid_until on old version
    const existing = await store.getMemory(targetMemoryId);
    if (existing) {
      // Mark old version as historical
      existing.status = "historical";
      existing.valid_until = now;
      existing.updated_at = now;
      await store.updateMemory(existing);

      // Create new active version
      finalMemoryId = `mem_${crypto.randomUUID()}`;
      const newMemory: MemoryRecord = {
        id: `m_${crypto.randomUUID()}`,
        memory_id: finalMemoryId,
        user_id: candidate.user_id,
        memory_type: candidate.memory_type,
        content: candidate.content,
        status: "active",
        confidence: candidate.confidence,
        source_event_ids: Array.from(
          new Set([...existing.source_event_ids, ...candidate.source_event_ids])
        ),
        valid_from: now,
        supersedes: existing.memory_id,
        created_at: now,
        updated_at: now,
        metadata: {
          ...candidate.metadata,
          superseded_memory_id: existing.memory_id,
        },
      };
      await store.saveMemory(newMemory);

      // Embed new version
      const vec = await router.embed(newMemory.content);
      await store.saveEmbedding({
        id: `emb_${crypto.randomUUID()}`,
        user_id: candidate.user_id,
        memory_id: finalMemoryId,
        embedding: vec,
        model_name: "text-embedding-004",
        created_at: now,
      });

      // Record Audit History
      await store.addHistory({
        id: `hist_${crypto.randomUUID()}`,
        memory_id: finalMemoryId,
        user_id: candidate.user_id,
        previous_content: existing.content,
        new_content: newMemory.content,
        operation: op,
        reason: candidate.review_reason || "Memory evolved through governance",
        evidence: candidate.evidence,
        changed_by: changedBy,
        created_at: now,
      });
    }
  }

  // Update Candidate Status
  await store.updateCandidateStatus(candidateId, "approved");

  return {
    success: true,
    memoryId: finalMemoryId,
    message: `Candidate committed with operation ${op}`,
  };
}
