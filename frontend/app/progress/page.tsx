"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchDashboard, switchUserExam } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { DashboardData, ExamType } from "@/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDashboard(undefined, currentExam);
        setData(res);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [currentExam]);

  // Aggregate monthly activity data for charts
  const monthlyTrends = data?.monthly_trends || [];
  const subjectPerformance = data?.subject_performance || [];

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={(newExam) => {
            setCurrentExam(newExam);
            switchUserExam(getCurrentUser()?.id, newExam);
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={24} className="text-[#A855F7]" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Progress & Long-Term Mastery Trends
              </h1>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              {data?.questions_solved.toLocaleString() ?? "—"} answered question attempts stored for this account.
            </p>
          </div>

          {/* Metric Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="why-glass-card p-4 rounded-[14px] border border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Solved
              </span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-white mt-1">
                {data?.questions_solved.toLocaleString() ?? "—"}
              </div>
              <span className="text-[11px] text-slate-400 font-mono-numbers">{data?.monthly_growth_percent == null ? "No prior month data" : `${data.monthly_growth_percent > 0 ? "+" : ""}${data.monthly_growth_percent}% this month`}</span>
            </div>

            <div className="why-glass-card p-4 rounded-[14px] border border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Global Accuracy
              </span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-cyan-400 mt-1">
                {data && data.questions_solved > 0 ? `${data.accuracy_percent}%` : "—"}
              </div>
              <span className="text-[11px] text-slate-400 font-mono-numbers">Based on answered questions</span>
            </div>

            <div className="why-glass-card p-4 rounded-[14px] border border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Streak
              </span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-amber-400 mt-1">
                {data?.current_streak ?? "—"} Days
              </div>
              <span className="text-[11px] text-amber-300 font-mono-numbers">5 questions qualify a day</span>
            </div>

            <div className="why-glass-card p-4 rounded-[14px] border border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tests Completed
              </span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-purple-400 mt-1">
                {data?.tests_completed ?? "—"} Mocks
              </div>
              <span className="text-[11px] text-purple-300 font-mono-numbers">Submitted attempts</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accuracy Over Time Chart */}
            <div className="why-glass-card p-6 rounded-[16px] border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Accuracy Trajectory</h3>
                  <p className="text-[11px] text-slate-400">Accuracy from stored question attempts</p>
                </div>
                {data?.monthly_trends?.length ? <span className="text-[12px] font-mono-numbers text-slate-400">{data.monthly_trends.length} active months</span> : null}
              </div>

              <div className="h-56 mt-4">
                {monthlyTrends.length ? <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#120B24",
                        borderRadius: "10px",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#A855F7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#A855F7" }}
                      activeDot={{ r: 6, fill: "#38BDF8" }}
                    />
                  </LineChart>
                </ResponsiveContainer> : <p className="pt-20 text-center text-sm text-slate-500">No question history yet</p>}
              </div>
            </div>

            {/* Questions Solved Volume */}
            <div className="why-glass-card p-6 rounded-[16px] border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Monthly Practice Volume</h3>
                  <p className="text-[11px] text-slate-400">Monthly question attempts</p>
                </div>
                {monthlyTrends.length ? <span className="text-[12px] font-mono-numbers text-slate-400">{monthlyTrends.length} months</span> : null}
              </div>

              <div className="h-56 mt-4">
                {monthlyTrends.length ? <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#120B24",
                        borderRadius: "10px",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="questions" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer> : <p className="pt-20 text-center text-sm text-slate-500">No question history yet</p>}
              </div>
            </div>
          </div>

          {/* Subject Breakdown Cards */}
          <div className="why-glass-card p-6 rounded-[16px] border border-white/10">
            <h3 className="text-[15px] font-bold text-white pb-3 border-b border-white/10">
              Subject Mastery Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {subjectPerformance.length ? subjectPerformance.map((subj, idx) => (
                <div key={idx} className="p-4 rounded-[12px] bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[14px]">{subj.subject}</span>
                    <span className="text-[13px] font-mono-numbers font-bold text-cyan-400">
                      {subj.accuracy == null ? "—" : `${subj.accuracy}%`}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${subj.accuracy ?? 0}%`, backgroundColor: ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981"][idx % 4] }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono-numbers">
                    <span>{subj.solved} questions</span>
                    <span>Accuracy</span>
                  </div>
                </div>
              )) : <p className="py-8 text-center text-sm text-slate-500 sm:col-span-3">No subject data available yet</p>}
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
