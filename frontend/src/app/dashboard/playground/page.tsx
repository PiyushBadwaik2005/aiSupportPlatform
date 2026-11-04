"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface Citation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
  page?: number;
  relevanceScore?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isAnswered?: boolean;
  citations?: Citation[];
  timestamp: string;
}

export default function PlaygroundPage() {
  const { business } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with business greeting
  useEffect(() => {
    resetChat();
  }, [business]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function resetChat() {
    const greeting =
      business?.settings?.defaultGreeting ||
      "Hello! I am your AI Support Assistant powered by your uploaded knowledge documents. How can I assist you today?";

    setMessages([
      {
        id: "msg_init",
        role: "assistant",
        content: greeting,
        isAnswered: true,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setConversationId(null);
    setErrorMessage(null);
    setInput("");
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest<{
        answer: string;
        answered: boolean;
        sources: Citation[];
        conversationId: string;
      }>("/v1/chat/playground", {
        method: "POST",
        body: JSON.stringify({
          question: query,
          conversationId,
        }),
      });

      if (res.success && res.data) {
        setConversationId(res.data.conversationId);

        const assistantMsg: ChatMessage = {
          id: `ast_${Date.now()}`,
          role: "assistant",
          content: res.data.answer,
          isAnswered: res.data.answered,
          citations: res.data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setErrorMessage(res.error || "Failed to retrieve response from AI service.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network communication error.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSources(msgId: string) {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Playground Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              AI Playground — Grounding Simulator
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                Mode: {business?.settings?.ragRetrievalMode || "keyword"}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Interactive test console verifying Gemini answers against current knowledge chunks.
            </p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors border border-slate-200 bg-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const hasSources = msg.citations && msg.citations.length > 0;
          const isSourcesOpen = expandedSources[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-slate-800 text-white"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1.5 overflow-hidden">
                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {!isUser && msg.id !== "msg_init" && (
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 text-[11px]">
                      {msg.isAnswered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200/60">
                          <ShieldCheck className="w-3 h-3" /> Grounded in Knowledge Base
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200/60">
                          <HelpCircle className="w-3 h-3" /> Controlled Fallback (Recorded in Unanswered)
                        </span>
                      )}

                      <span className="text-slate-400 font-mono text-[10px]">{msg.timestamp}</span>
                    </div>

                    {/* Citations Accordion */}
                    {hasSources && (
                      <div className="mt-1 border border-slate-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 text-blue-600">
                            <BookOpen className="w-3.5 h-3.5" />
                            {msg.citations!.length} Supporting Sources Cited
                          </span>
                          {isSourcesOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {isSourcesOpen && (
                          <div className="p-3 bg-slate-50/70 border-t border-slate-200 space-y-2 text-[11px]">
                            {msg.citations!.map((cit, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-white rounded-md border border-slate-200/80 shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between font-semibold text-slate-800">
                                  <span>
                                    {cit.documentTitle} {cit.page ? `(Page ${cit.page})` : ""}
                                  </span>
                                  {cit.relevanceScore !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Score: {Math.round(cit.relevanceScore * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-600 text-[10px] italic bg-slate-50 p-1.5 rounded">
                                  "{cit.snippet}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Searching knowledge chunks & generating grounded answer...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a customer question (e.g., 'What is your refund policy?')..."
            className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Answers are strictly bounded to verified document excerpts. Unknown questions trigger safe fallback.
        </p>
      </div>
    </div>
  );
}

