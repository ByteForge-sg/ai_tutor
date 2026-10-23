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
  growthPercent?: number | null;
  score: number | null;
  monthlyTrends: { month: string; questions: number; accuracy: number | null }[];
}

export default function PerformanceIndexChart({ growthPercent, score, monthlyTrends }: PerformanceIndexChartProps) {

  return (
    <div className="why-glass-card p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-white tracking-tight">
            Accuracy Trend
          </span>
          <button className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Big Metric Display */}
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-[32px] font-extrabold font-mono-numbers text-white tracking-tight">
            {score === null ? "—" : `${score}%`}
          </span>
          {growthPercent == null ? <span className="text-[11px] text-slate-400">No prior month comparison</span> : <span className="inline-flex items-center gap-0.5 text-[12px] font-bold font-mono-numbers px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><ArrowUpRight size={14} /><span>{growthPercent > 0 ? "+" : ""}{growthPercent}% this month</span></span>}
        </div>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Accuracy calculated from your answered question attempts
        </p>
      </div>

      {/* Recharts Area Curve matching the glowing purple line */}
      <div className="h-48 mt-4 w-full">
        {monthlyTrends.length ? <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyTrends.map((item) => ({ period: item.month, score: item.accuracy }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              domain={[0, 100]}
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
        </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-500">No recent question history</div>}
      </div>
    </div>
  );
}
