"use client";

import React from "react";
import { Sparkles, AlertCircle, ArrowRight, Brain, Lightbulb, Compass } from "lucide-react";
import { AIDiagnosis } from "@/types";

interface MistakeDiagnosisCardProps {
  diagnosis: AIDiagnosis;
  topic?: string;
  onFixWeakness?: (topic: string) => void;
  onAskCoach?: () => void;
}

export default function MistakeDiagnosisCard({
  diagnosis,
  topic,
  onFixWeakness,
  onAskCoach,
}: MistakeDiagnosisCardProps) {
  const formatMistakeType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const confidencePercent = Math.round(diagnosis.confidence * 100);

  return (
    <div className="why-glass-card border-2 border-purple-500/40 bg-gradient-to-b from-purple-950/40 via-[#0F0A21] to-[#0A0716] p-6 my-4 shadow-xl shadow-purple-950/40 animate-in fade-in-50 duration-200 rounded-[16px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-md shadow-purple-500/40">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-400 block font-mono-numbers">
              AI Mistake Diagnosis
            </span>
            <h4 className="text-[17px] font-extrabold text-white tracking-tight">
              WHY YOU GOT THIS WRONG
            </h4>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-white/10 border border-purple-500/30 text-white shadow-xs">
            {formatMistakeType(diagnosis.mistakeType)}
          </span>
          <span className="text-[12px] font-mono-numbers font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
            {confidencePercent}% Confidence
          </span>
        </div>
      </div>

      {/* Structured Diagnosis Details */}
      <div className="py-4 space-y-4 text-[13px]">
        {/* 1. Diagnosis */}
        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-white/5 border border-white/10">
          <div className="p-1.5 rounded-[6px] bg-purple-500/20 text-purple-300 mt-0.5 shrink-0">
            <Brain size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block font-mono-numbers">
              Reasoning Error
            </span>
            <p className="text-white font-medium leading-relaxed mt-0.5">
              {diagnosis.diagnosis}
            </p>
          </div>
        </div>

        {/* 2. Concept Gap */}
        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/20">
          <div className="p-1.5 rounded-[6px] bg-amber-500/20 text-amber-300 mt-0.5 shrink-0">
            <AlertCircle size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block font-mono-numbers">
              Concept Gap
            </span>
            <p className="text-white font-medium leading-relaxed mt-0.5">
              {diagnosis.conceptGap}
            </p>
          </div>
        </div>

        {/* 3. Recommendation */}
        <div className="flex items-start gap-3 p-3 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20">
          <div className="p-1.5 rounded-[6px] bg-emerald-500/20 text-emerald-300 mt-0.5 shrink-0">
            <Lightbulb size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block font-mono-numbers">
              Coach Recommendation
            </span>
            <p className="text-white font-medium leading-relaxed mt-0.5">
              {diagnosis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onAskCoach}
          className="text-[12px] font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5"
        >
          <Compass size={14} />
          <span>Discuss with WHY AI Coach</span>
        </button>

        {topic && onFixWeakness && (
          <button
            onClick={() => onFixWeakness(topic)}
            className="why-btn-gradient px-4 py-2 text-[13px] flex items-center gap-2 shadow-lg shadow-purple-500/30 w-full sm:w-auto justify-center"
          >
            <Sparkles size={14} />
            <span>Fix This Weakness</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
