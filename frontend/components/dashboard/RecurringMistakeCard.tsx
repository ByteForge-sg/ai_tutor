"use client";

import React from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { RecurringMistake } from "@/types";

interface RecurringMistakeCardProps {
  recurringMistake?: RecurringMistake;
  onUnderstandWhy?: () => void;
}

export default function RecurringMistakeCard({
  recurringMistake,
  onUnderstandWhy,
}: RecurringMistakeCardProps) {
  if (!recurringMistake) {
    return (
      <div className="why-glass-card p-6 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recurring Mistake
          </span>
          <h3 className="text-[18px] font-bold text-white mt-1">No Systemic Pattern</h3>
          <p className="text-[13px] text-slate-400 mt-1">
            Mistakes are non-repeating across sessions. Continue maintaining diverse practice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="why-glass-card p-6 flex flex-col justify-between border-l-4 border-l-[#A855F7] relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <RefreshCw size={14} className="animate-spin-slow" />
            Recurring Mistake Pattern
          </span>
          <span className="text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
            Detected {recurringMistake.occurrences} times
          </span>
        </div>

        <h3 className="text-[20px] font-bold text-white mt-2 tracking-tight group-hover:text-purple-300 transition-colors">
          {recurringMistake.display_title}
        </h3>

        <div className="text-[13px] text-slate-400 mt-0.5">
          {recurringMistake.subject} → {recurringMistake.chapter}
        </div>

        <div className="mt-4 p-3.5 rounded-[12px] bg-white/5 border border-white/10 space-y-1.5 text-[13px]">
          <div className="flex justify-between text-slate-400">
            <span>Primary Focus:</span>
            <span className="font-semibold text-white">{recurringMistake.topic}</span>
          </div>
          <p className="text-[12px] text-slate-300 mt-1 pt-1.5 border-t border-white/10 leading-relaxed">
            Pattern persists across test sessions. Conflating translational and rotational equations under time pressure.
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono-numbers">
          Deep diagnostic breakdown
        </span>
        <button
          onClick={onUnderstandWhy}
          className="why-btn-dark px-4 py-2 text-[13px] flex items-center gap-1.5 hover:border-purple-500/60 hover:text-purple-300"
        >
          <Sparkles size={14} className="text-purple-400" />
          <span>Understand WHY</span>
        </button>
      </div>
    </div>
  );
}
