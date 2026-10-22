"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import MistakeDiagnosisCard from "@/components/questions/MistakeDiagnosisCard";
import { getExamResults, switchUserExam } from "@/lib/api";
import { TestResult, ExamType } from "@/types";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  BarChart3
} from "lucide-react";
import Link from "next/link";

export default function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMistakeMap, setExpandedMistakeMap] = useState<Record<string, boolean>>({});
  const [filterResult, setFilterResult] = useState<"ALL" | "INCORRECT" | "CORRECT">("ALL");
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getExamResults(attemptId, "user_demo");
        setResult(data);

        const firstIncorrect = data.question_results.find((q) => !q.is_correct && !q.is_unattempted);
        if (firstIncorrect) {
          setExpandedMistakeMap({ [firstIncorrect.question_id]: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [attemptId]);

  const toggleMistakeExpand = (qId: string) => {
    setExpandedMistakeMap((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-[#07050E] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        <p className="text-[13px] text-slate-400 font-mono-numbers">Synthesizing post-exam diagnostic evaluation...</p>
      </div>
    );
  }

  const filteredQuestions = result.question_results.filter((q) => {
    if (filterResult === "INCORRECT") return !q.is_correct && !q.is_unattempted;
    if (filterResult === "CORRECT") return q.is_correct;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={result.exam}
          onExamChange={(newExam) => switchUserExam("user_demo", newExam)}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 font-mono-numbers">
                Diagnostic Evaluation
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {result.test_title}
              </h1>
              <p className="text-[13px] text-slate-400">
                Completed on {new Date(result.submitted_at).toLocaleString()} • Logged to cognitive mistake profile
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="why-btn-dark px-4 py-2 text-[13px]"
              >
                Dashboard
              </Link>
              <Link
                href="/weaknesses"
                className="why-btn-gradient px-4 py-2 text-[13px] flex items-center gap-1.5 shadow-md shadow-purple-500/30"
              >
                <span>View Weaknesses</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Top Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="why-glass-card p-5 border-l-4 border-l-purple-500 rounded-[14px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Score</span>
              <div className="text-[28px] font-extrabold font-mono-numbers text-white mt-1">
                {result.score}{" "}
                <span className="text-[15px] font-normal text-slate-400">/ {result.max_score}</span>
              </div>
              <span className="text-[11px] text-purple-300 font-semibold mt-0.5 block font-mono-numbers">
                {result.score >= 0 ? "Qualified Performance" : "Needs Remediation"}
              </span>
            </div>

            <div className="why-glass-card p-5 border-l-4 border-l-emerald-500 rounded-[14px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Accuracy</span>
              <div className="text-[28px] font-extrabold font-mono-numbers text-emerald-400 mt-1">
                {result.accuracy_percent}%
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block font-mono-numbers">
                {result.correct_count} of {result.correct_count + result.incorrect_count} attempted
              </span>
            </div>

            <div className="why-glass-card p-5 border-l-4 border-l-cyan-500 rounded-[14px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Time Used</span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-cyan-400 mt-1">
                {formatTime(result.time_used_seconds)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block font-mono-numbers">
                Avg ~{Math.round(result.time_used_seconds / Math.max(1, result.total_questions))}s / question
              </span>
            </div>

            <div className="why-glass-card p-5 border-l-4 border-l-amber-500 rounded-[14px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Integrity Record</span>
              <div className="text-[26px] font-extrabold font-mono-numbers text-amber-400 mt-1">
                {result.integrity_flags_count} <span className="text-[14px] font-normal text-slate-400">events</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {result.integrity_flags_count === 0 ? "Clean testing environment" : "Monitored violations logged"}
              </span>
            </div>
          </div>

          {/* Quick Breakdown Badges */}
          <div className="flex items-center gap-4 p-4 why-glass-card rounded-[14px] text-[13px] font-mono-numbers">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-extrabold text-emerald-400">{result.correct_count}</span>
              <span className="text-slate-400">Correct</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="font-extrabold text-rose-400">{result.incorrect_count}</span>
              <span className="text-slate-400">Incorrect</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="font-extrabold text-slate-400">{result.unanswered_count}</span>
              <span className="text-slate-400">Unanswered</span>
            </div>
          </div>

          {/* Subject Breakdown Table */}
          <div className="why-glass-card p-6 rounded-[16px]">
            <h3 className="font-bold text-white text-[16px] pb-3 border-b border-white/10 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-400" />
              <span>Subject Performance Breakdown</span>
            </h3>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-wider font-mono-numbers">
                    <th className="pb-2.5">Subject</th>
                    <th className="pb-2.5">Questions</th>
                    <th className="pb-2.5">Attempted</th>
                    <th className="pb-2.5">Accuracy</th>
                    <th className="pb-2.5">Score</th>
                    <th className="pb-2.5">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-numbers text-slate-300">
                  {result.subject_breakdown.map((subj, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold text-white">{subj.subject}</td>
                      <td className="py-3">{subj.total_questions}</td>
                      <td className="py-3">{subj.attempted}</td>
                      <td className="py-3 font-extrabold text-emerald-400">{subj.accuracy_percent}%</td>
                      <td className="py-3 font-bold text-white">{subj.score} pts</td>
                      <td className="py-3 text-cyan-400">{subj.avg_time_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question-Wise Analysis Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-white/10 gap-3">
              <div>
                <h3 className="text-[18px] font-bold text-white tracking-tight">
                  Question-Wise Mistake Diagnosis
                </h3>
                <p className="text-[13px] text-slate-400">
                  Click &apos;WHY did I get this wrong?&apos; on any incorrect answer to inspect reasoning error.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 text-[12px]">
                <button
                  onClick={() => setFilterResult("ALL")}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${
                    filterResult === "ALL" ? "why-pill-active" : "text-slate-400"
                  }`}
                >
                  All ({result.total_questions})
                </button>
                <button
                  onClick={() => setFilterResult("INCORRECT")}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${
                    filterResult === "INCORRECT" ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-slate-400"
                  }`}
                >
                  Incorrect ({result.incorrect_count})
                </button>
                <button
                  onClick={() => setFilterResult("CORRECT")}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${
                    filterResult === "CORRECT" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400"
                  }`}
                >
                  Correct ({result.correct_count})
                </button>
              </div>
            </div>

            {/* List of Questions */}
            <div className="space-y-4">
              {filteredQuestions.map((q, qIdx) => {
                const isIncorrect = !q.is_correct && !q.is_unattempted;
                const isExpanded = Boolean(expandedMistakeMap[q.question_id]);

                return (
                  <div
                    key={q.question_id}
                    className="why-glass-card p-5 sm:p-6 rounded-[16px] border border-white/10 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-numbers px-2.5 py-0.5 rounded-full bg-purple-500/20 font-bold text-purple-300 border border-purple-500/30">
                          Q{qIdx + 1}
                        </span>
                        <span className="font-bold text-white">{q.concept}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono-numbers text-slate-400 flex items-center gap-1">
                          <Clock size={12} className="text-cyan-400" /> {q.time_taken_seconds}s
                        </span>
                        <span
                          className={`font-bold font-mono-numbers px-2.5 py-0.5 rounded-full text-[11px] ${
                            q.is_correct
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : q.is_unattempted
                              ? "bg-white/10 text-slate-400"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {q.marks_awarded > 0 ? `+${q.marks_awarded}` : q.marks_awarded} Marks
                        </span>
                      </div>
                    </div>

                    <p className="text-[16px] font-medium text-white mt-3 leading-relaxed">
                      {q.question_text}
                    </p>

                    {/* Option outcomes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[13px]">
                      <div
                        className={`p-3 rounded-[10px] border ${
                          q.is_unattempted
                            ? "bg-white/5 border-white/10 text-slate-400"
                            : q.is_correct
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold"
                            : "bg-rose-950/40 border-rose-500/40 text-rose-200 font-bold"
                        }`}
                      >
                        <span>Your Answer: </span>
                        <strong>{q.selected_answer || "Not Attempted"}</strong>
                      </div>

                      <div className="p-3 rounded-[10px] border border-emerald-500/40 bg-emerald-950/40 text-emerald-200 font-bold">
                        <span>Correct Answer: </span>
                        <strong>Option {q.correct_answer}</strong>
                      </div>
                    </div>

                    <div className="mt-3 p-3.5 bg-white/5 rounded-[12px] text-[13px] text-slate-300 leading-relaxed border border-white/10">
                      <strong className="text-white">Explanation: </strong>
                      {q.explanation}
                    </div>

                    {isIncorrect && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => toggleMistakeExpand(q.question_id)}
                          className="why-btn-gradient px-4 py-2 text-[12px] flex items-center gap-1.5 shadow-md shadow-purple-500/30"
                        >
                          <Sparkles size={13} />
                          <span>WHY did I get this wrong?</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && q.ai_diagnosis && (
                          <div className="mt-3">
                            <MistakeDiagnosisCard
                              diagnosis={q.ai_diagnosis}
                              topic={q.concept}
                              onFixWeakness={(top) => router.push(`/weaknesses?topic=${encodeURIComponent(top)}`)}
                              onAskCoach={() => setIsCoachOpen(true)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
