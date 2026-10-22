"use client";

import React from "react";
import { Target, CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";
import { DailyGoals } from "@/types";

interface DailyGoalsCardProps {
  goals: DailyGoals;
}

export default function DailyGoalsCard({ goals }: DailyGoalsCardProps) {
  const qPercent = Math.min(100, Math.round((goals.completed_questions / goals.target_questions) * 100));
  const tPercent = Math.min(100, Math.round((goals.completed_tests / goals.target_tests) * 100));
  const mPercent = Math.min(100, Math.round((goals.completed_minutes / goals.target_minutes) * 100));

  return (
    <div className="why-card p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-[#2563EB]" />
          <h3 className="font-semibold text-[#0F172A] text-[15px]">Today's Preparation Goals</h3>
        </div>
        <span className="text-[12px] font-mono-numbers font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
          {goals.overall_percentage}% Completed
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Questions progress */}
        <div>
          <div className="flex items-center justify-between text-[13px] mb-1">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#2563EB]" />
              Questions Solved
            </span>
            <span className="font-mono-numbers font-medium text-[#0F172A]">
              {goals.completed_questions} / {goals.target_questions}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
              style={{ width: `${qPercent}%` }}
            />
          </div>
        </div>

        {/* Test progress */}
        <div>
          <div className="flex items-center justify-between text-[13px] mb-1">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-[#2563EB]" />
              Simulation Test
            </span>
            <span className="font-mono-numbers font-medium text-[#0F172A]">
              {goals.completed_tests} / {goals.target_tests}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
              style={{ width: `${tPercent}%` }}
            />
          </div>
        </div>

        {/* Practice time */}
        <div>
          <div className="flex items-center justify-between text-[13px] mb-1">
            <span className="text-[#64748B] flex items-center gap-1.5">
              <Clock size={14} className="text-[#2563EB]" />
              Practice Time
            </span>
            <span className="font-mono-numbers font-medium text-[#0F172A]">
              {goals.completed_minutes} / {goals.target_minutes} min
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full bg-[#60A5FA] rounded-full transition-all duration-500"
              style={{ width: `${mPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
