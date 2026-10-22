"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import { fetchQuestions, switchUserExam } from "@/lib/api";
import { Question, ExamType } from "@/types";
import { FileCheck2, Filter, ChevronDown, CheckCircle2, BookOpen, Clock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PYQPage() {
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [pyqs, setPyqs] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const loadPYQs = async (exam: ExamType, subj?: string) => {
    try {
      setLoading(true);
      const params: any = { exam, source_type: "PYQ" };
      if (subj && subj !== "All") params.subject = subj;
      const res = await fetchQuestions(params);
      setPyqs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPYQs(currentExam, selectedSubject);
  }, [currentExam, selectedSubject]);

  const filteredPYQs = pyqs.filter((q) => {
    if (selectedYear !== "All" && q.year.toString() !== selectedYear) return false;
    return true;
  });

  const subjects =
    currentExam === "JEE"
      ? ["All", "Physics", "Chemistry", "Mathematics"]
      : ["All", "Physics", "Chemistry", "Biology"];

  return (
    <div className="flex min-h-screen bg-[#07050E] text-white">
      <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentExam={currentExam}
          onExamChange={(newExam) => {
            setCurrentExam(newExam);
            setSelectedSubject("All");
            switchUserExam("user_demo", newExam);
          }}
          onOpenCoach={() => setIsCoachOpen(true)}
        />

        <main className="p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 size={24} className="text-[#A855F7]" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Official Previous Year Questions (PYQs)
                </h1>
              </div>
              <p className="text-[13px] text-slate-400 mt-1">
                Authentic {currentExam} test items with structured difficulty and cognitive mistake categories.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[10px] px-3.5 py-2 text-[13px] font-medium text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s} className="bg-[#120B24] text-white">
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[10px] px-3.5 py-2 text-[13px] font-medium text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="All" className="bg-[#120B24] text-white">All Years</option>
                <option value="2024" className="bg-[#120B24] text-white">2024</option>
                <option value="2023" className="bg-[#120B24] text-white">2023</option>
                <option value="2022" className="bg-[#120B24] text-white">2022</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
              <p className="text-[13px] text-slate-400">Loading authentic PYQs from database...</p>
            </div>
          ) : filteredPYQs.length === 0 ? (
            <div className="why-glass-card p-12 text-center rounded-[16px] border border-white/10">
              <BookOpen size={40} className="text-slate-500 mx-auto mb-3" />
              <h3 className="text-[17px] font-bold text-white">No PYQs found</h3>
              <p className="text-[13px] text-slate-400 mt-1">
                Try selecting &apos;All Years&apos; or changing subjects.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPYQs.map((q) => (
                <div
                  key={q.id}
                  className="why-glass-card p-6 rounded-[16px] border border-white/10 hover:border-purple-500/40 transition-all shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 text-[12px] gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-numbers px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[#C084FC] font-bold border border-purple-500/30">
                        {q.exam} {q.year}
                      </span>
                      <span className="font-semibold text-white">{q.subject}</span>
                      <span className="text-slate-500">›</span>
                      <span className="text-slate-400">{q.chapter}</span>
                      <span className="text-slate-500">›</span>
                      <span className="text-purple-300 font-medium">{q.topic}</span>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                        q.difficulty === "Easy"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : q.difficulty === "Medium"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="text-[15px] font-medium text-slate-200 mt-4 leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-[13px]">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-3 rounded-[10px] border border-white/5 bg-white/5 text-slate-300"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[12px] text-slate-500">
                      Source: Official Examination Paper • Complete Solution with WHY Diagnosis available
                    </span>

                    <Link
                      href={`/practice?topic=${encodeURIComponent(q.topic)}`}
                      className="why-btn-gradient px-4 py-2 text-[12px] flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>Practice in Exam Mode</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </div>
  );
}
