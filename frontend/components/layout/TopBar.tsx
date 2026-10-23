"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Check, Sparkles, User as UserIcon } from "lucide-react";
import { ExamType, User } from "@/types";
import { getCurrentUser } from "@/lib/auth";

interface TopBarProps {
  currentExam: ExamType;
  onExamChange: (exam: ExamType) => void;
  onOpenCoach?: () => void;
}

export default function TopBar({ currentExam, onExamChange, onOpenCoach }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/practice?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="h-[68px] bg-[#0A0716]/80 backdrop-blur-md border-b border-purple-500/15 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Search input matching the image */}
      <div className="flex-1 max-w-md mr-4">
        <form onSubmit={handleSearch} className="relative">
          <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, mistake patterns, or topics..."
            className="w-full pl-10 pr-12 py-2 rounded-[12px] bg-white/5 border border-white/10 text-[13px] text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
          />
          <span className="absolute right-3 top-2 px-1.5 py-0.5 rounded-[4px] bg-white/10 text-[10px] text-slate-400 font-mono-numbers">
            ⌘K
          </span>
        </form>
      </div>

      {/* Right: Controls & User Profile Pill */}
      <div className="flex items-center gap-3">
        {/* Exam Toggle Pill */}
        <div className="relative">
          <button
            onClick={() => setShowExamDropdown(!showExamDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-purple-900/30 border border-purple-500/30 text-white text-[13px] font-semibold hover:border-purple-500/60 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse"></span>
            <span>Target: {currentExam}</span>
            <ChevronDown size={14} className="text-purple-300" />
          </button>

          {showExamDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#120D24] border border-purple-500/30 rounded-[12px] shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Exam Track
              </div>
              <button
                onClick={() => {
                  onExamChange("JEE");
                  setShowExamDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left hover:bg-white/5 transition-colors ${
                  currentExam === "JEE" ? "text-purple-400 font-semibold bg-purple-500/10" : "text-slate-300"
                }`}
              >
                <div>
                  <div className="font-medium text-white">JEE Main & Adv</div>
                  <div className="text-[11px] text-slate-400">Physics, Chem, Maths</div>
                </div>
                {currentExam === "JEE" && <Check size={16} className="text-purple-400" />}
              </button>

              <button
                onClick={() => {
                  onExamChange("NEET");
                  setShowExamDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-left hover:bg-white/5 transition-colors ${
                  currentExam === "NEET" ? "text-cyan-400 font-semibold bg-cyan-500/10" : "text-slate-300"
                }`}
              >
                <div>
                  <div className="font-medium text-white">NEET (UG Medical)</div>
                  <div className="text-[11px] text-slate-400">Physics, Chem, Biology</div>
                </div>
                {currentExam === "NEET" && <Check size={16} className="text-cyan-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon Pill (with red dot like the image) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-[12px] bg-white/5 border border-white/10 hover:border-purple-500/30 text-slate-300 hover:text-white flex items-center justify-center transition-all relative"
          >
            <Bell size={18} />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#120D24] border border-purple-500/30 rounded-[14px] shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[13px] font-semibold text-white">Integrity & Mistake Alerts</span>
                <span className="text-[11px] text-purple-400 cursor-pointer">Clear</span>
              </div>
              <p className="py-4 text-[12px] text-slate-400">No new alerts.</p>
            </div>
          )}
        </div>

        {/* User Profile Pill matching the image (Avatar + Name + Gold Premium Badge) */}
        <div
          onClick={() => router.push("/login")}
          className="flex items-center gap-3 p-1.5 pl-2 pr-3.5 rounded-[12px] bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-600/30 border border-purple-500/40 shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-white">
                AS
              </div>
            )}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[13px] font-bold text-white leading-tight group-hover:text-purple-300 transition-colors">
              {user?.name || "Student"}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono-numbers">
              {currentExam} Track
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
