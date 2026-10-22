"use client";

import React, { useState, useMemo } from "react";
import { DayActivity } from "@/types";
import { Calendar, X, CheckCircle2, AlertCircle } from "lucide-react";

interface ContributionGridProps {
  days: DayActivity[];
  totalQuestions: number;
  currentStreak: number;
  longestStreak: number;
}

export default function ContributionGrid({
  days,
  totalQuestions,
  currentStreak,
  longestStreak,
}: ContributionGridProps) {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  // Dark cyberpunk theme palette for contribution tiles
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return "rgba(255, 255, 255, 0.05)"; // 0 questions (subtle dark tile)
      case 1:
        return "#3B1D78"; // 1-5 questions (deep violet)
      case 2:
        return "#581C87"; // 6-15 questions (violet)
      case 3:
        return "#7C3AED"; // 16-30 questions (vibrant purple)
      case 4:
        return "#9333EA"; // 31-50 questions (bright purple)
      case 5:
        return "#C084FC"; // 51+ questions (electric lilac glow)
      default:
        return "rgba(255, 255, 255, 0.05)";
    }
  };

  // Organize the 180 days into 7-day columns (Sunday to Saturday)
  const { weeks, monthLabels } = useMemo(() => {
    if (!days || days.length === 0) return { weeks: [], monthLabels: [] };

    const columns: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];

    const firstDate = new Date(days[0].date);
    const startDayOfWeek = firstDate.getDay();

    for (let p = 0; p < startDayOfWeek; p++) {
      currentWeek.push({
        date: `pad-start-${p}`,
        questions_solved: -1,
        correct_count: 0,
        incorrect_count: 0,
        accuracy_percent: 0,
        practice_time_minutes: 0,
        mistakes_detected: 0,
        level: -1,
      });
    }

    for (const d of days) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        columns.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: `pad-end-${currentWeek.length}`,
          questions_solved: -1,
          correct_count: 0,
          incorrect_count: 0,
          accuracy_percent: 0,
          practice_time_minutes: 0,
          mistakes_detected: 0,
          level: -1,
        });
      }
      columns.push(currentWeek);
    }

    const months: { name: string; colIndex: number }[] = [];
    let lastMonth = -1;

    columns.forEach((col, colIdx) => {
      const validDay = col.find((d) => d.questions_solved >= 0 && !d.date.startsWith("pad"));
      if (validDay) {
        const dObj = new Date(validDay.date);
        const m = dObj.getMonth();
        if (m !== lastMonth) {
          months.push({
            name: dObj.toLocaleString("en-US", { month: "short" }),
            colIndex: colIdx,
          });
          lastMonth = m;
        }
      }
    });

    return { weeks: columns, monthLabels: months };
  }, [days]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="why-glass-card p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-white tracking-tight">
              Practice Consistency Grid
            </h3>
            <span className="text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              Last 6 Months
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Real question attempts over time. Solved = completed question attempts.
          </p>
        </div>

        {/* Streaks mini highlight */}
        <div className="flex items-center gap-4 text-[13px]">
          <div>
            <span className="text-slate-400 text-[11px] block">Current Streak</span>
            <span className="font-mono-numbers font-bold text-amber-400 text-[15px] flex items-center gap-1">
              <span>🔥</span> {currentStreak} days
            </span>
          </div>
          <div className="h-7 w-[1px] bg-white/10"></div>
          <div>
            <span className="text-slate-400 text-[11px] block">Longest Streak</span>
            <span className="font-mono-numbers font-bold text-white text-[15px]">
              {longestStreak} days
            </span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex text-[11px] font-medium text-slate-400 mb-1.5 pl-6 relative h-4 font-mono-numbers">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${m.colIndex * 15 + 24}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Weekday indicators */}
            <div className="flex flex-col justify-between text-[10px] font-medium text-slate-500 pr-2 select-none h-[105px] font-mono-numbers">
              <span className="leading-[12px]">Sun</span>
              <span className="leading-[12px]">Tue</span>
              <span className="leading-[12px]">Thu</span>
              <span className="leading-[12px]">Sat</span>
            </div>

            {/* Columns of 7 days */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => {
                    const isPad = day.level === -1;
                    if (isPad) {
                      return (
                        <div
                          key={dIdx}
                          className="w-[12px] h-[12px] rounded-[2px] opacity-0"
                        />
                      );
                    }

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay(day);
                          setTooltipPos({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{ backgroundColor: getLevelColor(day.level) }}
                        className="w-[12px] h-[12px] rounded-[2px] cursor-pointer hover:ring-2 hover:ring-[#C084FC] hover:scale-125 transition-all"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Summary Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[12px] text-slate-400 gap-2">
        <div>
          <span>Total Solved Activity: </span>
          <span className="font-mono-numbers font-bold text-white">
            {totalQuestions.toLocaleString()} questions
          </span>
          <span className="mx-1 text-slate-600">•</span>
          <span>5+ questions/day qualifies for streak</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          <div className="flex gap-[3px] items-center">
            <span className="w-[10px] h-[10px] rounded-[2px] bg-white/5 border border-white/10"></span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[#3B1D78]"></span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[#581C87]"></span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[#7C3AED]"></span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[#9333EA]"></span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-[#C084FC]"></span>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#120D24] text-white text-[12px] rounded-[10px] px-3.5 py-2.5 shadow-2xl border border-purple-500/40 min-w-[200px]"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 8}px` }}
        >
          <div className="font-semibold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
            <span>{formatDateDisplay(hoveredDay.date)}</span>
          </div>
          {hoveredDay.questions_solved === 0 ? (
            <div className="text-slate-400">0 questions completed</div>
          ) : (
            <div className="space-y-1 font-mono-numbers text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Solved:</span>
                <span className="text-purple-300 font-bold">{hoveredDay.questions_solved} questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="text-emerald-400 font-bold">{hoveredDay.accuracy_percent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Practice Time:</span>
                <span className="text-cyan-300">{hoveredDay.practice_time_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mistakes:</span>
                <span className="text-rose-400 font-bold">{hoveredDay.mistakes_detected} detected</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click Day Modal Summary */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-[#07050E]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120D24] rounded-[16px] border border-purple-500/30 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="text-purple-400" size={18} />
                <h3 className="font-bold text-white text-[16px]">
                  {formatDateDisplay(selectedDay.date)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-[10px] border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Questions Solved</span>
                  <span className="text-[20px] font-bold font-mono-numbers text-white">
                    {selectedDay.questions_solved}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-[10px] border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Day Accuracy</span>
                  <span className="text-[20px] font-bold font-mono-numbers text-emerald-400">
                    {selectedDay.accuracy_percent}%
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-[10px] border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Time Invested</span>
                  <span className="text-[20px] font-bold font-mono-numbers text-cyan-400">
                    {selectedDay.practice_time_minutes}m
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-[10px] border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Mistakes Detected</span>
                  <span className="text-[20px] font-bold font-mono-numbers text-rose-400">
                    {selectedDay.mistakes_detected}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-[10px] bg-purple-950/40 border border-purple-500/30 text-[13px] text-purple-200">
                {selectedDay.questions_solved >= 5 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Streak Qualified! Completed 5+ questions on this date.</span>
                  </div>
                ) : selectedDay.questions_solved > 0 ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-400 shrink-0" />
                    <span>{selectedDay.questions_solved} questions logged. 5 required for streak qualification.</span>
                  </div>
                ) : (
                  <span>Rest or revision day. No question attempts recorded.</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDay(null)}
                className="why-btn-dark px-4 py-2 text-[13px]"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
