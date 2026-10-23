"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { changePassword, fetchCurrentUser } from "@/lib/api";
import { logout } from "@/lib/auth";
import { User } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your profile.");
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Complete all password fields.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setError("Your new password must be between 8 and 128 characters.");
      return;
    }
    if (confirmPassword !== newPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#07050E] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[140px] pointer-events-none" />

      <header className="relative z-10 h-[70px] border-b border-white/10 px-6 lg:px-12 flex items-center justify-between backdrop-blur-xl bg-[#07050E]/80">
        <Link href="/dashboard" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[13px] font-semibold">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 text-white font-extrabold">
          <Sparkles size={17} className="text-purple-400" /> WHY Profile
        </div>
        <button type="button" onClick={handleSignOut} className="flex items-center gap-2 text-[13px] font-semibold text-slate-300 hover:text-white transition-colors">
          <LogOut size={15} /> Sign Out
        </button>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-5 py-10 sm:py-14 space-y-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-purple-400">Account</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Profile &amp; Settings</h1>
          <p className="text-[14px] text-slate-400 mt-2">Manage your account details and password.</p>
        </div>

        <section className="why-glass-card p-6 sm:p-7 border border-purple-500/25 rounded-[18px]">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <ShieldCheck size={18} className="text-cyan-400" />
            <h2 className="text-[16px] font-bold">Profile Information</h2>
          </div>
          {loadingProfile ? (
            <p role="status" className="text-[13px] text-slate-400 py-5">Loading profile…</p>
          ) : user ? (
            <dl className="grid sm:grid-cols-3 gap-4 pt-5">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Name</dt>
                <dd className="mt-1 text-[14px] font-semibold text-white">{user.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Email</dt>
                <dd className="mt-1 text-[14px] font-semibold text-white break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Target Exam</dt>
                <dd className="mt-1 text-[14px] font-semibold text-white">{user.target_exam}</dd>
              </div>
            </dl>
          ) : (
            <p role="alert" className="text-[13px] text-rose-300 py-5">{error || "Could not load your profile."}</p>
          )}
        </section>

        <section className="why-glass-card p-6 sm:p-7 border border-purple-500/25 rounded-[18px]">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <LockKeyhole size={18} className="text-purple-400" />
            <div>
              <h2 className="text-[16px] font-bold">Change Password</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Use 8 to 128 characters for your new password.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 pt-5" noValidate>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-semibold text-slate-300">Current password</span>
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={128} className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-semibold text-slate-300">New password</span>
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} maxLength={128} className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12px] font-semibold text-slate-300">Confirm new password</span>
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required maxLength={128} className="w-full px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
            </label>

            {message && <p role="status" className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-300">{message}</p>}
            {error && user && <p role="alert" className="rounded-[10px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">{error}</p>}

            <button type="submit" disabled={isSubmitting || loadingProfile || !user} className="why-btn-gradient px-5 py-2.5 rounded-[10px] text-[13px] font-semibold disabled:opacity-50">
              {isSubmitting ? "Updating password…" : "Update Password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
