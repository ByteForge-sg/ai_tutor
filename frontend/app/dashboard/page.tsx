"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MetricCards from "@/components/dashboard/MetricCards";
import PerformanceIndexChart from "@/components/dashboard/PerformanceIndexChart";
import ConfidenceGauge from "@/components/dashboard/ConfidenceGauge";
import ContributionGrid from "@/components/dashboard/ContributionGrid";
import WeakestAreaCard from "@/components/dashboard/WeakestAreaCard";
import RecurringMistakeCard from "@/components/dashboard/RecurringMistakeCard";
import AISuiteCards from "@/components/dashboard/AISuiteCards";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchDashboard, switchUserExam } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { DashboardData, ExamType, User } from "@/types";
import {
  Sparkles,
  RefreshCw,
  Flame,
  ArrowRight,
  GraduationCap,
  Brain
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [activeHeaderPill, setActiveHeaderPill] = useState("AI Active");

  const loadData = async (exam: ExamType) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboard("user_demo", exam);
      setData(res);
      setCurrentExam(res.user.target_exam);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser?.target_exam) {
      setCurrentExam(currentUser.target_exam);
    }
    loadData(currentUser?.target_exam || "JEE");
  }, []);

  const handleExamChange = async (newExam: ExamType) => {
    setCurrentExam(newExam);
    try {
      await switchUserExam("user_demo", newExam);
      await loadData(newExam);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFixWeakness = (topic: string) => {
    router.push(`/weaknesses?topic=${encodeURIComponent(topic)}`);
  };

  const handleUnderstandWhy = () => {
    setIsCoachOpen(true);
  };

  const headerPills = [
    { label: "AI Active", action: () => setActiveHeaderPill("AI Active") },
    { label: "Take Test", action: () => router.push("/tests") },
    { label: "Fix Weakness", action: () => router.push("/weaknesses") },
    { label: "Practice", action: () => router.push("/practice") },
  ];

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      {/* Sidebar matching reference image */}
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={handleExamChange}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Welcome Header & Pill Switcher matching the reference image */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || "Aditya"}
              </h1>
              <p className="text-[13px] text-slate-400 mt-1">
                Here&apos;s what&apos;s happening with your exam intelligence and mistake trends today.
              </p>
            </div>

            {/* Pill Switcher matching image */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10 self-start md:self-auto">
              {headerPills.map((pill) => (
                <button
                  key={pill.label}
                  onClick={pill.action}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    activeHeaderPill === pill.label
                      ? "why-pill-active"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {loading && !data ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-[13px] text-slate-400 font-mono-numbers">
                Synthesizing cognitive mistake intelligence from database...
              </p>
            </div>
          ) : error ? (
            <div className="why-glass-card p-6 border-rose-500/40 text-rose-300">
              <h3 className="font-semibold text-[15px]">Failed to sync dashboard</h3>
              <p className="text-[13px] mt-1">{error}</p>
              <button
                onClick={() => loadData(currentExam)}
                className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-[12px] rounded-[8px] font-semibold"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* 1. Top 4 Metric Cards with Neon Sparklines matching the reference image */}
              <MetricCards
                questionsSolved={data.questions_solved}
                accuracy={data.accuracy_percent}
                currentStreak={data.current_streak}
                testsCompleted={data.tests_completed}
                weaknessesCount={data.weakest_area ? 3 : 1}
              />

              {/* 2. Main Middle Row: Performance Index Chart & Speedometer Gauge (matching the reference image!) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: AI Performance Index */}
                <div className="lg:col-span-2">
                  <PerformanceIndexChart growthPercent={data.monthly_growth_percent} />
                </div>

                {/* Right 1 Col: AI Confidence Index Speedometer Radial Gauge */}
                <div className="lg:col-span-1">
                  <ConfidenceGauge
                    score={data.accuracy_percent}
                    performance={24}
                    accuracy={Math.round(data.accuracy_percent * 0.45)}
                    efficiency={27}
                    reliability={17}
                  />
                </div>
              </div>

              {/* 3. Core Feature: GitHub-Style Practice Consistency Grid */}
              <ContributionGrid
                days={data.contribution_grid.days}
                totalQuestions={data.contribution_grid.total_questions_solved}
                currentStreak={data.contribution_grid.current_streak}
                longestStreak={data.contribution_grid.longest_streak}
              />

              {/* 4. Secondary Row: Weakest Area & Recurring Mistake */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WeakestAreaCard
                  weakness={data.weakest_area}
                  onFixWeakness={handleFixWeakness}
                />
                <RecurringMistakeCard
                  recurringMistake={data.recurring_mistake}
                  onUnderstandWhy={handleUnderstandWhy}
                />
              </div>

              {/* 5. Bottom AI Suite Cards matching the bottom section of reference image */}
              <AISuiteCards />
            </>
          ) : null}
        </main>
      </div>

      {/* Floating AI Coach Drawer */}
      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        onNavigateToWeakness={handleFixWeakness}
      />
    </div>
  );
}
