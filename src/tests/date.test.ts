import { describe, it, expect } from "vitest";
import {
  localDayKey,
  todayKey,
  yesterdayKey,
  toLocalIso,
  dateKeyOf,
  getWeekRange,
} from "../lib/date";

/**
 * Calendar-day helpers.
 *
 * These exist because the whole app buckets memories by *local* calendar day
 * while JavaScript's `toISOString()` is UTC. In UTC+8 that mismatch shifted
 * records into the previous day, emptied the Mood Wash receipts, and made the
 * weekly digest label a Sunday–Saturday window.
 */
describe("local calendar-day helpers", () => {
  it("formats a local day key without going through UTC", () => {
    // 2026-01-01 00:30 local. In any timezone east of UTC, toISOString() would
    // still say 2025-12-31 — this must not.
    const d = new Date(2026, 0, 1, 0, 30, 0);
    expect(localDayKey(d)).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(localDayKey(new Date(2026, 2, 5, 12, 0, 0))).toBe("2026-03-05");
  });

  it("writes an ISO string carrying the local offset, not Z", () => {
    const iso = toLocalIso(new Date(2026, 9, 25, 15, 30, 0));
    expect(iso.startsWith("2026-10-25T15:30:00")).toBe(true);
    expect(iso).not.toMatch(/Z$/);
    expect(iso).toMatch(/[+-]\d{2}:\d{2}$/);
  });

  it("round-trips: toLocalIso then dateKeyOf returns the same day", () => {
    for (const [h, m] of [
      [0, 5],
      [7, 59],
      [8, 0],
      [23, 55],
    ]) {
      const d = new Date(2026, 9, 25, h, m, 0);
      expect(dateKeyOf(toLocalIso(d))).toBe("2026-10-25");
    }
  });

  it("converts legacy Z-suffixed timestamps to the local day", () => {
    // 2026-10-24T20:00:00Z is 2026-10-25 04:00 in UTC+8.
    const key = dateKeyOf("2026-10-24T20:00:00Z");
    const expected = localDayKey(new Date("2026-10-24T20:00:00Z"));
    expect(key).toBe(expected);
  });

  it("returns empty string for empty input", () => {
    expect(dateKeyOf("")).toBe("");
  });

  it("today and yesterday keys are adjacent days", () => {
    const today = new Date(`${todayKey()}T00:00:00`);
    const yesterday = new Date(`${yesterdayKey()}T00:00:00`);
    const diffDays = Math.round((today.getTime() - yesterday.getTime()) / 86_400_000);
    expect(diffDays).toBe(1);
  });

  describe("getWeekRange", () => {
    it("starts on Monday and ends on Sunday", () => {
      // 2026-10-25 is a Sunday.
      const { start, end, days } = getWeekRange(0, new Date(2026, 9, 25));
      expect(days).toHaveLength(7);
      expect(new Date(`${start}T00:00:00`).getDay()).toBe(1); // Monday
      expect(new Date(`${end}T00:00:00`).getDay()).toBe(0); // Sunday
    });

    it("keeps Sunday in the week that started the previous Monday", () => {
      // Regression: the UTC-based version pushed Sunday into the NEXT week,
      // producing a Sunday–Saturday window.
      const { start, end } = getWeekRange(0, new Date(2026, 9, 25)); // Sunday
      expect(start).toBe("2026-10-19"); // Monday before
      expect(end).toBe("2026-10-25"); // the Sunday itself
    });

    it("puts a Monday at the start of its own week", () => {
      const { start, end } = getWeekRange(0, new Date(2026, 9, 19)); // Monday
      expect(start).toBe("2026-10-19");
      expect(end).toBe("2026-10-25");
    });

    it("returns seven consecutive days", () => {
      const { days } = getWeekRange(0, new Date(2026, 9, 21));
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(`${days[i - 1]}T00:00:00`);
        const cur = new Date(`${days[i]}T00:00:00`);
        expect(Math.round((cur.getTime() - prev.getTime()) / 86_400_000)).toBe(1);
      }
    });

    it("shifts by whole weeks", () => {
      const base = getWeekRange(0, new Date(2026, 9, 21));
      const prev = getWeekRange(-1, new Date(2026, 9, 21));
      const next = getWeekRange(1, new Date(2026, 9, 21));
      expect(prev.end).toBe(
        localDayKey(new Date(new Date(`${base.start}T00:00:00`).getTime() - 86_400_000))
      );
      expect(next.start).toBe(
        localDayKey(new Date(new Date(`${base.end}T00:00:00`).getTime() + 86_400_000))
      );
    });

    it("crosses a year boundary correctly", () => {
      // 2027-01-01 is a Friday.
      const { start, end } = getWeekRange(0, new Date(2027, 0, 1));
      expect(start).toBe("2026-12-28");
      expect(end).toBe("2027-01-03");
    });

    it("crosses a month boundary correctly", () => {
      // 2026-11-01 is a Sunday.
      const { start, end } = getWeekRange(0, new Date(2026, 10, 1));
      expect(start).toBe("2026-10-26");
      expect(end).toBe("2026-11-01");
    });
  });
});
