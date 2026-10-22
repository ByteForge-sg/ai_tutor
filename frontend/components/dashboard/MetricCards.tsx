"use client";

import React from "react";
import { Activity, Sparkles, Target, AlertTriangle } from "lucide-react";

interface MetricCardsProps {
  questionsSolved: number;
  accuracy: number;
  currentStreak: number;
  testsCompleted: number;
  weaknessesCount?: number;
}

export default function MetricCards({
  questionsSolved,
  accuracy,
  currentStreak,
  testsCompleted,
  weaknessesCount = 3,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. AI Usage / Questions Solved (Gold / Orange Neon Sparkline) */}
      <div className="why-glass-card p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Activity size={18} />
          </div>

          {/* SVG Sparkline (Orange/Gold Wave) */}
          <svg width="76" height="32" viewBox="0 0 76 32" className="overflow-visible">
            <path
              d="M0,24 Q10,26 18,16 T36,20 T54,8 T76,14"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            />
          </svg>
        </div>

        <div className="mt-4">
          <span className="text-[12px] font-medium text-slate-400 block">AI Solved Volume</span>
          <div className="text-[26px] font-extrabold font-mono-numbers text-white tracking-tight mt-0.5">
            {questionsSolved.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold font-mono-numbers">
            <span>+14.3% this month</span>
          </div>
        </div>
      </div>

      {/* 2. Outputs / Mistakes Diagnosed (Cyan / Aqua Neon Sparkline) */}
      <div className="why-glass-card p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-[8px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Sparkles size={18} />
          </div>

          {/* SVG Sparkline (Cyan Wave) */}
          <svg width="76" height="32" viewBox="0 0 76 32" className="overflow-visible">
            <path
              d="M0,26 Q12,12 24,20 T48,6 T64,18 T76,8"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            />
          </svg>
        </div>

        <div className="mt-4">
          <span className="text-[12px] font-medium text-slate-400 block">Reasoning Outputs</span>
          <div className="text-[26px] font-extrabold font-mono-numbers text-white tracking-tight mt-0.5">
            {Math.round(questionsSolved * 0.28).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-cyan-400 font-semibold font-mono-numbers">
            <span>+8.2% this month</span>
          </div>
        </div>
      </div>

      {/* 3. Precision / Accuracy (Emerald / Teal Neon Sparkline) */}
      <div className="why-glass-card p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-[8px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Target size={18} />
          </div>

          {/* SVG Sparkline (Teal/Emerald Wave) */}
          <svg width="76" height="32" viewBox="0 0 76 32" className="overflow-visible">
            <path
              d="M0,22 Q14,24 28,10 T50,16 T66,6 T76,10"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            />
          </svg>
        </div>

        <div className="mt-4">
          <span className="text-[12px] font-medium text-slate-400 block">Precision & Accuracy</span>
          <div className="text-[26px] font-extrabold font-mono-numbers text-emerald-400 tracking-tight mt-0.5">
            {accuracy}%
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold font-mono-numbers">
            <span>+2.1% this month</span>
          </div>
        </div>
      </div>

      {/* 4. Active Weaknesses / Tracked Patterns (Purple / Magenta Neon Sparkline) */}
      <div className="why-glass-card p-5 relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-[8px] bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>

          {/* SVG Sparkline (Purple Wave) */}
          <svg width="76" height="32" viewBox="0 0 76 32" className="overflow-visible">
            <path
              d="M0,10 Q16,28 32,8 T56,24 T76,12"
              fill="none"
              stroke="#C084FC"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]"
            />
          </svg>
        </div>

        <div className="mt-4">
          <span className="text-[12px] font-medium text-slate-400 block">Tracked Patterns</span>
          <div className="text-[26px] font-extrabold font-mono-numbers text-white tracking-tight mt-0.5">
            {weaknessesCount} <span className="text-[14px] font-normal text-slate-400">topics</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-400 font-semibold font-mono-numbers">
            <span>-1.2% this month (remedied)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
