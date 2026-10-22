"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Target,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  Brain,
  Calendar,
  Compass,
  Zap,
  Flame,
  Award,
  Layers,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { getCurrentUser, loginWithGoogle } from "@/lib/auth";
import { User, ExamType } from "@/types";

export default function LandingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(2);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
  }, []);

  const handleInstantDemo = (email: string, name: string, exam: "JEE" | "NEET") => {
    loginWithGoogle(email, name, exam);
    router.push("/dashboard");
  };

  const loopSteps = [
    { title: "Question", subtitle: "Curated JEE / NEET", desc: "Solve realistic exam questions with countdown timer." },
    { title: "Mistake", subtitle: "Cognitive Deviation", desc: "System tracks exact selected option and hesitation time." },
    { title: "WHY?", subtitle: "Structured AI Diagnosis", desc: "Dissects reasoning failure into 9 distinct cognitive categories." },
    { title: "Pattern", subtitle: "Recurring Error Engine", desc: "Flags multiple errors across mechanics or calculus." },
    { title: "Intervention", subtitle: "5-Step Targeted Fix", desc: "Formula refresher, worked example, and targeted sets." },
    { title: "Improvement", subtitle: "Measurable Gain", desc: "Real recalculated before vs after accuracy verified by data." },
  ];

  return (
    <div className="min-h-screen bg-[#07050E] text-white flex flex-col relative overflow-hidden">
      {/* Background ambient neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#7C3AED]/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[#A855F7]/15 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="h-[70px] border-b border-white/10 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl bg-[#07050E]/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">WHY</span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
            AI Mistake Coach
          </span>
        </div>

        {/* Navigation links */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/practice" className="hover:text-white transition-colors">
            Practice
          </Link>
          <Link href="/tests" className="hover:text-white transition-colors">
            Tests
          </Link>
          <Link href="/pyqs" className="hover:text-white transition-colors">
            PYQs
          </Link>
          <Link href="/weaknesses" className="hover:text-white transition-colors">
            Weaknesses
          </Link>
          <Link href="/progress" className="hover:text-white transition-colors">
            Progress
          </Link>
        </div>

        {/* User CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[12px] font-bold text-white">{user.name}</span>
                <span className="text-[10px] text-purple-400 font-mono-numbers">{user.target_exam} Target</span>
              </div>
              <Link
                href="/dashboard"
                className="why-btn-gradient px-4 py-2 text-[13px] flex items-center gap-1.5"
              >
                <span>Open Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-[10px] border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white text-[13px] font-medium transition-all"
              >
                Sign In
              </Link>
              <button
                onClick={() => handleInstantDemo("aditya.sharma@jee2026.in", "Aditya Sharma", "JEE")}
                className="why-btn-gradient px-4 py-2 text-[13px] flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>1-Click Demo</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 lg:py-16 w-full z-10">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#C084FC] text-[12px] font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-[#38BDF8]" />
            <span>The Competitive Exam Loop: Question → Mistake → Pattern → Fix</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop asking how many questions you solved.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#38BDF8] block sm:inline">
              Start understanding WHY you got them wrong.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Other platforms tell you <span className="text-white font-semibold">what</span> you got wrong.{" "}
            <span className="font-bold text-[#38BDF8]">WHY</span> helps you understand{" "}
            <span className="text-white font-semibold underline decoration-purple-500 underline-offset-4">
              why you keep getting it wrong
            </span>{" "}
            with cognitive AI mistake diagnosis.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/dashboard"
              className="why-btn-gradient px-6 py-3 text-[15px] font-semibold flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg shadow-purple-500/30"
            >
              <Zap size={16} />
              <span>Launch AI Dashboard</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/practice"
              className="px-6 py-3 rounded-[12px] bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 text-white text-[15px] font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all"
            >
              <GraduationCap size={16} className="text-[#38BDF8]" />
              <span>Start Adaptive Practice</span>
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-[12px] bg-white text-slate-900 hover:bg-slate-100 text-[15px] font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all"
            >
              {/* Google G icon */}
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign In with Google</span>
            </Link>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[12px] text-slate-400">
            <span>Instant Demo Accounts:</span>
            <button
              onClick={() => handleInstantDemo("aditya.sharma@jee2026.in", "Aditya Sharma", "JEE")}
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
            >
              Aditya (JEE Main/Adv)
            </button>
            <span>•</span>
            <button
              onClick={() => handleInstantDemo("ananya.patel@neet2026.in", "Ananya Patel", "NEET")}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
            >
              Ananya (NEET UG)
            </button>
          </div>
        </div>

        {/* Central Feedback Loop Visual */}
        <div className="mt-16">
          <div className="text-center mb-6">
            <span className="text-[12px] font-bold uppercase tracking-wider text-purple-400">
              The Cognitive Architecture
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              The Closed-Loop Mistake Diagnosis Engine
            </h2>
            <p className="text-[13px] text-slate-400 mt-1">
              Every completed attempt trains the platform on your reasoning patterns.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {loopSteps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`why-glass-card p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-500/80 ring-2 ring-purple-500/40 bg-purple-900/20 shadow-lg shadow-purple-500/20"
                      : "hover:border-white/20 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-numbers text-slate-500">
                    <span className="text-purple-400 font-bold">0{idx + 1}</span>
                    {idx < 5 && <ArrowRight size={12} className="text-slate-600" />}
                  </div>
                  <div className="text-[15px] font-bold text-white mt-2">
                    {step.title}
                  </div>
                  <div className="text-[11px] font-semibold text-purple-400 mt-0.5">
                    {step.subtitle}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Product Preview */}
        <div className="mt-14 space-y-6">
          <div className="why-glass-card p-6 border border-purple-500/30 rounded-[18px] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
                <span className="text-[13px] font-semibold text-white">Live Product Simulation</span>
                <span className="text-[11px] text-slate-400 font-mono-numbers px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  JEE Physics Mechanics • 2024 PYQ
                </span>
              </div>
              <Link
                href="/practice"
                className="text-[12px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>Try Practice Engine</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Question Simulation */}
            <div className="py-4">
              <p className="text-[15px] font-medium text-slate-200 leading-relaxed">
                A solid uniform sphere and a thin hollow cylinder of the same mass M and radius R roll without slipping down an inclined plane of inclination θ from the same height. What is the ratio of their translational kinetic energies when they reach the bottom?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-[13px]">
                <div className="p-3.5 rounded-[10px] border border-rose-500/40 bg-rose-950/30 flex items-center justify-between text-rose-300 font-medium">
                  <span>A) 1 : 1 (Your Attempt)</span>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-rose-400 bg-rose-900/40 px-2 py-0.5 rounded">
                    Incorrect
                  </span>
                </div>
                <div className="p-3.5 rounded-[10px] border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between text-emerald-300 font-medium">
                  <span>D) 10 : 7 (Correct Answer)</span>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Embedded Signature WHY Experience Card */}
            <div className="mt-2 p-5 rounded-[14px] bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-indigo-950/40 border border-purple-500/40 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                <span className="font-extrabold uppercase tracking-wider text-[#C084FC] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#38BDF8]" />
                  WHY YOU GOT THIS WRONG
                </span>
                <span className="font-mono-numbers font-semibold text-purple-300 bg-purple-900/40 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  91% Confidence • Formula Recall
                </span>
              </div>

              <div className="mt-3.5 text-[13px] space-y-2.5">
                <p className="text-slate-200">
                  <strong className="text-purple-300">Diagnosis:</strong> You identified the correct physical quantity, but selected the translational-motion formula for a rotational case.
                </p>
                <p className="text-slate-200">
                  <strong className="text-amber-400">Concept Gap:</strong> Moment of inertia relationship in rolling constraints: <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono-numbers text-amber-200">K_trans / K_total = 1 / (1 + k²/R²)</code>.
                </p>
                <p className="text-slate-200">
                  <strong className="text-emerald-400">Actionable Rule:</strong> Always separate translational and rotational energy budgets before writing final conservation equations.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] text-slate-400">
                  Detected <strong className="text-purple-400 font-mono-numbers">7 times</strong> across Mechanics tests
                </span>
                <Link
                  href="/weaknesses"
                  className="why-btn-gradient px-4 py-1.5 text-[12px] flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Launch 5-Step Weakness Fix</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30">
              <Calendar size={20} />
            </div>
            <h3 className="text-[16px] font-bold text-white">GitHub-Style Activity Grid</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              6 full months of practice consistency. Solved counts true question attempts, separating daily discipline from accuracy.
            </p>
          </div>

          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30">
              <Brain size={20} />
            </div>
            <h3 className="text-[16px] font-bold text-white">9 Mistake Archetypes</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              Every error is categorized into formula recall, calculation slips, strategy misalignment, or time stress with validated AI diagnosis.
            </p>
          </div>

          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-[16px] font-bold text-white">Controlled Exam Environment</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              Fullscreen test runner with server-side deadlines, tab switch integrity monitoring, and strict live-test AI blocking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-6 lg:px-12 text-center text-[12px] text-slate-500 z-10 backdrop-blur-md bg-[#07050E]/80">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-2">
          <span>WHY — AI Mistake Coach • Built for JEE & NEET 2026</span>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/practice" className="hover:text-white transition-colors">Practice</Link>
            <Link href="/tests" className="hover:text-white transition-colors">Tests</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
