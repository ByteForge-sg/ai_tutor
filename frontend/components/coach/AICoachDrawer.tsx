"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  BotMessageSquare,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { sendAIChatMessage } from "@/lib/api";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  isExamBlocked?: boolean;
  isError?: boolean;
}

interface AICoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeExamId?: string | null;
  onNavigateToWeakness?: (topic: string) => void;
}

export default function AICoachDrawer({
  isOpen,
  onClose,
  activeExamId = null,
  onNavigateToWeakness,
}: AICoachDrawerProps) {
  const pathname = usePathname();
  const routeAttemptId = pathname.match(/^\/exam\/([^/]+)\/?$/)?.[1];
  const currentExamId = routeAttemptId === activeExamId ? activeExamId : null;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your WHY AI Mistake Coach.\n\nI monitor your attempts across tests and practice to find the underlying reasons behind errors. How can I guide your preparation today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading || currentExamId) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sendAIChatMessage({
        message: text,
        current_attempt_id: currentExamId || undefined,
        context: { page: pathname.split("/")[1] || "dashboard", pathname },
      });

      if (response.mode === "EXAM_BLOCKED") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
            isExamBlocked: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
          },
        ]);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message.trim() : "";
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: detail
            ? `AI Coach error: ${detail}`
            : "AI Coach could not reach the server. Check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Why do I keep missing Rotational Motion questions?",
    "What is my weakest topic right now?",
    "Explain King's Property in Definite Integrals",
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0E0A1C]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BotMessageSquare size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-[14px]">WHY AI Coach</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-[#C084FC] border border-purple-500/30">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Contextual mistake analysis & concept guidance</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-[8px] hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Live Exam Mode Alert Banner (if exam is running) */}
      {currentExamId && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-500/30 flex items-start gap-2.5 text-[12px] text-rose-300">
          <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Exam Mode Enforced</span>
            <span>AI assistance is strictly locked during active tests. Submit the exam to view mistake diagnoses.</span>
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-[12px] p-3.5 text-[13px] leading-relaxed whitespace-pre-line shadow-md ${
                  isUser
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-purple-500/20"
                    : m.isError
                    ? "bg-amber-950/40 border border-amber-500/30 text-amber-200"
                    : m.isExamBlocked
                    ? "bg-rose-950/40 border border-rose-500/30 text-rose-300"
                    : "bg-white/5 border border-white/10 text-slate-200"
                }`}
              >
                {m.content}
              </div>

              {/* Action shortcuts inside coach */}
              {!isUser && m.content.includes("Rotational Motion") && onNavigateToWeakness && (
                <button
                  onClick={() => {
                    onNavigateToWeakness("Rotational Motion");
                    onClose();
                  }}
                  className="mt-2 text-[12px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-[8px] hover:bg-purple-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles size={13} className="text-cyan-400" />
                  <span>Launch 5-Step Intervention</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-purple-300 italic p-2.5 bg-white/5 rounded-[10px] border border-white/10 w-fit">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            <span>WHY AI Coach is analyzing your reasoning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      {messages.length <= 2 && (
        <div className="p-3 border-t border-white/10 bg-white/5">
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
            Quick Inquiries
          </span>
          <div className="space-y-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isLoading || Boolean(currentExamId)}
                className="w-full text-left text-[12px] text-slate-300 hover:text-white p-2 rounded-[8px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all truncate block"
              >
                • {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 border-t border-white/10 bg-[#0E0A1C]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentExamId
                ? "Locked during active exam..."
                : "Ask WHY you missed a question..."
            }
            disabled={isLoading || Boolean(currentExamId)}
            className="flex-1 text-[13px] px-3.5 py-2.5 rounded-[10px] bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || Boolean(currentExamId)}
            className="why-btn-gradient p-2.5 rounded-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
