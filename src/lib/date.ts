/**
 * 全站统一的「本地日历日」工具。
 *
 * 背景：Dayprint 的所有分组语义（今日记录、每日小票、热力图、周报）都是
 * **本地日历日**，而不是 UTC 日。但历史上多处直接用了
 * `new Date().toISOString().slice(0, 10)` 与 `occurred_at.slice(0, 10)`，
 * 在东八区会造成：
 *   · 本地 00:00–07:59 的记录被归到前一天（小票条目变少甚至为 0）
 *   · 「今天 / 昨天」标签在早上 8 点前错位
 *
 * 约定：
 *   1. 写入 occurred_at 时使用 `toLocalIso()`，产出的字符串自带时区偏移，
 *      因此 `slice(0, 10)` 恰好等于本地日期；
 *   2. 需要「今天的 key」时使用 `todayKey()`，不要用 toISOString()。
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → 本地日历日 key（YYYY-MM-DD） */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 今天的本地日历日 key（YYYY-MM-DD） */
export function todayKey(): string {
  return localDayKey(new Date());
}

/** 昨天的本地日历日 key（YYYY-MM-DD） */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDayKey(d);
}

/**
 * Date → 带本地时区偏移的 ISO 字符串，如 `2026-10-25T15:30:00+08:00`。
 * 与 toISOString() 的区别：后者是 UTC，会让 slice(0,10) 与时间段显示都错位。
 */
export function toLocalIso(d: Date): string {
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(offsetMin) / 60));
  const om = pad(Math.abs(offsetMin) % 60);
  return (
    `${localDayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${oh}:${om}`
  );
}

/**
 * 从任意 ISO 字符串取本地日历日 key。
 * 对带偏移的字符串（`...+08:00`）直接切片即可；
 * 对 Z 结尾的历史数据则换算成本地日期，避免归错天。
 */
export function dateKeyOf(iso: string): string {
  if (!iso) return "";
  if (iso.length >= 10 && !iso.endsWith("Z")) return iso.slice(0, 10);
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : localDayKey(d);
}

export interface WeekRange {
  /** Monday, YYYY-MM-DD (local). */
  start: string;
  /** Sunday, YYYY-MM-DD (local). */
  end: string;
  /** All seven days, Monday → Sunday. */
  days: string[];
}

/**
 * The Monday–Sunday week containing today, shifted by `weekOffset` weeks.
 *
 * Extracted from `WeeklyDigestModal` so it can be tested without rendering.
 * The original computed these keys with `toISOString()`, which is UTC: in UTC+8
 * Monday 00:00 local is Sunday 16:00 UTC, so `toISOString().split("T")[0]`
 * returned *Sunday's* date. The digest therefore filtered and labelled a
 * Sunday–Saturday window — every column shifted by one day, and Monday's entries
 * silently dropped into the previous week.
 *
 * Weeks start on Monday by convention (ISO 8601), which also matches how the
 * digest labels its columns.
 */
export function getWeekRange(weekOffset = 0, from: Date = new Date()): WeekRange {
  const anchor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  anchor.setDate(anchor.getDate() + weekOffset * 7);

  const dayOfWeek = anchor.getDay(); // 0 = Sunday
  const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + distToMonday);

  const days: string[] = [];
  const cursor = new Date(monday);
  for (let i = 0; i < 7; i++) {
    days.push(localDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { start: days[0], end: days[6], days };
}
