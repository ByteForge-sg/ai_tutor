"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchTests, startTest, switchUserExam } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { TestItem, ExamType } from "@/types";
import {
  GraduationCap,
  Clock,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  X,
  Sparkles
} from "lucide-react";

export default function TestsPage() {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestForInstructions, setSelectedTestForInstructions] = useState<TestItem | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const loadTests = async (exam: ExamType) => {
    try {
      setLoading(true);
      const res = await fetchTests(exam, "user_demo");
      setTests(res);
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
    loadTests(user?.target_exam || "JEE");
  }, []);

  const handleStartExam = async () => {
    if (!selectedTestForInstructions || !acceptedTerms || isStarting) return;

    try {
      setIsStarting(true);
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request bypassed by browser permissions", err);
      }

      const attempt = await startTest(selectedTestForInstructions.id, "user_demo");
      router.push(`/exam/${attempt.id}`);
    } catch (e) {
      console.error("Failed to start exam", e);
      setIsStarting(false);
    }
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
            loadTests(newExam);
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] to-[#38BDF8] flex items-center justify-center">
                <GraduationCap size={18} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Exam Simulations & Test Series
              </h1>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              Full {currentExam} simulation with server-controlled countdown and integrity monitoring.
            </p>
          </div>

          {/* Test cards list */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-[13px] text-slate-400 font-mono-numbers">Loading test papers...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tests.map((t) => (
                <div
                  key={t.id}
                  className="why-glass-card p-6 flex flex-col justify-between rounded-[18px] border border-purple-500/20 hover:border-purple-500/50 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono-numbers">
                        {t.test_type}
                      </span>
                      <span className="text-[12px] font-bold text-slate-400 font-mono-numbers">
                        {t.difficulty}
                      </span>
                    </div>

                    <h3 className="text-[18px] font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-[13px] text-slate-400 mt-1">
                      {t.subject || "All Subjects"} • {t.chapter || "Complete Syllabus"}
                    </p>

                    {/* Meta stats */}
                    <div className="grid grid-cols-3 gap-2 mt-5 p-3.5 bg-white/5 rounded-[12px] border border-white/10 text-center text-[12px]">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Questions</span>
                        <span className="font-extrabold font-mono-numbers text-white text-[16px]">
                          {t.questions_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Duration</span>
                        <span className="font-extrabold font-mono-numbers text-cyan-400 text-[16px]">
                          {t.duration_minutes}m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Max Marks</span>
                        <span className="font-extrabold font-mono-numbers text-emerald-400 text-[16px]">
                          {t.total_marks}
                        </span>
                      </div>
                    </div>

                    {/* Scheme note */}
                    <div className="mt-4 text-[11px] text-slate-400 flex items-center justify-between font-mono-numbers">
                      <span>Scheme: +{t.marking_correct} Correct, {t.marking_incorrect} Incorrect</span>
                      {t.last_score !== null && (
                        <span className="text-emerald-400 font-bold">
                          Last: {t.last_score}/{t.total_marks}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setSelectedTestForInstructions(t);
                        setAcceptedTerms(false);
                      }}
                      className="why-btn-gradient w-full py-2.5 text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                    >
                      <span>Take Test</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pre-Exam Instructions Modal */}
          {selectedTestForInstructions && (
            <div className="fixed inset-0 z-50 bg-[#07050E]/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#120D24] rounded-[18px] border border-purple-500/40 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-purple-400" />
                    <h3 className="text-[17px] font-bold text-white">
                      Exam Mode Instructions
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTestForInstructions(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-md"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="py-4 space-y-4 text-[13px] text-slate-300 leading-relaxed">
                  <div className="p-3.5 bg-purple-950/40 rounded-[10px] border border-purple-500/30">
                    <h4 className="font-bold text-white text-[15px]">
                      {selectedTestForInstructions.title}
                    </h4>
                    <p className="text-[12px] text-purple-300 mt-0.5 font-mono-numbers">
                      {selectedTestForInstructions.questions_count} Questions • {selectedTestForInstructions.duration_minutes} Minutes • Max Marks: {selectedTestForInstructions.total_marks}
                    </p>
                  </div>

                  <ul className="space-y-2 list-disc pl-5 text-slate-300">
                    <li><strong>The timer cannot be paused.</strong> The backend server maintains the official deadline.</li>
                    <li><strong>AI assistance is locked during live exam.</strong> Refuses hints or solutions while status is RUNNING.</li>
                    <li><strong>Your answers will be evaluated after submission</strong> with complete WHY diagnoses.</li>
                    <li><strong>Fullscreen mode is required.</strong> Emulates testing center software.</li>
                    <li><strong>Leaving the exam window is logged as an integrity event.</strong> Tab switches are recorded.</li>
                  </ul>

                  <div className="pt-2 border-t border-white/10">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-bold text-white">
                        I understand the instructions and agree to adhere to the exam environment rules.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedTestForInstructions(null)}
                    className="why-btn-dark px-4 py-2 text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartExam}
                    disabled={!acceptedTerms || isStarting}
                    className="why-btn-gradient px-5 py-2 text-[13px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Initializing Exam...</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={14} />
                        <span>Start Exam</span>
                      </>
                    )}
                  </button>
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
