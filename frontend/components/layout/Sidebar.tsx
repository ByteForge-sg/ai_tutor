"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  GraduationCap,
  Target,
  LineChart,
  AlertTriangle,
  BotMessageSquare,
  Sparkles,
  LogOut,
  SlidersHorizontal,
  Flame
} from "lucide-react";
import { logout } from "@/lib/auth";

interface SidebarProps {
  onOpenCoach?: () => void;
}

export default function Sidebar({ onOpenCoach }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Practice", href: "/practice", icon: BookOpen },
    { label: "PYPs", href: "/pyqs", icon: FileCheck2 },
    { label: "Test Series", href: "/tests", icon: GraduationCap },
    { label: "Daily Goals", href: "/goals", icon: Target },
    { label: "My Progress", href: "/progress", icon: LineChart },
    { label: "My Weaknesses", href: "/weaknesses", icon: AlertTriangle },
  ];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="w-[240px] bg-[#0A0716] border-r border-purple-500/15 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* Iridescent Prism Icon like Synaptix */}
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#38BDF8] p-[1.5px] shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
              <div className="w-full h-full bg-[#0A0716] rounded-[7px] flex items-center justify-center">
                <Sparkles size={16} className="text-[#C084FC]" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                WHY
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg shadow-purple-600/30 border border-purple-400/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Glowing Orb Widget ("Go Pro" / "AI Coach" matching the reference image) */}
      <div className="p-4 space-y-3">
        <div
          onClick={onOpenCoach}
          className="relative overflow-hidden rounded-[16px] p-4 bg-gradient-to-b from-purple-900/30 to-[#0F0A21] border border-purple-500/30 cursor-pointer group hover:border-purple-500/60 transition-all"
        >
          {/* Glowing Orb Background */}
          <div className="absolute top-[-20%] left-[-20%] w-[120px] h-[120px] rounded-full bg-gradient-to-tr from-purple-600/40 via-fuchsia-500/30 to-transparent blur-[20px] group-hover:scale-125 transition-transform duration-500"></div>

          <div className="relative z-10 text-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-purple-500/40">
              <BotMessageSquare size={18} />
            </div>
            <h4 className="text-[14px] font-bold text-white tracking-tight">WHY Coach</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Instant AI Mistake Breakdown & Reasoning Fix
            </p>
            <button className="mt-2.5 w-full py-1.5 rounded-[8px] bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-[12px] font-semibold shadow-xs hover:brightness-110 transition-all">
              Launch Assistant
            </button>
          </div>
        </div>

        {/* Logout / Switch profile */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign Out / Switch Profile</span>
        </button>
      </div>
    </aside>
  );
}
