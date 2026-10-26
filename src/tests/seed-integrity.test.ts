import { describe, it, expect } from "vitest";
import { SEED_MEMORIES, getDemoReceipts } from "../lib/seed";
import { dateKeyOf, localDayKey } from "../lib/date";

/**
 * Guards the demo dataset.
 *
 * Demo mode is the first thing anyone sees, so a broken dataset reads as a
 * broken product. Every assertion here corresponds to a bug that actually
 * shipped at some point:
 *
 * - empty receipts ("TOTAL RECORDED 0") because the receipt window and the
 *   memory window disagreed by nine days;
 * - a hole on day 7 because the hand-written seeds covered 0–6 and 8–9 while
 *   the generated tail started at 10;
 * - provenance chips that rendered nothing because `source_ids` pointed at ids
 *   that did not exist;
 * - a Chinese sentence leaking into English mode because one bilingual field
 *   was never filled.
 */
describe("Demo dataset integrity", () => {
  const ids = new Set(SEED_MEMORIES.map((m) => m.id));

  it("has unique ids", () => {
    expect(ids.size).toBe(SEED_MEMORIES.length);
  });

  it("has no dangling source_ids (provenance chain must resolve)", () => {
    const dangling: string[] = [];
    for (const m of SEED_MEMORIES) {
      for (const sid of m.source_ids) {
        if (!ids.has(sid)) dangling.push(`${m.id} -> ${sid}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it("has no dangling relations", () => {
    const dangling: string[] = [];
    for (const m of SEED_MEMORIES) {
      for (const rid of m.relations) {
        if (!ids.has(rid)) dangling.push(`${m.id} -> ${rid}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it("exposes at least a few provenance chains so the feature is demoable", () => {
    const withSources = SEED_MEMORIES.filter((m) => m.source_ids.length > 0);
    expect(withSources.length).toBeGreaterThanOrEqual(3);
  });

  it("is fully bilingual: every memory has both zh and en title + content", () => {
    const incomplete = SEED_MEMORIES.filter(
      (m) =>
        !m.title_zh?.trim() ||
        !m.title_en?.trim() ||
        !m.content_zh?.trim() ||
        !m.content_en?.trim()
    ).map((m) => m.id);
    expect(incomplete).toEqual([]);
  });

  it("covers every calendar day from the window start through yesterday, with no gaps", () => {
    const days = new Set<string>();
    for (const m of SEED_MEMORIES) {
      if (m.occurred_at) days.add(dateKeyOf(m.occurred_at));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Walk backwards from yesterday to the earliest covered day; any missing
    // date in between is a hole the user would see as a blank column.
    const sorted = Array.from(days).sort();
    const first = new Date(`${sorted[0]}T00:00:00`);
    const holes: string[] = [];
    for (const cursor = new Date(first); cursor <= yesterday; cursor.setDate(cursor.getDate() + 1)) {
      const key = localDayKey(cursor);
      if (!days.has(key)) holes.push(key);
    }
    expect(holes).toEqual([]);
  });

  it("gives every receipt date real content — no zero-item receipts", () => {
    const daysWithMemories = new Set(
      SEED_MEMORIES.filter((m) => m.occurred_at).map((m) => dateKeyOf(m.occurred_at))
    );
    const receipts = getDemoReceipts();

    const empty = Object.keys(receipts)
      .filter((d) => !daysWithMemories.has(d))
      .sort();
    expect(empty).toEqual([]);
  });

  it("varies the mood across days instead of repeating one preset", () => {
    const receipts = getDemoReceipts();
    const moods = new Set(Object.values(receipts).map((r) => r.mood));
    expect(moods.size).toBeGreaterThanOrEqual(4);
  });

  it("includes reflections on a meaningful share of days", () => {
    const receipts = Object.values(getDemoReceipts());
    const withReflection = receipts.filter((r) => r.custom_reflection?.trim());
    const ratio = withReflection.length / receipts.length;
    expect(ratio).toBeGreaterThan(0.15);
    expect(ratio).toBeLessThan(0.6);
  });

  it("spans at least two months of history", () => {
    const dates = Object.keys(getDemoReceipts()).sort();
    expect(dates.length).toBeGreaterThanOrEqual(60);
  });

  it("never uses a placeholder identity — the demo persona is fictional", () => {
    // Regression guard: demo content must not contain the author's real name,
    // employer, or contact details.
    const haystack = SEED_MEMORIES.map((m) =>
      [m.title, m.content, m.title_zh, m.content_zh, m.title_en, m.content_en].join(" ")
    ).join(" ");
    for (const forbidden of ["曹译萌", "Katherine", "Temasek", "淡马锡", "yimeng_cao"]) {
      expect(haystack.includes(forbidden), `demo seed leaks "${forbidden}"`).toBe(false);
    }
  });
});
