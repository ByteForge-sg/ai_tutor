"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signup, signin } from "@/lib/api";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, UserRound } from "lucide-react";
import Link from "next/link";

type Exam = "JEE" | "NEET";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam>("JEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "signup" && !name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signup({
          name: name.trim(),
          email: email.trim(),
          password,
          target_exam: selectedExam,
        });
      } else {
        await signin({ email: email.trim(), password });
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07050E] text-white flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[140px] pointer-events-none" />

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
        <Link href="/" className="text-[13px] text-slate-400 hover:text-white transition-colors">
          ← Return to Home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="why-glass-card max-w-md w-full p-8 border border-purple-500/20 rounded-[20px] shadow-2xl relative">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#C084FC] text-[12px] font-semibold">
              <Sparkles size={14} />
              <span>Targeted AI Cognitive Prep</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {mode === "signin" ? "Welcome back to " : "Create your "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#38BDF8]">WHY</span>
            </h2>
            <p className="text-[13px] text-slate-400">
              {mode === "signin"
                ? "Sign in to continue your personalised JEE/NEET preparation."
                : "Create an account to save your progress and mistake profile."}
            </p>
          </div>

          <div className="mb-6 p-1 rounded-full bg-white/5 border border-white/10 flex items-center">
            <button
              type="button"
              onClick={() => { setSelectedExam("JEE"); setError(""); }}
              className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                selectedExam === "JEE"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-purple-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              JEE (Main &amp; Adv)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedExam("NEET"); setError(""); }}
              className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                selectedExam === "NEET"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-purple-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              NEET (UG Medical)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                autoComplete="email"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : 1}
                maxLength={128}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {mode === "signup" && (
              <p className="text-[11px] text-slate-500">Use at least 8 characters for your password.</p>
            )}

            {error && (
              <div role="alert" className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="why-btn-gradient w-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </span>
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-5 text-center text-[12px] text-slate-400">
            {mode === "signin" ? "New to WHY? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              className="font-semibold text-[#C084FC] hover:text-white transition-colors"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Secure email and password authentication</span>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-[12px] text-slate-500 z-10">
        WHY — AI Mistake Coach • Competitive Exam Intelligence
      </footer>
    </div>
  );
}
