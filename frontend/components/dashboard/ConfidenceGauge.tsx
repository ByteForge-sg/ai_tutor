"use client";

import React from "react";
import { Maximize2 } from "lucide-react";

interface ConfidenceGaugeProps {
  score: number | null;
}

export default function ConfidenceGauge({ score }: ConfidenceGaugeProps) {
  // 36 tick segments across a 180-degree semi-circular arc matching the reference image!
  const totalTicks = 38;
  const activeTicksCount = score === null ? 0 : Math.round((score / 100) * totalTicks);

  const getTickColor = (index: number) => {
    const ratio = index / totalTicks;
    if (ratio < 0.25) return "#FACC15"; // Yellow
    if (ratio < 0.5) return "#06B6D4"; // Cyan
    if (ratio < 0.75) return "#3B82F6"; // Blue
    return "#EC4899"; // Pink / Magenta
  };

  return (
    <div className="why-glass-card p-6 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-white tracking-tight">
          AI Confidence Index
        </h3>
        <button className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Speedometer Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center my-4">
        {/* SVG Semi-Circle Ticks */}
        <div className="relative w-[240px] h-[130px] flex items-end justify-center overflow-hidden">
          <svg viewBox="0 0 240 130" className="w-full h-full">
            {/* Outer calibration marks */}
            <text x="30" y="115" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">0</text>
            <text x="55" y="55" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">25</text>
            <text x="115" y="20" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">50</text>
            <text x="175" y="55" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">75</text>
            <text x="195" y="115" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">100</text>

            {/* Generated Radial Tick Bars */}
            {Array.from({ length: totalTicks }).map((_, i) => {
              // Angle from 180 to 360 (or -180 to 0)
              const angleDeg = 180 + (i / (totalTicks - 1)) * 180;
              const angleRad = (angleDeg * Math.PI) / 180;

              const rInner = 82;
              const rOuter = 100;
              const cx = 120;
              const cy = 120;

              const x1 = cx + rInner * Math.cos(angleRad);
              const y1 = cy + rInner * Math.sin(angleRad);
              const x2 = cx + rOuter * Math.cos(angleRad);
              const y2 = cy + rOuter * Math.sin(angleRad);

              const isActive = i <= activeTicksCount;
              const strokeColor = isActive ? getTickColor(i) : "rgba(255, 255, 255, 0.1)";

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Large Center Score */}
          <div className="absolute bottom-1 text-center">
            <span className="text-[34px] font-extrabold font-mono-numbers text-white tracking-tight drop-shadow-md">
              {score === null ? "—" : `${score}%`}
            </span>
            <span className="block text-[11px] font-medium text-slate-400 mt-[-4px]">
              Accuracy
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/10 text-center text-[12px] text-slate-400">Based on your answered question attempts</div>
    </div>
  );
}
