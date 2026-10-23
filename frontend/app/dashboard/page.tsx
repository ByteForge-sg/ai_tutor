"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { getCurrentUser, logout, setCurrentUser } from "@/lib/auth";
import { DashboardData, ExamType, User } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [activeHeaderPill, setActiveHeaderPill] = useState("AI Active");

  const loadData = useCallback(async (exam: ExamType) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboard(user?.id ?? undefined, exam);
      setData(res);
      setCurrentExam(res.user.target_exam);
      setUser(res.user);
      setCurrentUser(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    // Never silently fall back to a demo account.
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    setCurrentExam(currentUser.target_exam || "JEE");
    void loadData(currentUser.target_exam || "JEE");
  }, [router, loadData]);

  const handleExamChange = async (newExam: ExamType) => {
    if (!user) return;

    const previousExam = currentExam;
    setCurrentExam(newExam);
    try {
      const updated = await switchUserExam(user.id, newExam);
      if (updated?.user) {
        setUser(updated.user);
        setCurrentUser(updated.user);
      } else {
        setCurrentUser({ ...user, target_exam: newExam });
      }
      await loadData(newExam);
    } catch (err) {
      setCurrentExam(previousExam);
      setError(err instanceof Error ? err.message : "Failed to switch exam");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
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
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={handleExamChange}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || "Student"}
              </h1>
              <p className="text-[13px] text-slate-400 mt-1">
                Here&apos;s what&apos;s happening with your exam intelligence and mistake trends today.
              </p>
            </div>

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
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-slate-400 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>

          {loading && !data ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-[13px] text-slate-400 font-mono-numbers">
                Loading your dashboard...
              </p>
            </div>
          ) : error ? (
            <div className="why-glass-card p-6 border-rose-500/40 text-rose-300">
              <h3 className="font-semibold text-[15px]">Failed to sync dashboard</h3>
              <p className="text-[13px] mt-1">{error}</p>
              <button
                onClick={() => void loadData(currentExam)}
                className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-[12px] rounded-[8px] font-semibold"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              <MetricCards
                questionsSolved={data.questions_solved}
                accuracy={data.accuracy_percent}
                currentStreak={data.current_streak}
                testsCompleted={data.tests_completed}
                weaknessesCount={data.weaknesses_count}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PerformanceIndexChart growthPercent={data.monthly_growth_percent} score={data.questions_solved > 0 ? data.accuracy_percent : null} monthlyTrends={data.monthly_trends} />
                </div>
                <div className="lg:col-span-1">
                  <ConfidenceGauge
                    score={data.questions_solved > 0 ? data.accuracy_percent : null}
                  />
                </div>
              </div>

              <ContributionGrid
                days={data.contribution_grid.days}
                totalQuestions={data.contribution_grid.total_questions_solved}
                currentStreak={data.contribution_grid.current_streak}
                longestStreak={data.contribution_grid.longest_streak}
              />

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

              <AISuiteCards />
            </>
          ) : null}
        </main>
      </div>

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        onNavigateToWeakness={handleFixWeakness}
      />
    </div>
  );
}
