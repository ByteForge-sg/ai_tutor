"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle } from "@/lib/auth";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [selectedExam, setSelectedExam] = useState<"JEE" | "NEET">("JEE");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = (email = "aditya.sharma@jee2026.in", name = "Aditya Sharma") => {
    setIsSigningIn(true);
    loginWithGoogle(email, name, selectedExam);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  const handleCustomEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSigningIn(true);
    loginWithGoogle(emailInput, undefined, selectedExam);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#07050E] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="p-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">WHY</span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
            AI Mistake Coach
          </span>
        </Link>

        <Link
          href="/"
          className="text-[13px] text-slate-400 hover:text-white transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="why-glass-card max-w-md w-full p-8 border border-purple-500/20 rounded-[20px] shadow-2xl relative">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#C084FC] text-[12px] font-semibold">
              <Sparkles size={14} />
              <span>Targeted AI Cognitive Prep</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#38BDF8]">WHY</span>
            </h2>
            <p className="text-[13px] text-slate-400">
              Sign in with your Google account to sync your cognitive mistake profile.
            </p>
          </div>

          {/* Exam Selector Pill */}
          <div className="mb-6 p-1 rounded-full bg-white/5 border border-white/10 flex items-center">
            <button
              type="button"
              onClick={() => setSelectedExam("JEE")}
              className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                selectedExam === "JEE"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-purple-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              JEE (Main & Adv)
            </button>
            <button
              type="button"
              onClick={() => setSelectedExam("NEET")}
              className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                selectedExam === "NEET"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-purple-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              NEET (UG Medical)
            </button>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={() => handleGoogleSignIn()}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-[12px] bg-white text-slate-900 font-semibold text-[14px] hover:bg-slate-100 transition-all shadow-md active:scale-[0.99] disabled:opacity-70"
          >
            {/* Multi-color Google G Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 text-[12px] text-slate-500">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span>or instant demo profile</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          {/* Instant 1-Click Demo Profiles */}
          <div className="space-y-2">
            <button
              onClick={() => handleGoogleSignIn("aditya.sharma@jee2026.in", "Aditya Sharma")}
              className="w-full p-2.5 rounded-[10px] bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-600/40 text-purple-300 flex items-center justify-center font-bold text-[12px]">
                  AS
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">Aditya Sharma</div>
                  <div className="text-[11px] text-slate-400">JEE 2026 • 2,831 Solved • 9-day Streak</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleGoogleSignIn("ananya.patel@neet2026.in", "Ananya Patel")}
              className="w-full p-2.5 rounded-[10px] bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-600/40 text-cyan-300 flex items-center justify-center font-bold text-[12px]">
                  AP
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">Ananya Patel</div>
                  <div className="text-[11px] text-slate-400">NEET 2026 • Biology & Physics Track</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Custom Gmail Form */}
          <form onSubmit={handleCustomEmailSignIn} className="mt-5 space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your Gmail address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={!emailInput.trim() || isSigningIn}
              className="why-btn-gradient w-full py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Sign In with Gmail</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Privacy footer */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Secure authentication with persistent session storage</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[12px] text-slate-500 z-10">
        WHY — AI Mistake Coach • Competitive Exam Intelligence
      </footer>
    </div>
  );
}
