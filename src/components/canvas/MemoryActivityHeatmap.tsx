"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useMemory } from "@/lib/memory-context";
import { dateKeyOf } from "@/lib/date";
import { Flame, Calendar } from "lucide-react";

interface DayCell {
  date: string; // YYYY-MM-DD
  count: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  isToday: boolean;
  isFuture: boolean;
  monthLabel?: string; // Optional: e.g. "8月" / "Aug"
}

function getLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MemoryActivityHeatmap({ className = "" }: { className?: string }) {
  const { memories, selectedDate, setSelectedDate, language } = useMemory();
  const [hoveredDay, setHoveredDay] = useState<DayCell | null>(null);

  // Group memory counts by clean canonical date string (YYYY-MM-DD)
  const memoryCountsByDate = useMemo(() => {
    const map = new Map<string, number>();
    memories.forEach((m) => {
      if (!m.occurred_at || m.status === "deleted") return;
      const dateStr = dateKeyOf(m.occurred_at);
      if (dateStr.length === 10) {
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [memories]);

  // Generate 16 weeks of calendar cells ending on the current week
  const [data, setData] = useState<{
    weeks: DayCell[][];
    monthHeaders: { weekIndex: number; label: string }[];
    totalActiveDays: number;
    currentStreak: number;
    totalCount: number;
  }>({
    weeks: [],
    monthHeaders: [],
    totalActiveDays: 0,
    currentStreak: 0,
    totalCount: 0,
  });

  useEffect(() => {
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    // Standard GitHub calendar logic:
    // Week runs from Sunday (0) to Saturday (6).
    // The current week is the last column (column 15).
    // Days after today in the current week are marked as `isFuture: true` and rendered transparently.
    const endDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
    const daysToEndOfWeek = 6 - endDayOfWeek;
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysToEndOfWeek);

    const totalWeeks = 16;
    const totalDays = totalWeeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const allDays: DayCell[] = [];
    const cur = new Date(startDate);

    let activeDaysCount = 0;
    let totalMems = 0;

    for (let i = 0; i < totalDays; i++) {
      const dateStr = getLocalDateStr(cur);
      const isToday = dateStr === todayStr;
      const isFuture = cur.getTime() > now.getTime() && !isToday;
      const count = isFuture ? 0 : memoryCountsByDate.get(dateStr) || 0;

      if (!isFuture && count > 0) {
        activeDaysCount++;
        totalMems += count;
      }

      allDays.push({
        date: dateStr,
        count,
        dayOfWeek: cur.getDay(),
        isToday,
        isFuture,
      });

      cur.setDate(cur.getDate() + 1);
    }

    // Split into 16 week columns (each column: 7 days Sun -> Sat)
    const weekColumns: DayCell[][] = [];
    const monthHeaders: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const week = allDays.slice(w * 7, (w + 1) * 7);
      weekColumns.push(week);

      // Check the month of the first valid or middle day of this week
      const sampleDay = week[0];
      if (sampleDay) {
        const monthNum = parseInt(sampleDay.date.slice(5, 7), 10);
        if (monthNum !== lastMonth) {
          lastMonth = monthNum;
          const monthNameZh = `${monthNum}月`;
          const monthNamesEn = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];
          const monthNameEn = monthNamesEn[monthNum - 1] || "";
          monthHeaders.push({
            weekIndex: w,
            label: language === "zh" ? monthNameZh : monthNameEn,
          });
        }
      }
    }

    // Compute continuous daily streak (backward from today)
    let streak = 0;
    const checkDate = new Date(now);
    const todayCount = memoryCountsByDate.get(todayStr) || 0;
    if (todayCount === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dStr = getLocalDateStr(checkDate);
      if ((memoryCountsByDate.get(dStr) || 0) > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setData({
      weeks: weekColumns,
      monthHeaders,
      totalActiveDays: activeDaysCount,
      currentStreak: streak,
      totalCount: totalMems,
    });
  }, [memoryCountsByDate, language]);

  const { weeks, monthHeaders, totalActiveDays, currentStreak } = data;

  // GitHub Morandi green cell colors with clean selection ring
  const getCellClasses = (day: DayCell, isSelected: boolean) => {
    if (day.isFuture) {
      return "invisible pointer-events-none";
    }

    let bgClass = "bg-stone-200/50 hover:bg-stone-300/80 border-stone-200/60";
    if (day.count === 1) {
      bgClass = "bg-[#608066]/35 border-[#608066]/40 hover:bg-[#608066]/50";
    } else if (day.count === 2) {
      bgClass = "bg-[#608066]/65 border-[#608066]/70 hover:bg-[#608066]/80";
    } else if (day.count >= 3) {
      bgClass = "bg-[#608066] border-[#4E6B54] hover:bg-[#4E6B54]";
    }

    const selectedRing = isSelected ? "ring-2 ring-stone-900 ring-offset-1 z-10 scale-110 shadow-xs" : "";
    const todayOutline = day.isToday && !isSelected ? "ring-1 ring-amber-500 font-bold" : "";

    return `${bgClass} ${selectedRing} ${todayOutline}`;
  };

  const dayLabels = language === "zh" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div
      suppressHydrationWarning
      className={`p-3 bg-white/85 border border-stone-200/80 rounded-xl shadow-2xs font-sans text-stone-800 ${className}`}
    >
      {/* Top Header: Title & Streak stats */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#608066]" />
          <span className="text-xs font-bold text-stone-800 tracking-tight">
            {language === "zh" ? "记忆热力图" : "Memory Activity"}
          </span>
        </div>

        <div className="flex items-center gap-2" suppressHydrationWarning>
          {currentStreak > 0 && (
            <div
              className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200/60"
              title={language === "zh" ? `连续记录 ${currentStreak} 天` : `${currentStreak} day streak`}
            >
              <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
              <span>
                {currentStreak} {language === "zh" ? "天连击" : "d streak"}
              </span>
            </div>
          )}
          <span className="text-[10px] font-mono text-stone-400">
            {totalActiveDays} {language === "zh" ? "天沉淀" : "active days"}
          </span>
        </div>
      </div>

      {/* GitHub-Standard Month Axis Header */}
      <div className="flex items-center pl-4 mb-1 text-[9px] font-mono text-stone-400 select-none overflow-hidden">
        <div className="flex items-center gap-1 w-full relative h-3.5">
          {monthHeaders.map((m) => (
            <span
              key={`${m.weekIndex}-${m.label}`}
              className="absolute truncate"
              style={{ left: `${(m.weekIndex / 16) * 100}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid: 7 rows x 16 week columns */}
      <div className="flex items-start gap-1 justify-between overflow-x-auto pb-1 scrollbar-none">
        {/* Left Day labels (Mon, Wed, Fri like standard GitHub) */}
        <div className="flex flex-col gap-1 text-[9px] text-stone-400 font-mono pr-0.5 select-none shrink-0">
          <span className="h-2.5 leading-none"> </span>
          <span className="h-2.5 leading-none">{dayLabels[1]}</span>
          <span className="h-2.5 leading-none"> </span>
          <span className="h-2.5 leading-none">{dayLabels[3]}</span>
          <span className="h-2.5 leading-none"> </span>
          <span className="h-2.5 leading-none">{dayLabels[5]}</span>
          <span className="h-2.5 leading-none"> </span>
        </div>

        {/* Heatmap Columns */}
        <div className="flex items-center gap-1">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={day.isFuture}
                    onClick={() => {
                      if (!day.isFuture) {
                        setSelectedDate(day.date);
                      }
                    }}
                    onMouseEnter={() => !day.isFuture && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    aria-label={`${day.date}: ${day.count} memories`}
                    className={`w-2.5 h-2.5 rounded-xs border transition-all cursor-pointer ${getCellClasses(
                      day,
                      isSelected
                    )}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Hover tooltip info & Legend */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100 text-[10px] text-stone-500 font-mono">
        <div className="truncate flex-1 pr-2">
          {hoveredDay ? (
            <span className="text-stone-700 font-medium">
              {hoveredDay.date} : {hoveredDay.count} {language === "zh" ? "条记忆" : "mems"}
              {hoveredDay.count === 0 && (language === "zh" ? "（点击可补记）" : " (click to backfill)")}
            </span>
          ) : (
            <span className="text-stone-400">
              {language === "zh" ? "点击任意日期可切换查看或补记" : "Click any day to view or backfill"}
            </span>
          )}
        </div>

        {/* Less -> More legend */}
        <div className="flex items-center gap-1 text-[9px] text-stone-400 shrink-0 select-none">
          <span>{language === "zh" ? "少" : "Less"}</span>
          <span className="w-2 h-2 rounded-xs bg-stone-200/60 inline-block" />
          <span className="w-2 h-2 rounded-xs bg-[#608066]/35 inline-block" />
          <span className="w-2 h-2 rounded-xs bg-[#608066]/65 inline-block" />
          <span className="w-2 h-2 rounded-xs bg-[#608066] inline-block" />
          <span>{language === "zh" ? "多" : "More"}</span>
        </div>
      </div>
    </div>
  );
}
