"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchWeaknesses, startWeaknessIntervention, submitWeaknessIntervention, switchUserExam } from "@/lib/api";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import { WeaknessItem, InterventionData, InterventionResult, ExamType } from "@/types";
import {
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  X
} from "lucide-react";

function WeaknessesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [error, setError] = useState<string | null>(null);
  const initialTopic = searchParams.get("topic");

  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeIntervention, setActiveIntervention] = useState<InterventionData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [interventionAnswers, setInterventionAnswers] = useState<Record<string, string>>({});
  const [interventionResult, setInterventionResult] = useState<InterventionResult | null>(null);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const loadWeaknesses = async (userId: string, exam: ExamType) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeaknesses(userId, exam);
      setWeaknesses(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load weaknesses.";
      setError(message);
      console.error("Failed to load weaknesses:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    const exam = currentUser.target_exam || "JEE";
    setCurrentExam(exam);
    void loadWeaknesses(currentUser.id, exam);
  }, [router]);

  useEffect(() => {
    if (initialTopic && user) {
      void handleStartIntervention(initialTopic);
    }
    // Run when the signed-in user/topic is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, user?.id]);

  const handleStartIntervention = async (topic: string) => {
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      const data = await startWeaknessIntervention(topic, user.id, currentExam);
      setActiveIntervention(data);
      setCurrentStep(1);
      setInterventionAnswers({});
      setInterventionResult(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to launch intervention.";
      setError(message);
      console.error("Failed to launch intervention:", e);
    }
  };

  const handleFinishIntervention = async () => {
    if (!activeIntervention || !user) return;
    try {
      setIsSubmittingIntervention(true);
      const res = await submitWeaknessIntervention(
        activeIntervention.intervention_id,
        interventionAnswers,
        user.id
      );
      setInterventionResult(res);
      await loadWeaknesses(user.id, currentExam);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to submit intervention.";
      setError(message);
      console.error("Failed to submit intervention:", e);
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  const formatMistakeType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={async (newExam) => {
            if (!user) {
              router.replace("/login");
              return;
            }
            const previousExam = currentExam;
            setCurrentExam(newExam);
            try {
              await switchUserExam(user.id, newExam);
              const updatedUser = { ...user, target_exam: newExam };
              setUser(updatedUser);
              setCurrentUser(updatedUser);
              await loadWeaknesses(user.id, newExam);
            } catch (e) {
              setCurrentExam(previousExam);
              const message = e instanceof Error ? e.message : "Failed to switch exam.";
              setError(message);
              console.error("Failed to switch exam:", e);
            }
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Weaknesses & Recurring Patterns
              </h1>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              Cognitive error patterns detected across your test and practice history.
            </p>
          </div>

          {error && (
            <div className="why-glass-card p-4 border border-rose-500/40 text-rose-300 rounded-[12px]">
              <p className="text-[13px]">{error}</p>
              {error.toLowerCase().includes("authentication") && (
                <button
                  onClick={() => router.replace("/login")}
                  className="mt-3 why-btn-gradient px-4 py-2 text-[12px]"
                >
                  Sign in again
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-[13px] text-slate-400 font-mono-numbers">Synthesizing recurring pattern records...</p>
            </div>
          ) : weaknesses.length === 0 ? (
            <div className="why-glass-card p-12 text-center rounded-[16px]">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
              <h3 className="text-[16px] font-bold text-white">No critical weaknesses detected</h3>
              <p className="text-[13px] text-slate-400 mt-1">
                Keep attempting diverse questions to stress-test your conceptual foundation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weaknesses.map((w) => (
                <div
                  key={w.id}
                  className="why-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-amber-500 rounded-[16px] hover:border-purple-500/50 transition-all group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-mono-numbers">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {formatMistakeType(w.mistake_type)}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                        {w.occurrences} mistakes detected
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          w.trend === "improving"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {w.trend === "improving" ? "↓ Improving" : "⚡ Recurring"}
                      </span>
                    </div>

                    <h3 className="text-[20px] font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                      {w.topic}
                    </h3>
                    <p className="text-[13px] text-slate-400">
                      {w.subject} → {w.chapter}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono-numbers">Accuracy</span>
                      <span className="text-[24px] font-extrabold font-mono-numbers text-rose-400">
                        {w.accuracy_percent}%
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartIntervention(w.topic)}
                      className="why-btn-gradient px-4 py-2.5 text-[13px] flex items-center gap-2 shadow-lg shadow-purple-500/30"
                    >
                      <Sparkles size={14} />
                      <span>Fix This Weakness</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5-Step Adaptive Intervention Modal */}
          {activeIntervention && (
            <div className="fixed inset-0 z-50 bg-[#07050E]/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#120D24] rounded-[20px] border border-purple-500/40 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 font-mono-numbers">
                      Adaptive Guided Intervention
                    </span>
                    <h3 className="text-[20px] font-bold text-white">
                      {activeIntervention.topic}
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveIntervention(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-md"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 5-Step Progress Tabs */}
                {!interventionResult && (
                  <div className="py-3 flex items-center justify-between border-b border-white/10 text-[12px] font-semibold">
                    {[
                      "1. Refresher",
                      "2. Worked Example",
                      "3. Similar Q",
                      "4. Practice Set",
                      "5. Challenge Q",
                    ].map((stepName, sIdx) => {
                      const stepNum = sIdx + 1;
                      const isActive = currentStep === stepNum;
                      const isDone = currentStep > stepNum;
                      return (
                        <div
                          key={sIdx}
                          className={`flex items-center gap-1.5 ${
                            isActive
                              ? "text-purple-400 font-bold"
                              : isDone
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono-numbers ${
                              isActive
                                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/50"
                                : isDone
                                ? "bg-emerald-600 text-white"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {stepNum}
                          </span>
                          <span className="hidden sm:inline">{stepName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step Content */}
                <div className="py-5">
                  {/* Step 1: Concept Refresher */}
                  {currentStep === 1 && !interventionResult && (
                    <div className="space-y-4 text-[13px] leading-relaxed">
                      <div className="p-4 bg-purple-950/40 rounded-[12px] border border-purple-500/30">
                        <h4 className="font-bold text-white text-[15px] flex items-center gap-2">
                          <BookOpen size={16} className="text-purple-400" />
                          <span>{activeIntervention.concept_refresher.title}</span>
                        </h4>
                        <div className="mt-2.5 space-y-1.5 text-purple-200">
                          {activeIntervention.concept_refresher.key_principles.map((kp, kIdx) => (
                            <p key={kIdx}>• {kp}</p>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-rose-950/40 rounded-[12px] border border-rose-500/30 text-rose-200">
                        <strong className="text-rose-400">Avoid this classic trap: </strong>
                        {activeIntervention.concept_refresher.common_trap}
                      </div>

                      <div className="p-3.5 bg-white/5 rounded-[12px] border border-white/10 font-mono-numbers text-[12px] text-cyan-300">
                        <strong className="text-white">Quick Formula Sheet: </strong>
                        {activeIntervention.concept_refresher.formula_sheet}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Worked Example */}
                  {currentStep === 2 && !interventionResult && (
                    <div className="space-y-4 text-[13px] leading-relaxed">
                      <div className="p-5 bg-white/5 rounded-[12px] border border-white/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono-numbers">
                          Standard Archetype Problem
                        </span>
                        <h4 className="font-bold text-white text-[15px] mt-1">
                          {activeIntervention.worked_example.problem}
                        </h4>

                        <div className="mt-3.5 space-y-2 pt-2.5 border-t border-white/10 text-slate-300">
                          <p><strong className="text-purple-400 font-mono-numbers">Step 1: </strong>{activeIntervention.worked_example.step_1}</p>
                          <p><strong className="text-purple-400 font-mono-numbers">Step 2: </strong>{activeIntervention.worked_example.step_2}</p>
                          <p><strong className="text-purple-400 font-mono-numbers">Step 3: </strong>{activeIntervention.worked_example.step_3}</p>
                          <p><strong className="text-purple-400 font-mono-numbers">Step 4: </strong>{activeIntervention.worked_example.step_4}</p>
                        </div>

                        <div className="mt-3.5 p-3 bg-emerald-950/40 rounded-[8px] border border-emerald-500/30 text-emerald-300 font-semibold text-[12px]">
                          <strong>Key Takeaway: </strong>{activeIntervention.worked_example.takeaway}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Similar Question */}
                  {currentStep === 3 && !interventionResult && (
                    <div className="space-y-4">
                      <div className="p-5 bg-white/5 rounded-[12px] border border-white/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 font-mono-numbers">
                          Targeted Transfer Question
                        </span>
                        <p className="text-[15px] font-medium text-white mt-2 leading-relaxed">
                          {activeIntervention.similar_question.question_text}
                        </p>

                        <div className="mt-4 space-y-2 text-[13px]">
                          {activeIntervention.similar_question.options.map((opt, oIdx) => {
                            const optKey = opt.charAt(0);
                            const isSelected =
                              interventionAnswers[activeIntervention.similar_question.id] === optKey;
                            return (
                              <div
                                key={oIdx}
                                onClick={() =>
                                  setInterventionAnswers((prev) => ({
                                    ...prev,
                                    [activeIntervention.similar_question.id]: optKey,
                                  }))
                                }
                                className={`p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-purple-950/50 border-purple-500 text-white font-bold ring-2 ring-purple-500/50"
                                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                                }`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Practice Set */}
                  {currentStep === 4 && !interventionResult && (
                    <div className="space-y-4">
                      <span className="text-[12px] font-semibold text-slate-400">
                        Solve these 2 consolidation questions:
                      </span>
                      {activeIntervention.practice_set.map((q, qIdx) => (
                        <div key={q.id} className="p-4 bg-white/5 rounded-[12px] border border-white/10">
                          <span className="text-[11px] font-bold uppercase text-purple-400 font-mono-numbers">
                            Practice Item {qIdx + 1}
                          </span>
                          <p className="text-[14px] font-medium text-white mt-1 leading-relaxed">
                            {q.question_text}
                          </p>

                          <div className="mt-3 space-y-1.5 text-[13px]">
                            {q.options.map((opt, oIdx) => {
                              const optKey = opt.charAt(0);
                              const isSelected = interventionAnswers[q.id] === optKey;
                              return (
                                <div
                                  key={oIdx}
                                  onClick={() =>
                                    setInterventionAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: optKey,
                                    }))
                                  }
                                  className={`p-2.5 rounded-[8px] border cursor-pointer ${
                                    isSelected
                                      ? "bg-purple-950/50 border-purple-500 text-white font-bold ring-1 ring-purple-500"
                                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                                  }`}
                                >
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 5: Challenge Question */}
                  {currentStep === 5 && !interventionResult && (
                    <div className="space-y-4">
                      <div className="p-5 bg-white/5 rounded-[12px] border border-white/10">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-mono-numbers">
                          Final Challenge Question (Advanced)
                        </span>
                        <p className="text-[15px] font-medium text-white mt-2 leading-relaxed">
                          {activeIntervention.challenge_question.question_text}
                        </p>

                        <div className="mt-4 space-y-2 text-[13px]">
                          {activeIntervention.challenge_question.options.map((opt, oIdx) => {
                            const optKey = opt.charAt(0);
                            const isSelected =
                              interventionAnswers[activeIntervention.challenge_question.id] === optKey;
                            return (
                              <div
                                key={oIdx}
                                onClick={() =>
                                  setInterventionAnswers((prev) => ({
                                    ...prev,
                                    [activeIntervention.challenge_question.id]: optKey,
                                  }))
                                }
                                className={`p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-purple-950/50 border-purple-500 text-white font-bold ring-2 ring-purple-500/50"
                                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                                }`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REAL BEFORE VS AFTER RESULT DISPLAY */}
                  {interventionResult && (
                    <div className="py-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 size={32} />
                      </div>

                      <div>
                        <h4 className="text-[22px] font-extrabold text-white">
                          Adaptive Intervention Completed!
                        </h4>
                        <p className="text-[13px] text-slate-400 mt-1 max-w-md mx-auto">
                          {interventionResult.message}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-white/5 rounded-[14px] border border-white/10">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-mono-numbers uppercase">Before</span>
                          <span className="text-[26px] font-extrabold font-mono-numbers text-rose-400">
                            {interventionResult.accuracy_before}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-mono-numbers uppercase">After</span>
                          <span className="text-[26px] font-extrabold font-mono-numbers text-emerald-400">
                            {interventionResult.accuracy_after}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[13px] text-emerald-400 font-bold font-mono-numbers">
                        Measured Real Improvement: +{interventionResult.improvement_delta}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  {!interventionResult ? (
                    <>
                      <button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                        className="why-btn-dark px-4 py-2 text-[13px] disabled:opacity-40"
                      >
                        Back
                      </button>

                      {currentStep < 5 ? (
                        <button
                          onClick={() => setCurrentStep((prev) => prev + 1)}
                          className="why-btn-gradient px-5 py-2 text-[13px] flex items-center gap-1.5 shadow-md shadow-purple-500/30"
                        >
                          <span>Step {currentStep + 1}</span>
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={handleFinishIntervention}
                          disabled={isSubmittingIntervention}
                          className="why-btn-gradient px-5 py-2 text-[13px] flex items-center gap-2 shadow-md shadow-purple-500/30"
                        >
                          {isSubmittingIntervention ? "Calculating Gain..." : "Submit Intervention"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveIntervention(null)}
                      className="why-btn-gradient px-6 py-2 text-[13px] mx-auto shadow-md shadow-purple-500/30"
                    >
                      Done & Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </div>
  );
}

export default function WeaknessesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07050E] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-[13px] text-slate-400 font-mono-numbers">Loading cognitive weakness patterns...</p>
        </div>
      }
    >
      <WeaknessesContent />
    </Suspense>
  );
}
