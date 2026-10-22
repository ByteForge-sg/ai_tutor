"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { WeaknessItem } from "@/types";

interface WeakestAreaCardProps {
  weakness?: WeaknessItem;
  onFixWeakness?: (topic: string) => void;
}

export default function WeakestAreaCard({ weakness, onFixWeakness }: WeakestAreaCardProps) {
  if (!weakness) {
    return (
      <div className="why-glass-card p-6 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Weakness
          </span>
          <h3 className="text-[18px] font-bold text-white mt-1">Balanced Performance</h3>
          <p className="text-[13px] text-slate-400 mt-1">
            No critical weakness detected above the error threshold. Continue regular practice.
          </p>
        </div>
        <Link href="/practice" className="why-btn-dark px-4 py-2 text-[13px] inline-flex items-center gap-2 mt-4 self-start">
          <span>Start Practice</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const formatMistakeName = (m: string) => {
    return m.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="why-glass-card p-6 flex flex-col justify-between border-l-4 border-l-amber-500 relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Targeted Weakness
          </span>
          <span className="text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
            {weakness.occurrences} detections
          </span>
        </div>

        <h3 className="text-[20px] font-bold text-white mt-2 tracking-tight group-hover:text-purple-300 transition-colors">
          {weakness.topic}
        </h3>
        
        <div className="text-[13px] text-slate-400 mt-0.5">
          {weakness.subject} → {weakness.chapter}
        </div>

        <div className="mt-4 p-3.5 rounded-[12px] bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-400">Current Topic Accuracy:</span>
            <span className="font-mono-numbers font-extrabold text-rose-400">
              {weakness.accuracy_percent}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-400">Recurring reasoning error:</span>
            <span className="font-semibold text-white">
              {formatMistakeName(weakness.mistake_type)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono-numbers">
          5-Step adaptive fix ready
        </span>
        <button
          onClick={() => onFixWeakness ? onFixWeakness(weakness.topic) : null}
          className="why-btn-gradient px-4 py-2 text-[13px] flex items-center gap-1.5 shadow-md shadow-purple-500/30"
        >
          <Sparkles size={14} />
          <span>Fix This Weakness</span>
        </button>
      </div>
    </div>
  );
}
