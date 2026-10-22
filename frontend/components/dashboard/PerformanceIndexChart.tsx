"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Maximize2, ArrowUpRight } from "lucide-react";

interface PerformanceIndexChartProps {
  growthPercent?: number;
}

export default function PerformanceIndexChart({ growthPercent = 14.3 }: PerformanceIndexChartProps) {
  const chartData = [
    { period: "Jan", score: 42, velocity: 120 },
    { period: "Mar", score: 42, velocity: 160 },
    { period: "Apr", score: 40, velocity: 220 },
    { period: "Jun", score: 32, velocity: 280 },
    { period: "July", score: 36, velocity: 340 },
    { period: "Aug", score: 52, velocity: 410 },
    { period: "Oct", score: 38, velocity: 470 },
    { period: "Dec", score: 68, velocity: 520 },
  ];

  return (
    <div className="why-glass-card p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-white tracking-tight">
            AI Performance Index
          </span>
          <button className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Big Metric Display */}
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-[32px] font-extrabold font-mono-numbers text-white tracking-tight">
            71.3%
          </span>
          <span className="inline-flex items-center gap-0.5 text-[12px] font-bold font-mono-numbers px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ArrowUpRight size={14} />
            <span>+{growthPercent}%</span>
          </span>
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Cognitive mastery velocity across Physics, Chemistry, and Mathematics
        </p>
      </div>

      {/* Recharts Area Curve matching the glowing purple line */}
      <div className="h-48 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="period"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[20, 80]}
              fontFamily="JetBrains Mono"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#120D24",
                borderRadius: "10px",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                color: "#fff",
                fontSize: "12px",
                fontFamily: "JetBrains Mono",
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#A855F7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleGradient)"
              dot={{ r: 4, fill: "#FFFFFF", stroke: "#7C3AED", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#38BDF8", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
