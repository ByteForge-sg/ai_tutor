"use client";

import React from "react";
import { Activity, Target, AlertTriangle, GraduationCap } from "lucide-react";

interface MetricCardsProps {
  questionsSolved: number;
  accuracy: number | null;
  currentStreak: number;
  testsCompleted: number;
  weaknessesCount: number;
}

export default function MetricCards({ questionsSolved, accuracy, currentStreak, testsCompleted, weaknessesCount }: MetricCardsProps) {
  const metrics = [
    { label: "Questions Solved", value: questionsSolved.toLocaleString(), detail: `${currentStreak} day current streak`, icon: Activity, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/15" },
    { label: "Tests Completed", value: testsCompleted.toLocaleString(), detail: "Submitted test attempts", icon: GraduationCap, color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/15" },
    { label: "Answered Accuracy", value: accuracy === null ? "—" : `${accuracy}%`, detail: "Correct / answered", icon: Target, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/15" },
    { label: "Tracked Weaknesses", value: weaknessesCount.toLocaleString(), detail: "Topics in your profile", icon: AlertTriangle, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/15" },
  ];

  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {metrics.map(({ label, value, detail, icon: Icon, color, border, bg }) => <div key={label} className="why-glass-card p-5 relative overflow-hidden">
      <div className={`w-8 h-8 rounded-[8px] ${bg} border ${border} ${color} flex items-center justify-center`}><Icon size={18} /></div>
      <div className="mt-4"><span className="text-[12px] font-medium text-slate-400 block">{label}</span><div className="text-[26px] font-extrabold font-mono-numbers text-white tracking-tight mt-0.5">{value}</div><div className="mt-1 text-[11px] text-slate-400">{detail}</div></div>
    </div>)}
  </div>;
}
