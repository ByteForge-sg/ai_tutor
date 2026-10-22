"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Brain, GraduationCap, Flame, ArrowRight } from "lucide-react";

export default function AISuiteCards() {
  const tools = [
    {
      title: "AI Mistake Diagnoser",
      desc: "Instant breakdown of reasoning traps across 9 cognitive archetypes.",
      icon: Sparkles,
      href: "/practice",
      badge: "Signature",
      color: "from-purple-500/20 to-purple-900/10",
      borderColor: "hover:border-purple-500/60",
      iconColor: "text-purple-400",
    },
    {
      title: "Adaptive Practice Engine",
      desc: "Prioritizes questions targeting your exact recurring error patterns.",
      icon: Brain,
      href: "/practice",
      badge: "Targeted",
      color: "from-cyan-500/20 to-cyan-900/10",
      borderColor: "hover:border-cyan-500/60",
      iconColor: "text-cyan-400",
    },
    {
      title: "Fullscreen Exam Simulator",
      desc: "Server-controlled countdown with browser integrity monitoring.",
      icon: GraduationCap,
      href: "/tests",
      badge: "Simulation",
      color: "from-blue-500/20 to-blue-900/10",
      borderColor: "hover:border-blue-500/60",
      iconColor: "text-blue-400",
    },
    {
      title: "5-Step Weakness Fix",
      desc: "Concept refresher, worked example, and measured accuracy gain.",
      icon: Flame,
      href: "/weaknesses",
      badge: "Remediation",
      color: "from-amber-500/20 to-amber-900/10",
      borderColor: "hover:border-amber-500/60",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-white tracking-tight">
            AI Exam Intelligence Suite
          </h3>
          <p className="text-[12px] text-slate-400">
            Choose from your personalized AI remediation and simulation tools
          </p>
        </div>
        <Link
          href="/practice"
          className="text-[12px] font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          <span>See All</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Link
              key={idx}
              href={tool.href}
              className={`why-glass-card p-4 rounded-[14px] flex flex-col justify-between transition-all bg-gradient-to-b ${tool.color} border border-white/10 ${tool.borderColor} group`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={16} className={tool.iconColor} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-mono-numbers">
                    {tool.badge}
                  </span>
                </div>

                <h4 className="text-[14px] font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                  {tool.title}
                </h4>
                <p className="text-[12px] text-slate-400 mt-1 leading-snug">
                  {tool.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-purple-400">
                <span>Launch Tool</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
