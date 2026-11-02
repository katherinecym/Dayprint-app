import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { LocalMemoryStore, setMemoryStore } from "../lib/memory-engine/store";
import { processCaptureEvent } from "../lib/memory-engine/capture";
import {
  processEventToCandidates,
  applyCandidateCommit,
} from "../lib/memory-engine/governance";

const TEST_STORE_PATH = path.join(process.cwd(), ".dayprint-store", "test-store.json");

describe("Dayprint Personal Memory Engine (prd-chatgpt.md)", () => {
  let store: LocalMemoryStore;

  beforeEach(() => {
    if (fs.existsSync(TEST_STORE_PATH)) {
      try {
        fs.unlinkSync(TEST_STORE_PATH);
      } catch {}
    }
    store = new LocalMemoryStore(TEST_STORE_PATH);
    setMemoryStore(store);
  });

  it("1. Capture Pipeline: captures events and enforces idempotency", async () => {
    const eventId = "evt_test_001";
    const content = "I prefer dynamic and spatial interfaces for cognitive mapping.";

    const res1 = await processCaptureEvent({
      event_id: eventId,
      source: "feishu",
      source_type: "conversation",
      content,
      user_id: "test_user",
      attachments: [],
      metadata: {},
    });

    expect(res1.success).toBe(true);
    expect(res1.event_id).toBe(eventId);

    // Replay identical event_id -> should return idempotent success
    const res2 = await processCaptureEvent({
      event_id: eventId,
      source: "feishu",
      source_type: "conversation",
      content,
      user_id: "test_user",
      attachments: [],
      metadata: {},
    });

    expect(res2.success).toBe(true);
    expect(res2.message).toContain("idempotent replay");
  });

  it("2. Extraction & Governance: preserves history when superseding memory", async () => {
    // Step A: Capture initial preference event
    const event1 = await store.saveEvent({
      id: "ev_1",
      event_id: "evt_pref_1",
      user_id: "test_user",
      source: "web",
      source_type: "note",
      content: "I prefer light theme with warm paper texture.",
      content_hash: "hash1",
      created_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      archive_status: "pending",
      processing_status: "pending",
    });

    // Step B: Save and commit initial memory
    const initialCand = await store.saveCandidate({
      id: "c_1",
      candidate_id: "cand_1",
      user_id: "test_user",
      memory_type: "preference",
      content: "Prefers light theme with warm paper texture.",
      evidence: [{ quote: "I prefer light theme", event_id: "evt_pref_1" }],
      source_event_ids: ["evt_pref_1"],
      confidence: 0.95,
      risk_level: "normal",
      operation: "ADD",
      status: "pending",
      created_at: new Date().toISOString(),
    });

    const commit1 = await applyCandidateCommit(initialCand.candidate_id);
    expect(commit1.success).toBe(true);
    expect(commit1.memoryId).toBeDefined();

    const initialMem = await store.getMemory(commit1.memoryId!);
    expect(initialMem?.status).toBe("active");

    // Step C: Supersede preference with new statement
    const updateCand = await store.saveCandidate({
      id: "c_2",
      candidate_id: "cand_2",
      user_id: "test_user",
      memory_type: "preference",
      content: "Prefers dark OLED theme for late-night deep focus.",
      evidence: [{ quote: "Prefers dark OLED theme", event_id: "evt_pref_2" }],
      source_event_ids: ["evt_pref_2"],
      confidence: 0.95,
      risk_level: "normal",
      operation: "SUPERSEDE",
      status: "pending",
      created_at: new Date().toISOString(),
      metadata: { target_memory_id: initialMem?.memory_id },
    });

    const commit2 = await applyCandidateCommit(updateCand.candidate_id);
    expect(commit2.success).toBe(true);

    // Verify historical immutability
    const oldMem = await store.getMemory(initialMem!.memory_id);
    expect(oldMem?.status).toBe("historical");
    expect(oldMem?.valid_until).toBeDefined();

    const newMem = await store.getMemory(commit2.memoryId!);
    expect(newMem?.status).toBe("active");
    expect(newMem?.supersedes).toBe(initialMem?.memory_id);

    // Verify audit trail in memory_history
    const history = await store.getMemoryHistory(commit2.memoryId!);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].previous_content).toBe(initialMem?.content);
    expect(history[0].operation).toBe("SUPERSEDE");
  });

  it("3. Semantic Search: ranks by vector embedding similarity", async () => {
    // Fake embeddings for testing
    const mem1 = await store.saveMemory({
      id: "m_1",
      memory_id: "mem_apple",
      user_id: "test_user",
      memory_type: "fact",
      content: "Apples and fruits are rich in fiber.",
      status: "active",
      confidence: 0.9,
      source_event_ids: ["e1"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await store.saveEmbedding({
      id: "emb_1",
      user_id: "test_user",
      memory_id: mem1.memory_id,
      embedding: [1, 0, 0, 0],
      model_name: "test-model",
      created_at: new Date().toISOString(),
    });

    const mem2 = await store.saveMemory({
      id: "m_2",
      memory_id: "mem_space",
      user_id: "test_user",
      memory_type: "fact",
      content: "Astronomy studies stars and distant galaxies.",
      status: "active",
      confidence: 0.9,
      source_event_ids: ["e2"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await store.saveEmbedding({
      id: "emb_2",
      user_id: "test_user",
      memory_id: mem2.memory_id,
      embedding: [0, 0, 1, 0],
      model_name: "test-model",
      created_at: new Date().toISOString(),
    });

    // Query vector aligned with Apple [1, 0, 0, 0]
    const searchHits = await store.searchEmbeddings("test_user", [0.95, 0.05, 0, 0], 2);
    expect(searchHits.length).toBe(2);
    expect(searchHits[0].memory_id).toBe("mem_apple");
    expect(searchHits[0].score).toBeGreaterThan(0.9);
  });
});
