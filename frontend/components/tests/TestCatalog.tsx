"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchTests, startTest, switchUserExam } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ExamType, TestItem } from "@/types";
import { GraduationCap, ShieldAlert, ArrowRight, Maximize2, X, Clock } from "lucide-react";

export default function TestCatalog({ pyp = false }: { pyp?: boolean }) {
  const router = useRouter();
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TestItem | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const startingRef = useRef(false);
  const countdownLockRef = useRef(false);
  const countdownDialogRef = useRef<HTMLElement | null>(null);

  const loadTests = useCallback(async (exam: ExamType) => {
    try {
      const papers = await fetchTests(exam, undefined, pyp ? "PYP" : "TEST_SERIES");
      setTests(papers);
      setCurrentExam(exam);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load papers");
    } finally {
      setLoading(false);
    }
  }, [pyp]);

  useEffect(() => {
    const user = getCurrentUser();
    const exam = user?.target_exam || "JEE";
    const timer = window.setTimeout(() => void loadTests(exam), 0);
    return () => window.clearTimeout(timer);
  }, [loadTests]);

  const countdownActive = countdown !== null;
  useEffect(() => {
    if (!countdownActive) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    countdownDialogRef.current?.focus();
    const preventBackgroundKeys = (event: KeyboardEvent) => {
      const dialog = countdownDialogRef.current;
      if (dialog?.contains(event.target as Node)) {
        if (event.key === "Tab") {
          event.preventDefault();
          dialog.querySelector("button")?.focus();
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", preventBackgroundKeys, true);
    const timer = window.setInterval(() => setCountdown((remaining) => {
      if (remaining === null || remaining <= 1) {
        window.clearInterval(timer);
        return 0;
      }
      return remaining - 1;
    }), 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", preventBackgroundKeys, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [countdownActive]);

  useEffect(() => {
    if (countdown !== 0 || !selected || startingRef.current) return;
    startingRef.current = true;
    void (async () => {
      try {
        const attempt = await startTest(selected.id);
        router.push(`/exam/${attempt.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start this test");
        setCountdown(null);
        setIsStarting(false);
        startingRef.current = false;
        countdownLockRef.current = false;
      }
    })();
  }, [countdown, selected, router]);

  const beginCountdown = async () => {
    if (!selected || !accepted || isStarting || startingRef.current || countdownLockRef.current) return;
    countdownLockRef.current = true;
    setIsStarting(true);
    setError("");
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request was unavailable", e);
    }
    setCountdown(15);
  };

  const beginRetake = async (test: TestItem) => {
    if (isStarting || startingRef.current || countdownLockRef.current) return;
    countdownLockRef.current = true;
    setSelected(test);
    setAccepted(true);
    setIsStarting(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request was unavailable", e);
    }
    setCountdown(15);
  };

  const title = pyp ? "PYPs (Previous Year Papers)" : "Exam Simulations & Test Series";

  return <div className="flex min-h-screen bg-[#07050E] text-white">
    <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar currentExam={currentExam} onExamChange={(exam) => {
        setCurrentExam(exam);
        void switchUserExam(undefined, exam).catch((e) => setError(e.message));
        void loadTests(exam);
      }} onOpenCoach={() => setIsCoachOpen(true)} />
      <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <div className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={24} className="text-[#A855F7]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          </div>
          <p className="text-[13px] text-slate-400 mt-1">{pyp ? `Take ${currentExam} previous year papers in the same timed exam environment.` : `Full ${currentExam} simulation with server-controlled countdown and integrity monitoring.`}</p>
        </div>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {loading ? <div className="py-24 text-center text-[13px] text-slate-400">Loading test papers...</div> : tests.length === 0 ? (
          <div className="why-glass-card p-12 text-center rounded-[16px] border border-white/10">
            <h3 className="text-[17px] font-bold text-white">No papers available</h3>
            <p className="text-[13px] text-slate-400 mt-1">There are no {pyp ? "previous year papers" : "test series papers"} for {currentExam} yet.</p>
          </div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => <article key={test.id} className="why-glass-card p-6 flex flex-col rounded-[18px] border border-purple-500/20 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{test.test_type}</span>
              <span className="text-[12px] font-bold text-slate-400">{test.difficulty}</span>
            </div>
            <h3 className="text-[18px] font-bold text-white mt-3">{test.title}</h3>
            <p className="text-[13px] text-slate-400 mt-1">{test.subject || "All Subjects"} • {test.chapter || "Complete Syllabus"}</p>
            <div className="grid grid-cols-3 gap-2 mt-5 p-3.5 bg-white/5 rounded-[12px] border border-white/10 text-center text-[12px]">
              <div><span className="text-slate-400 block text-[11px]">Questions</span><b className="text-white text-[16px]">{test.questions_count}</b></div>
              <div><span className="text-slate-400 block text-[11px]">Duration</span><b className="text-cyan-400 text-[16px]">{test.duration_minutes}m</b></div>
              <div><span className="text-slate-400 block text-[11px]">Max Marks</span><b className="text-emerald-400 text-[16px]">{test.total_marks}</b></div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">Scheme: +{test.marking_correct} Correct, {test.marking_incorrect} Incorrect {test.last_score !== null && test.last_score !== undefined ? `• Last: ${test.last_score}/${test.total_marks}` : ""}</p>
            <button onClick={() => { setSelected(test); setAccepted(false); }} className="why-btn-gradient w-full mt-5 py-2.5 text-[14px] flex items-center justify-center gap-2"><span>{pyp ? "Take Paper" : "Take Test"}</span><ArrowRight size={15} /></button>
            {test.attempts?.length > 0 && <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <h4 className="text-[12px] font-semibold text-slate-300">Submitted attempts</h4>
              {test.attempts.map((attempt, index) => <div key={attempt.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-slate-400">Attempt {test.attempts.length - index} · {attempt.score}/{attempt.max_score}</span>
                <div className="flex gap-2">
                  <button className="px-2.5 py-1 rounded-md border border-white/10 text-slate-200 hover:bg-white/10" onClick={() => void beginRetake(test)}>Retake Test</button>
                  <button className="px-2.5 py-1 rounded-md border border-purple-500/30 text-purple-200 hover:bg-purple-500/15" onClick={() => router.push(`/results/${attempt.id}`)}>View Score</button>
                </div>
              </div>)}
            </div>}
          </article>)}
        </div>}
      </main>
    </div>
    <AICoachDrawer isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} />
    {selected && countdown === null && <div className="fixed inset-0 z-[100] bg-[#07050E]/80 backdrop-blur-md flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="instructions-title" className="bg-[#120D24] rounded-[18px] border border-purple-500/40 shadow-2xl max-w-xl w-full p-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10"><h2 id="instructions-title" className="flex items-center gap-2 text-[17px] font-bold"><ShieldAlert size={20} className="text-purple-400" />Exam Mode Instructions</h2><button aria-label="Close" disabled={isStarting} onClick={() => setSelected(null)} className="text-slate-400 hover:text-white p-1 disabled:opacity-40"><X size={18} /></button></div>
        <div className="py-4 space-y-4 text-[13px] text-slate-300 leading-relaxed"><div className="p-3.5 bg-purple-950/40 rounded-[10px] border border-purple-500/30"><h3 className="font-bold text-white text-[15px]">{selected.title}</h3><p className="text-[12px] text-purple-300 mt-0.5">{selected.questions_count} Questions • {selected.duration_minutes} Minutes • Max Marks: {selected.total_marks}</p></div><ul className="space-y-2 list-disc pl-5"><li>The timer cannot be paused; the server maintains the official deadline.</li><li>Your answers are saved and evaluated after submission.</li><li>Fullscreen mode is used for the exam environment.</li></ul><label className="flex items-start gap-2.5 cursor-pointer select-none"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4" /><span className="font-bold text-white">I understand the instructions and agree to adhere to the exam environment rules.</span></label></div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10"><button onClick={() => setSelected(null)} disabled={isStarting} className="why-btn-dark px-4 py-2 text-[13px] disabled:opacity-40">Cancel</button><button onClick={() => void beginCountdown()} disabled={!accepted || isStarting} className="why-btn-gradient px-5 py-2 text-[13px] flex items-center gap-2 disabled:opacity-40"><Maximize2 size={14} />Start Test</button></div>
      </section>
    </div>}
    {countdown !== null && <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <section ref={countdownDialogRef} role="dialog" aria-modal="true" aria-live="assertive" aria-labelledby="countdown-title" tabIndex={-1} className="w-full max-w-md rounded-2xl border border-purple-400/40 bg-[#120D24] shadow-2xl p-8 text-center outline-none">
        <Clock size={26} className="mx-auto text-purple-300" /><h2 id="countdown-title" className="mt-4 text-xl font-bold">Your test starts in 15 seconds</h2><div aria-label={`${countdown} seconds remaining`} className="font-mono-numbers text-6xl font-extrabold text-white my-5">{countdown}</div><p className="text-sm text-slate-300">{isStarting && countdown === 0 ? "Preparing your test…" : "Please get ready. Your test will begin automatically."}</p><button type="button" onClick={() => { setCountdown(null); setIsStarting(false); startingRef.current = false; countdownLockRef.current = false; }} className="mt-6 px-4 py-2 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10">Cancel countdown</button>
      </section>
    </div>}
  </div>;
}
