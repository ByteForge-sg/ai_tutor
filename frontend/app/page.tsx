"use client";

import React, { useState } from "react";
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
  TrendingUp
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { fetchCurrentUser } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(2);

  const loopSteps = [
    { title: "Question", subtitle: "Curated JEE / NEET", desc: "Solve realistic exam questions with countdown timer." },
    { title: "Mistake", subtitle: "Cognitive Deviation", desc: "System tracks exact selected option and hesitation time." },
    { title: "WHY?", subtitle: "Structured AI Diagnosis", desc: "Dissects reasoning failure into 9 distinct cognitive categories." },
    { title: "Pattern", subtitle: "Recurring Error Engine", desc: "Flags multiple errors across mechanics or calculus." },
    { title: "Intervention", subtitle: "5-Step Targeted Fix", desc: "Formula refresher, worked example, and targeted sets." },
    { title: "Improvement", subtitle: "Measurable Gain", desc: "Real recalculated before vs after accuracy verified by data." },
  ];

  const navigateWithSession = async (destination: string) => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }

    try {
      await fetchCurrentUser();
      router.push(destination);
    } catch {
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#07050E] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#7C3AED]/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[#A855F7]/15 rounded-full blur-[150px] pointer-events-none"></div>

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

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 rounded-[10px] bg-white text-slate-900 hover:bg-slate-100 text-[13px] font-semibold transition-all whitespace-nowrap">
            Sign In / Sign Up
          </Link>
        </div>
      </header>

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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button type="button" onClick={() => navigateWithSession("/dashboard")} className="why-btn-gradient px-6 py-3 text-[15px] font-semibold flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg shadow-purple-500/30">
              <Zap size={16} /><span>Launch AI Dashboard</span><ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => navigateWithSession("/practice")} className="px-6 py-3 rounded-[12px] bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/10 text-white text-[15px] font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all">
              <GraduationCap size={16} className="text-[#38BDF8]" /><span>Explore Practice</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-[12px] text-slate-400">
            <span>Create your own account to save your JEE/NEET progress securely.</span>
          </div>
        </div>

        <div className="mt-16">
          <div className="text-center mb-6">
            <span className="text-[12px] font-bold uppercase tracking-wider text-purple-400">The Cognitive Architecture</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">The Closed-Loop Mistake Diagnosis Engine</h2>
            <p className="text-[13px] text-slate-400 mt-1">Every completed attempt trains the platform on your reasoning patterns.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {loopSteps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div key={idx} onClick={() => setActiveStep(idx)} className={`why-glass-card p-4 cursor-pointer transition-all ${isSelected ? "border-purple-500/80 ring-2 ring-purple-500/40 bg-purple-900/20 shadow-lg shadow-purple-500/20" : "hover:border-white/20 bg-white/5"}`}>
                  <div className="flex items-center justify-between text-[11px] font-mono-numbers text-slate-500">
                    <span className="text-purple-400 font-bold">0{idx + 1}</span>
                    {idx < 5 && <ArrowRight size={12} className="text-slate-600" />}
                  </div>
                  <div className="text-[15px] font-bold text-white mt-2">{step.title}</div>
                  <div className="text-[11px] font-semibold text-purple-400 mt-0.5">{step.subtitle}</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 space-y-6">
          <div className="why-glass-card p-6 border border-purple-500/30 rounded-[18px] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
                <span className="text-[13px] font-semibold text-white">Product Preview</span>
                <span className="text-[11px] text-slate-400 font-mono-numbers px-2 py-0.5 rounded-md bg-white/5 border border-white/10">JEE Physics Mechanics • Sample PYQ</span>
              </div>
              <Link href="/practice" className="text-[12px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                <span>Try Practice Engine</span><ArrowRight size={13} />
              </Link>
            </div>

            <div className="py-4">
              <p className="text-[15px] font-medium text-slate-200 leading-relaxed">
                A solid uniform sphere and a thin hollow cylinder of the same mass M and radius R roll without slipping down an inclined plane of inclination θ from the same height. What is the ratio of their translational kinetic energies when they reach the bottom?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-[13px]">
                <div className="p-3.5 rounded-[10px] border border-rose-500/40 bg-rose-950/30 flex items-center justify-between text-rose-300 font-medium">
                  <span>A) 1 : 1 (Sample Attempt)</span><span className="text-[11px] uppercase tracking-wider font-bold text-rose-400 bg-rose-900/40 px-2 py-0.5 rounded">Incorrect</span>
                </div>
                <div className="p-3.5 rounded-[10px] border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between text-emerald-300 font-medium">
                  <span>D) 10 : 7 (Correct Answer)</span><CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="mt-2 p-5 rounded-[14px] bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-indigo-950/40 border border-purple-500/40 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                <span className="font-extrabold uppercase tracking-wider text-[#C084FC] flex items-center gap-1.5"><Sparkles size={16} className="text-[#38BDF8]" />WHY YOU GOT THIS WRONG</span>
                <span className="font-mono-numbers font-semibold text-purple-300 bg-purple-900/40 px-2.5 py-0.5 rounded-full border border-purple-500/30">Sample Diagnosis • Formula Recall</span>
              </div>
              <div className="mt-3.5 text-[13px] space-y-2.5">
                <p className="text-slate-200"><strong className="text-purple-300">Diagnosis:</strong> You identified the correct physical quantity, but selected the translational-motion formula for a rotational case.</p>
                <p className="text-slate-200"><strong className="text-amber-400">Concept Gap:</strong> Moment of inertia relationship in rolling constraints: <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono-numbers text-amber-200">K_trans / K_total = 1 / (1 + k²/R²)</code>.</p>
                <p className="text-slate-200"><strong className="text-emerald-400">Actionable Rule:</strong> Always separate translational and rotational energy budgets before writing final conservation equations.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] text-slate-400">Example diagnosis shown for demonstration.</span>
                <Link href="/weaknesses" className="why-btn-gradient px-4 py-1.5 text-[12px] flex items-center gap-1.5 self-start sm:self-auto">
                  <span>Explore Weakness Fix</span><ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30"><Calendar size={20} /></div>
            <h3 className="text-[16px] font-bold text-white">Practice Activity Grid</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">Track practice consistency and question attempts over time.</p>
          </div>
          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30"><Brain size={20} /></div>
            <h3 className="text-[16px] font-bold text-white">Mistake Archetypes</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">Identify patterns such as formula recall, calculation slips, strategy misalignment, and time pressure.</p>
          </div>
          <div className="why-glass-card p-6 border border-white/10 rounded-[16px]">
            <div className="w-10 h-10 rounded-[10px] bg-purple-500/20 text-[#C084FC] flex items-center justify-center mb-3.5 border border-purple-500/30"><ShieldAlert size={20} /></div>
            <h3 className="text-[16px] font-bold text-white">Focused Test Environment</h3>
            <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">Practice and tests designed around exam preparation and mistake analysis.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 px-6 lg:px-12 text-center text-[12px] text-slate-500 z-10 backdrop-blur-md bg-[#07050E]/80">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-2">
          <span>WHY — AI Mistake Coach • Built for JEE & NEET</span>
        </div>
      </footer>
    </div>
  );
}
