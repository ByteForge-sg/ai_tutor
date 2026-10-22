"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import MistakeDiagnosisCard from "@/components/questions/MistakeDiagnosisCard";
import { fetchQuestions, submitPracticeAnswer, switchUserExam } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Question, ExamType } from "@/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Info
} from "lucide-react";

export default function PracticePage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // Active question state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const loadQuestions = async (exam: ExamType, subj?: string, diff?: string) => {
    try {
      setLoading(true);
      const params: any = { exam };
      if (subj && subj !== "All") params.subject = subj;
      if (diff && diff !== "All") params.difficulty = diff;
      const res = await fetchQuestions(params);
      setQuestions(res);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsSubmitted(false);
      setAttemptResult(null);
      setTimerSeconds(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.target_exam) {
      setCurrentExam(user.target_exam);
    }
    loadQuestions(user?.target_exam || "JEE", selectedSubject, selectedDifficulty);
  }, []);

  useEffect(() => {
    loadQuestions(currentExam, selectedSubject, selectedDifficulty);
  }, [currentExam, selectedSubject, selectedDifficulty]);

  // Practice question timer
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, currentIndex]);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQ || submitting) return;
    try {
      setSubmitting(true);
      const res = await submitPracticeAnswer({
        user_id: "user_demo",
        question_id: currentQ.id,
        selected_answer: selectedOption,
        time_taken_seconds: timerSeconds,
      });
      setAttemptResult(res);
      setIsSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setAttemptResult(null);
      setTimerSeconds(0);
    }
  };

  const subjectsList =
    currentExam === "JEE"
      ? ["All", "Physics", "Chemistry", "Mathematics"]
      : ["All", "Physics", "Chemistry", "Biology"];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={(newExam) => {
            setCurrentExam(newExam);
            setSelectedSubject("All");
            switchUserExam("user_demo", newExam);
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Adaptive Practice
              </h1>
              <p className="text-[13px] text-slate-400 mt-0.5">
                Immediate reasoning feedback with WHY AI mistake diagnosis on every attempt.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              {/* Subject Filter Pills */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 shadow-xs">
                {subjectsList.map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                      selectedSubject === subj
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-purple-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#120D24] border border-white/10 rounded-[10px] px-3 py-1.5 text-[12px] font-semibold text-white focus:outline-none focus:border-purple-500"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-[13px] text-slate-400 font-mono-numbers">Loading curated question bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="why-glass-card p-12 text-center">
              <BookOpen size={36} className="text-slate-600 mx-auto mb-3" />
              <h3 className="text-[16px] font-semibold text-white">No questions found</h3>
              <p className="text-[13px] text-slate-400 mt-1">
                Try selecting &apos;All&apos; subjects or resetting filters.
              </p>
            </div>
          ) : currentQ ? (
            <div className="space-y-6">
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between text-[13px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span>•</span>
                  <span className="font-mono-numbers px-2 py-0.5 rounded-[4px] bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">
                    {currentQ.id}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-mono-numbers text-white font-semibold">
                    <Clock size={14} className="text-cyan-400" />
                    <span>{formatTimer(timerSeconds)}</span>
                  </div>

                  <span
                    className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono-numbers ${
                      currentQ.difficulty === "Easy"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : currentQ.difficulty === "Medium"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              {/* Main Question Card */}
              <div className="why-glass-card p-6 sm:p-8 border border-purple-500/20 rounded-[18px]">
                {/* Meta details */}
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10 text-[12px] text-slate-400 font-mono-numbers">
                  <span className="font-semibold text-white">{currentQ.subject}</span>
                  <span>›</span>
                  <span>{currentQ.chapter}</span>
                  <span>›</span>
                  <span className="font-bold text-purple-400">{currentQ.topic}</span>
                  <span className="ml-auto">
                    {currentQ.source_type} • {currentQ.year}
                  </span>
                </div>

                {/* Question Statement */}
                <p className="text-[17px] font-medium text-white leading-relaxed">
                  {currentQ.question_text}
                </p>

                {/* Options list */}
                <div className="mt-6 space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const optKey = opt.charAt(0); // 'A', 'B', 'C', 'D'
                    const isSelected = selectedOption === optKey;

                    let optionStyle =
                      "border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/40 text-slate-200";
                    if (isSelected) {
                      optionStyle =
                        "border-purple-500 bg-purple-950/40 text-white font-bold ring-2 ring-purple-500/50 shadow-md shadow-purple-500/20";
                    }
                    if (isSubmitted && attemptResult) {
                      if (optKey === attemptResult.correct_answer) {
                        optionStyle =
                          "border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold ring-2 ring-emerald-500/50";
                      } else if (isSelected && !attemptResult.is_correct) {
                        optionStyle =
                          "border-rose-500 bg-rose-950/40 text-rose-200 font-bold ring-2 ring-rose-500/50";
                      }
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => {
                          if (!isSubmitted) setSelectedOption(optKey);
                        }}
                        className={`p-4 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between text-[14px] ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {isSubmitted && attemptResult && (
                          optKey === attemptResult.correct_answer ? (
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                          ) : isSelected && !attemptResult.is_correct ? (
                            <XCircle size={18} className="text-rose-400 shrink-0" />
                          ) : null
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submission & Next Buttons */}
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[12px] text-slate-400">
                    {!isSubmitted ? "Select an option to evaluate your reasoning" : "Attempt recorded to your cognitive mistake profile"}
                  </div>

                  <div className="flex items-center gap-3">
                    {!isSubmitted ? (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption || submitting}
                        className="why-btn-gradient px-6 py-2.5 text-[14px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {submitting && (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>Submit Answer</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={currentIndex >= questions.length - 1}
                        className="why-btn-gradient px-6 py-2.5 text-[14px] flex items-center gap-2 disabled:opacity-50"
                      >
                        <span>Next Question</span>
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Immediate Feedback Card after submission */}
              {isSubmitted && attemptResult && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-[14px] border flex items-center justify-between ${
                      attemptResult.is_correct
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {attemptResult.is_correct ? (
                        <CheckCircle2 size={24} className="text-emerald-400" />
                      ) : (
                        <XCircle size={24} className="text-rose-400" />
                      )}
                      <div>
                        <div className="font-extrabold text-[16px]">
                          {attemptResult.is_correct ? "Correct Response (+4 Marks)" : "Incorrect Response (-1 Mark)"}
                        </div>
                        <div className="text-[12px] opacity-90 mt-0.5">
                          {attemptResult.is_correct
                            ? "Flawless grasp of the governing equations!"
                            : `Selected Option ${attemptResult.selected_answer}. Correct is ${attemptResult.correct_answer}.`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[12px] font-mono-numbers">
                      <span>Today: {attemptResult.questions_solved_today} solved</span>
                      {attemptResult.streak_updated === 1 && (
                        <span className="block text-emerald-400 font-bold">Streak Qualified 🔥</span>
                      )}
                    </div>
                  </div>

                  {/* SIGNATURE WHY EXPERIENCE CARD: AI Mistake Diagnosis (If incorrect) */}
                  {!attemptResult.is_correct && attemptResult.ai_diagnosis && (
                    <MistakeDiagnosisCard
                      diagnosis={attemptResult.ai_diagnosis}
                      topic={currentQ.topic}
                      onFixWeakness={(top) => router.push(`/weaknesses?topic=${encodeURIComponent(top)}`)}
                      onAskCoach={() => setIsCoachOpen(true)}
                    />
                  )}

                  {/* Detailed Explanation Card */}
                  <div className="why-glass-card p-5 bg-white/5 border border-white/10 rounded-[14px]">
                    <h4 className="text-[14px] font-bold text-white flex items-center gap-2 pb-2.5 border-b border-white/10">
                      <Info size={16} className="text-purple-400" />
                      <span>Step-by-Step Resolution & Concept Note</span>
                    </h4>

                    <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-300">
                      <p>
                        <strong className="text-white">Core Concept:</strong> {attemptResult.concept}
                      </p>
                      <p>
                        <strong className="text-white">Solution:</strong> {attemptResult.explanation}
                      </p>
                      <p className="text-rose-400 font-medium pt-1.5 border-t border-white/10">
                        <strong>Common Trap to Avoid:</strong> {attemptResult.common_mistake}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        onNavigateToWeakness={(top) => router.push(`/weaknesses?topic=${encodeURIComponent(top)}`)}
      />
    </div>
  );
}
