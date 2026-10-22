"use client";

import React from "react";
import { CheckCircle, Target, Flame, FileSpreadsheet, ArrowUpRight } from "lucide-react";

interface KPICardsProps {
  questionsSolved: number;
  accuracy: number;
  currentStreak: number;
  testsCompleted: number;
  monthlyGrowth?: number;
}

export default function KPICards({
  questionsSolved,
  accuracy,
  currentStreak,
  testsCompleted,
  monthlyGrowth = 14,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Questions Solved */}
      <div className="why-card p-5 hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Questions Solved</span>
          <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[28px] font-bold font-mono-numbers text-[#0F172A] tracking-tight">
            {questionsSolved.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#16A34A] font-medium">
            <ArrowUpRight size={14} />
            <span>↑ {monthlyGrowth}% this month</span>
          </div>
        </div>
      </div>

      {/* 2. Overall Accuracy */}
      <div className="why-card p-5 hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Overall Accuracy</span>
          <div className="w-8 h-8 rounded-[8px] bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
            <Target size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[28px] font-bold font-mono-numbers text-[#0F172A] tracking-tight">
            {accuracy}%
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#64748B]">
            <span>Across all subject attempts</span>
          </div>
        </div>
      </div>

      {/* 3. Current Streak */}
      <div className="why-card p-5 hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Current Streak</span>
          <div className="w-8 h-8 rounded-[8px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
            <Flame size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[28px] font-bold font-mono-numbers text-[#0F172A] tracking-tight">
            {currentStreak} <span className="text-[16px] font-normal text-[#64748B]">days</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#64748B]">
            <span>≥ 5 questions/day target</span>
          </div>
        </div>
      </div>

      {/* 4. Tests Completed */}
      <div className="why-card p-5 hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#64748B]">Tests Completed</span>
          <div className="w-8 h-8 rounded-[8px] bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
            <FileSpreadsheet size={18} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[28px] font-bold font-mono-numbers text-[#0F172A] tracking-tight">
            {testsCompleted}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#64748B]">
            <span>Full mock & subject tests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
