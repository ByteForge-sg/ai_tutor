"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchDashboard, switchUserExam } from "@/lib/api";
import { DashboardData, ExamType } from "@/types";
import { Target, CheckCircle2, Clock, FileSpreadsheet, ArrowRight, Flame, Sparkles } from "lucide-react";
import Link from "next/link";

export default function GoalsPage() {
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDashboard("user_demo", currentExam);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentExam]);

  const goals = data?.daily_goals || {
    target_questions: 20,
    completed_questions: 8,
    target_tests: 1,
    completed_tests: 0,
    target_minutes: 30,
    completed_minutes: 18,
    overall_percentage: 40,
  };

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={(newExam) => {
            setCurrentExam(newExam);
            switchUserExam("user_demo", newExam);
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Target size={24} className="text-[#A855F7]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Daily Preparation Goals
              </h1>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              Disciplined problem-solving pacing calibrated for the {currentExam} syllabus.
            </p>
          </div>

          {/* Goal Overview Card */}
          <div className="why-glass-card p-6 rounded-[18px] border border-purple-500/30 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-purple-400">
                  Today&apos;s Target Fulfillment
                </span>
                <div className="text-[34px] font-extrabold font-mono-numbers text-white mt-1">
                  {goals.overall_percentage}%{" "}
                  <span className="text-[15px] font-normal text-slate-400">completed</span>
                </div>
                <p className="text-[13px] text-slate-300 mt-1">
                  Complete {Math.max(0, goals.target_questions - goals.completed_questions)} more questions to fulfill your daily quota.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-amber-500/15 px-4 py-2 rounded-[10px] border border-amber-500/30 text-amber-300 text-[13px] font-semibold">
                <Flame size={18} className="text-amber-400 animate-bounce" />
                <span>Streak Protected (8/5 required)</span>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="w-full h-3 rounded-full bg-white/10 mt-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#38BDF8] rounded-full transition-all duration-500 shadow-md shadow-purple-500/40"
                style={{ width: `${goals.overall_percentage}%` }}
              />
            </div>
          </div>

          {/* Three Daily Goals Cards */}
          <div className="space-y-4">
            {/* Goal 1: Questions */}
            <div className="why-glass-card p-5 rounded-[16px] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-[12px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center border border-purple-500/30">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[15px]">
                    20 Question Problem-Solving Quota
                  </h4>
                  <p className="text-[12px] text-slate-400">
                    Focus on weak topics and official previous year questions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono-numbers font-bold text-white text-[17px]">
                  {goals.completed_questions} / {goals.target_questions}
                </span>
                <Link
                  href="/practice"
                  className="why-btn-gradient px-4 py-2 text-[12px] flex items-center gap-1.5"
                >
                  <span>Practice</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Goal 2: Simulation Test */}
            <div className="why-glass-card p-5 rounded-[16px] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-[12px] bg-cyan-500/20 text-[#38BDF8] flex items-center justify-center border border-cyan-500/30">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[15px]">
                    1 Full Mock or Subject Test
                  </h4>
                  <p className="text-[12px] text-slate-400">
                    Timed full-simulation to build stamina and test integrity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono-numbers font-bold text-white text-[17px]">
                  {goals.completed_tests} / {goals.target_tests}
                </span>
                <Link
                  href="/tests"
                  className="px-4 py-2 rounded-[10px] bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Take Test</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Goal 3: Practice Time */}
            <div className="why-glass-card p-5 rounded-[16px] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-[12px] bg-amber-500/20 text-[#F59E0B] flex items-center justify-center border border-amber-500/30">
                  <Clock size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-[15px]">
                    30 Minutes Deep Practice
                  </h4>
                  <p className="text-[12px] text-slate-400">
                    Uninterrupted analytical problem-solving time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono-numbers font-bold text-white text-[17px]">
                  {goals.completed_minutes} / {goals.target_minutes} min
                </span>
                <span className="text-[12px] font-bold text-emerald-400 font-mono-numbers bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                  {Math.round((goals.completed_minutes / goals.target_minutes) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </div>
  );
}
