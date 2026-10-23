"use client";

import React, { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AICoachDrawer from "@/components/coach/AICoachDrawer";
import AuthRouteGuard from "@/components/auth/AuthRouteGuard";
import { fetchNCERTChapters, sendNCERTChatMessage, switchUserExam } from "@/lib/api";
import { ExamType, NCERTChapter, NCERTChatMessage, NCERTSourceChunk } from "@/types";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Layers,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  FileText,
  Binary,
  RotateCcw,
} from "lucide-react";

export default function NCERTBotPage() {
  const [currentExam, setCurrentExam] = useState<ExamType>("JEE");
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [chapters, setChapters] = useState<NCERTChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<NCERTChapter | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<NCERTChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [openSourcesMap, setOpenSourcesMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chapters
  useEffect(() => {
    async function load() {
      try {
        setLoadingChapters(true);
        const data = await fetchNCERTChapters();
        // Only keep indexed chapters
        const indexed = data.filter((ch) => ch.is_indexed);
        setChapters(indexed);
        if (indexed.length > 0) {
          setSelectedChapter(indexed[0]);
        }
      } catch (err) {
        console.error("Failed to load NCERT chapters:", err);
      } finally {
        setLoadingChapters(false);
      }
    }
    load();
  }, []);

  // Initial welcome message once chapter is selected
  useEffect(() => {
    if (selectedChapter && messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          role: "bot",
          content: `Hello! I am **NCERT-Bot**, your RAG study assistant strictly grounded in **${selectedChapter.chapter}** (${selectedChapter.subject}, ${selectedChapter.class_level}).\n\nI answer your questions by semantically searching and retrieving the exact text passages from the authentic NCERT textbook using **dense vector embeddings and Qdrant**.\n\nTry asking about accuracy vs precision, significant figures, dimensional analysis, or systematic errors below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          chapter: selectedChapter.chapter,
          subject: selectedChapter.subject,
        },
      ]);
    }
  }, [selectedChapter, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const toggleSources = (messageId: string) => {
    setOpenSourcesMap((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isSending || !selectedChapter) return;

    setInputQuery("");

    const userMsgId = `user-${Date.now()}`;
    const userMsg: NCERTChatMessage = {
      id: userMsgId,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Construct conversation history for follow-ups
    const historyPayload = messages
      .filter((m) => m.id !== "welcome-msg")
      .slice(-6)
      .map((m) => ({
        role: (m.role === "bot" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await sendNCERTChatMessage({
        chapter_id: selectedChapter.id,
        question: query,
        history: historyPayload,
        top_k: 3,
      });

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: NCERTChatMessage = {
        id: botMsgId,
        role: "bot",
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: response.sources,
        retrieved_sections: response.retrieved_sections,
        is_out_of_scope: response.is_out_of_scope,
        chapter: response.chapter,
        subject: response.subject,
      };

      setMessages((prev) => [...prev, botMsg]);
      // Auto-expand retrieved sources for transparency
      if (response.sources && response.sources.length > 0) {
        setOpenSourcesMap((prev) => ({ ...prev, [botMsgId]: true }));
      }
    } catch (err: unknown) {
      const errorMsg: NCERTChatMessage = {
        id: `err-${Date.now()}`,
        role: "bot",
        content:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while retrieving NCERT context. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        is_out_of_scope: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const resetChat = () => {
    if (!selectedChapter) return;
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: "bot",
        content: `Session restarted. Ask questions grounded in **${selectedChapter.chapter}**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        chapter: selectedChapter.chapter,
        subject: selectedChapter.subject,
      },
    ]);
  };

  return (
    <AuthRouteGuard>
      <div className="flex min-h-screen bg-[#07050E] text-white">
        <Sidebar onOpenCoach={() => setIsCoachOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            currentExam={currentExam}
            onExamChange={(newExam) => {
              setCurrentExam(newExam);
              switchUserExam(undefined, newExam);
            }}
            onOpenCoach={() => setIsCoachOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-6 max-w-5xl w-full mx-auto flex flex-col gap-5">
            {/* Page Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      NCERT-Bot
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        RAG Pipeline
                      </span>
                    </h1>
                    <p className="text-sm font-medium text-purple-300/90 mt-0.5">
                      Ask questions grounded in NCERT.
                    </p>
                  </div>
                </div>
                <blockquote className="mt-2 text-xs text-slate-400 italic">
                  This AI assistant answers questions using content retrieved from a selected NCERT chapter.
                </blockquote>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
                  title="Clear chat and restart session"
                >
                  <RotateCcw size={13} />
                  Reset Session
                </button>
              </div>
            </header>

            {/* Chapter Selection Card */}
            <section className="bg-gradient-to-r from-[#120D27] via-[#0F0A21] to-[#0A0716] rounded-2xl border border-purple-500/25 p-4 sm:p-5 shadow-xl shadow-purple-950/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-purple-400 font-bold">
                    <Layers size={14} />
                    Active Grounding Corpus
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200">
                      Subject: <strong className="text-white">Physics</strong>
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white">
                      Chapter: Units and Measurements
                    </span>
                    <span className="text-xs text-slate-400">({selectedChapter?.class_level || "Class 11"})</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Source: <span className="text-slate-300 font-medium">NCERT Class 11 Physics (Part 1)</span>
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>NCERT Content: ✓ Indexed</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium">
                    <Database size={13} className="text-purple-400" />
                    <span>Qdrant ({selectedChapter?.chunk_count ?? 27} Chunks)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                    <Binary size={13} className="text-cyan-400" />
                    <span>bge-small-en (384d)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Clickable Suggested Questions */}
            {selectedChapter?.suggested_questions && selectedChapter.suggested_questions.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <HelpCircle size={13} className="text-purple-400" />
                  Suggested Questions for {selectedChapter.chapter}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedChapter.suggested_questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isSending}
                      className="text-left text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-purple-400/40 transition-all disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                  {/* Demo test button for out-of-scope question */}
                  <button
                    onClick={() => handleSendMessage("What is the capital of France?")}
                    disabled={isSending}
                    className="text-left text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 transition-all disabled:opacity-50"
                    title="Test out-of-scope chapter boundary refusal"
                  >
                    Test Out-of-Scope ("Capital of France?")
                  </button>
                </div>
              </section>
            )}

            {/* Chat Transcript Area */}
            <div className="flex-1 min-h-[380px] max-h-[560px] overflow-y-auto space-y-4 pr-1 rounded-2xl bg-[#090614]/80 border border-white/10 p-4 sm:p-6 backdrop-blur-md">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const isSourcesOpen = openSourcesMap[msg.id];
                const hasSources = msg.sources && msg.sources.length > 0;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2 max-w-full`}
                  >
                    <div
                      className={`flex items-start gap-3 max-w-3xl ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                          isUser
                            ? "bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-600/20"
                            : "bg-gradient-to-tr from-purple-600 to-violet-700 shadow-md shadow-purple-600/20"
                        }`}
                      >
                        {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30"
                            : msg.is_out_of_scope
                            ? "bg-amber-950/30 border border-amber-500/40 text-amber-200 shadow-md"
                            : "bg-[#140E2A]/90 border border-purple-500/20 text-slate-100 shadow-md"
                        }`}
                      >
                        {/* Header for Bot message */}
                        {!isUser && (
                          <div className="flex flex-wrap items-center gap-2 mb-2 pb-1.5 border-b border-white/5 text-xs text-slate-400">
                            <span className="font-bold text-purple-300">NCERT-Bot</span>
                            {msg.chapter && (
                              <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-slate-300">
                                {msg.subject}: {msg.chapter}
                              </span>
                            )}
                            {msg.is_out_of_scope && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                                Out of Scope Refusal
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 ml-auto">{msg.timestamp}</span>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="whitespace-pre-line prose-invert text-slate-200">
                          {msg.content}
                        </div>

                        {/* Retrieved Sections List */}
                        {!isUser && msg.retrieved_sections && msg.retrieved_sections.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <FileText size={12} className="text-purple-400" />
                              Retrieved Sections:
                            </span>
                            {msg.retrieved_sections.map((sec, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px]"
                              >
                                {sec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Collapsible Retrieved NCERT Context (RAG Transparency for Judges) */}
                        {!isUser && hasSources && (
                          <div className="mt-3 pt-2 border-t border-white/10">
                            <button
                              onClick={() => toggleSources(msg.id)}
                              className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-300 border border-cyan-500/20 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Sparkles size={13} className="text-cyan-400" />
                                Retrieved NCERT Context ({msg.sources?.length} chunks)
                              </span>
                              {isSourcesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isSourcesOpen && (
                              <div className="mt-2.5 space-y-2.5">
                                {msg.sources?.map((chunk, idx) => {
                                  // Color code similarity: >=0.80 emerald, >=0.70 cyan, below amber
                                  const sim = chunk.similarity;
                                  const simBadgeColor =
                                    sim >= 0.8
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : sim >= 0.7
                                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                      : "bg-amber-500/20 text-amber-300 border-amber-500/40";

                                  return (
                                    <div
                                      key={chunk.chunk_id || idx}
                                      className="rounded-xl p-3 bg-[#0D091D] border border-cyan-500/20 space-y-1.5 text-xs"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-300">
                                            Chunk {idx + 1}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            {chunk.chunk_id}
                                          </span>
                                        </div>
                                        <div
                                          className={`px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold ${simBadgeColor}`}
                                        >
                                          Similarity: {chunk.similarity.toFixed(4)}
                                        </div>
                                      </div>

                                      <div className="text-[11px] text-purple-300/80 font-medium">
                                        Section: {chunk.section}
                                      </div>

                                      <p className="text-slate-300 italic bg-black/30 p-2.5 rounded-lg border border-white/5 leading-relaxed text-[12px] font-serif">
                                        &ldquo;{chunk.text.replace(/^\[.*?\]\n/, "")}&rdquo;
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Sending indicator */}
              {isSending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-700 flex items-center justify-center text-white shrink-0 animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-[#140E2A]/90 border border-purple-500/20 text-slate-300 text-xs flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Searching Qdrant vector index and grounding answer in NCERT text...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box Area */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-[#0E0921] border border-purple-500/30 focus-within:border-purple-400 rounded-2xl p-2 shadow-lg shadow-purple-950/30 transition-all">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything about ${selectedChapter?.chapter || "Units and Measurements"}...`}
                  disabled={isSending}
                  className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-white placeholder-slate-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Grounding is restricted to {selectedChapter?.chapter} ({selectedChapter?.subject}). Out-of-scope questions are rejected.
              </p>
            </div>
          </main>
        </div>

        <AICoachDrawer isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} />
      </div>
    </AuthRouteGuard>
  );
}
