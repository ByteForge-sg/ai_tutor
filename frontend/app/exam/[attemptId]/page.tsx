"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getExamState, reportIntegrityEvent, submitExam } from "@/lib/api";
import { ActiveExamState } from "@/types";
import {
  Clock,
  CheckCircle2,
  Bookmark,
  ShieldAlert,
  BotMessageSquare,
  Sparkles,
  X
} from "lucide-react";
import AICoachDrawer from "@/components/coach/AICoachDrawer";

export default function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();

  const [examState, setExamState] = useState<ActiveExamState | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const [integrityFlagsCount, setIntegrityFlagsCount] = useState(0);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await getExamState(attemptId);
        setExamState(data);
        setUserAnswers(data.answers || {});
        setSecondsRemaining(data.time_remaining_seconds);
      } catch (err) {
        console.error("Failed to load active exam", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [attemptId]);

  useEffect(() => {
    if (loading || !examState) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, examState]);

  useEffect(() => {
    if (loading || !examState) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const res = await reportIntegrityEvent(attemptId, "TAB_SWITCH", "User switched tab or minimized window");
        handleIntegrityAlert(res);
      }
    };

    const handleWindowBlur = async () => {
      const res = await reportIntegrityEvent(attemptId, "WINDOW_BLUR", "Exam window lost focus");
      handleIntegrityAlert(res);
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        const res = await reportIntegrityEvent(attemptId, "FULLSCREEN_EXIT", "User exited fullscreen mode");
        handleIntegrityAlert(res);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leaving the exam window may be recorded as an integrity event.";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loading, examState, attemptId]);

  const handleIntegrityAlert = (res: any) => {
    setIntegrityFlagsCount(res.flags_count);
    if (res.flags_count === 1) {
      setIntegrityWarning(
        "Integrity Notice: Tab switch or window blur detected. Controlled exam environment active."
      );
    } else {
      setIntegrityWarning(
        `Critical Integrity Warning: Repeated event detected (${res.flags_count} violations). Attempt flagged on server.`
      );
    }
  };

  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await submitExam(attemptId, userAnswers, "user_demo");
      router.push(`/results/${res.attempt_id}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await submitExam(attemptId, userAnswers, "user_demo");
      router.push(`/results/${res.attempt_id}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const getQuestionPaletteState = (idx: number, qId: string) => {
    const isAns = Boolean(userAnswers[qId]);
    const isMkd = Boolean(markedForReview[qId]);

    if (isAns && isMkd) return "ANSWERED_MARKED";
    if (isAns) return "ANSWERED";
    if (isMkd) return "MARKED";
    if (visited[idx]) return "NOT_ANSWERED";
    return "NOT_VISITED";
  };

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  if (loading || !examState) {
    return (
      <div className="min-h-screen bg-[#07050E] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        <p className="text-[13px] text-slate-400 font-mono-numbers">Initializing locked exam environment...</p>
      </div>
    );
  }

  const currentQ = examState.questions[currentQIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#07050E] text-white flex flex-col select-none">
      {/* Top Header */}
      <header className="h-[64px] bg-[#0A0716] border-b border-purple-500/15 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-extrabold text-[17px] text-white">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-purple-500 to-cyan-400"></span>
            <span>WHY</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <h2 className="text-[14px] font-bold text-white leading-tight">
              {examState.test_title}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono-numbers">
              Controlled Testing Environment
            </span>
          </div>
        </div>

        {/* Server Countdown Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 text-white font-mono-numbers text-[14px] font-bold shadow-lg shadow-purple-500/20">
            <Clock size={16} className="text-cyan-400 animate-pulse" />
            <span>Time Left: {formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setIsCoachOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[12px] font-semibold hover:bg-rose-900/50"
            title="AI Coach is locked during active exam"
          >
            <BotMessageSquare size={14} />
            <span>AI Coach (Locked)</span>
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="why-btn-gradient px-4 py-1.5 text-[13px] font-bold shadow-md shadow-purple-500/30"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Integrity Warning Floating Alert */}
      {integrityWarning && (
        <div className="bg-rose-950/80 border-b border-rose-500/50 px-6 py-2.5 flex items-center justify-between text-[13px] text-rose-200 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-400 shrink-0" />
            <span className="font-semibold">{integrityWarning}</span>
          </div>
          <button
            onClick={() => setIntegrityWarning(null)}
            className="text-[12px] font-bold text-rose-400 hover:underline"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left: Question Card & Action Controls */}
        <div className="flex-1 flex flex-col justify-between why-glass-card p-6 sm:p-8 rounded-[18px] border border-purple-500/20">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px] text-white">
                  Question {currentQIndex + 1}
                </span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400 font-mono-numbers">{examState.total_questions}</span>
                <span className="ml-2 font-mono-numbers px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] border border-purple-500/30">
                  {currentQ.subject} • {currentQ.topic}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[12px] font-mono-numbers font-bold">
                <span className="text-emerald-400">+4.0</span>
                <span className="text-rose-400">-1.0</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-6">
              <p className="text-[17px] font-medium text-white leading-relaxed">
                {currentQ.question_text}
              </p>

              {/* Options */}
              <div className="mt-6 space-y-3">
                {currentQ.options.map((opt, oIdx) => {
                  const optChar = opt.charAt(0);
                  const isSelected = userAnswers[currentQ.id] === optChar;

                  return (
                    <div
                      key={oIdx}
                      onClick={() => {
                        setUserAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: optChar,
                        }));
                      }}
                      className={`p-4 rounded-[12px] border text-[14px] cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-purple-500 bg-purple-950/40 text-white font-bold ring-2 ring-purple-500/50 shadow-md shadow-purple-500/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 size={18} className="text-purple-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMarkedForReview((prev) => ({
                    ...prev,
                    [currentQ.id]: !prev[currentQ.id],
                  }));
                }}
                className={`px-3.5 py-2 rounded-[10px] border font-semibold flex items-center gap-1.5 transition-colors ${
                  markedForReview[currentQ.id]
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "border-white/10 text-slate-300 hover:bg-white/5"
                }`}
              >
                <Bookmark size={15} />
                <span>{markedForReview[currentQ.id] ? "Marked for Review" : "Mark for Review"}</span>
              </button>

              <button
                onClick={() => {
                  setUserAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[currentQ.id];
                    return copy;
                  });
                }}
                className="px-3.5 py-2 rounded-[10px] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-medium"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentQIndex === 0}
                onClick={() => {
                  setCurrentQIndex((prev) => Math.max(0, prev - 1));
                  setVisited((prev) => ({ ...prev, [currentQIndex - 1]: true }));
                }}
                className="why-btn-dark px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() => {
                  if (currentQIndex < examState.total_questions - 1) {
                    setCurrentQIndex((prev) => prev + 1);
                    setVisited((prev) => ({ ...prev, [currentQIndex + 1]: true }));
                  } else {
                    setShowSubmitModal(true);
                  }
                }}
                className="why-btn-gradient px-5 py-2 shadow-md shadow-purple-500/30"
              >
                {currentQIndex < examState.total_questions - 1 ? "Save & Next" : "Review & Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Palette & Summary */}
        <div className="w-full lg:w-[320px] flex flex-col space-y-4 shrink-0">
          <div className="why-glass-card p-4 rounded-[16px] border border-purple-500/20">
            <h4 className="text-[13px] font-bold text-white mb-3">Attempt Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-mono-numbers">
              <div className="p-2.5 bg-emerald-950/40 rounded-[8px] border border-emerald-500/30 flex items-center justify-between">
                <span className="text-emerald-300">Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="p-2.5 bg-rose-950/40 rounded-[8px] border border-rose-500/30 flex items-center justify-between">
                <span className="text-rose-300">Unanswered:</span>
                <span className="font-bold text-rose-400">{examState.total_questions - answeredCount}</span>
              </div>
              <div className="p-2.5 bg-amber-950/40 rounded-[8px] border border-amber-500/30 flex items-center justify-between col-span-2">
                <span className="text-amber-300">Marked for Review:</span>
                <span className="font-bold text-amber-400">{markedCount}</span>
              </div>
            </div>
          </div>

          <div className="why-glass-card p-4 rounded-[16px] border border-purple-500/20 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <h4 className="text-[13px] font-bold text-white">Question Palette</h4>
                <span className="text-[11px] text-slate-400 font-mono-numbers">1 to {examState.total_questions}</span>
              </div>

              <div className="grid grid-cols-5 gap-2 font-mono-numbers">
                {examState.questions.map((q, qIdx) => {
                  const paletteState = getQuestionPaletteState(qIdx, q.id);
                  const isCurrent = currentQIndex === qIdx;

                  let btnStyle = "bg-white/5 text-slate-400 border-white/10";
                  if (paletteState === "ANSWERED") {
                    btnStyle = "bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30";
                  } else if (paletteState === "ANSWERED_MARKED") {
                    btnStyle = "bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-500/30";
                  } else if (paletteState === "MARKED") {
                    btnStyle = "bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/30";
                  } else if (paletteState === "NOT_ANSWERED") {
                    btnStyle = "bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-500/30";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQIndex(qIdx);
                        setVisited((prev) => ({ ...prev, [qIdx]: true }));
                      }}
                      className={`h-9 rounded-[8px] text-[13px] font-bold border transition-all flex items-center justify-center relative ${btnStyle} ${
                        isCurrent ? "ring-2 ring-white scale-105" : ""
                      }`}
                    >
                      <span>{qIdx + 1}</span>
                      {markedForReview[q.id] && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10 border border-white/20 inline-block"></span>
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#07050E]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120D24] rounded-[18px] border border-purple-500/40 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-[17px] font-bold text-white pb-2 border-b border-white/10">
              Submit Examination Paper?
            </h3>

            <div className="py-4 space-y-3 text-[13px] text-slate-300">
              <p>
                Are you ready to finalize your test submission? Instantaneous AI mistake diagnoses and score breakdowns will be compiled.
              </p>

              <div className="p-3.5 bg-white/5 rounded-[12px] border border-white/10 space-y-1.5 font-mono-numbers">
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span className="font-bold text-emerald-400">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered:</span>
                  <span className="font-bold text-rose-400">{examState.total_questions - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-bold text-amber-400">{markedCount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="why-btn-dark px-4 py-2 text-[13px]"
              >
                Return to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="why-btn-gradient px-5 py-2 text-[13px] flex items-center gap-2"
              >
                {isSubmitting ? "Scoring Test..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        activeExamId={examState.status === "RUNNING" ? examState.id : null}
      />
    </div>
  );
}
