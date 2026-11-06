"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "../../../lib/api";
import { FormattedMessage } from "../../../components/FormattedMessage";
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

interface Citation {
  documentTitle: string;
  snippet: string;
  page?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isAnswered?: boolean;
}

export default function PublicChatPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [businessName, setBusinessName] = useState<string>("Business Support");
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      loadPublicConfig();
    }
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function loadPublicConfig() {
    setIsInitializing(true);
    const res = await apiRequest<{
      businessName: string;
      greeting: string;
      publicToken: string;
    }>(`/v1/chat/public/config/${slug}`);

    if (res.success && res.data) {
      setBusinessName(res.data.businessName);
      if (res.data.publicToken) {
        setPublicToken(res.data.publicToken);
      }
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            res.data.greeting ||
            `Hello! Welcome to ${res.data.businessName}'s customer assistant. How can I help you today?`,
          isAnswered: true,
        },
      ]);
    } else {
      setInitError("This business support channel could not be found.");
    }
    setIsInitializing(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiRequest<{
        answer: string;
        answered: boolean;
        sources: Citation[];
        conversationId: string;
      }>("/v1/chat/public", {
        method: "POST",
        body: JSON.stringify({
          question: query,
          conversationId,
          slug,
          token: publicToken || undefined,
        }),
      });

      if (res.success && res.data) {
        const data = res.data;
        setConversationId(data.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: `ast_${Date.now()}`,
            role: "assistant",
            content: data.answer,
            isAnswered: data.answered,
            citations: data.sources || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "Sorry, I am temporarily unable to answer. Please try again shortly.",
            isAnswered: false,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Network error. Please check your connection.",
          isAnswered: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Connecting to verified assistant...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Assistant Unavailable</h2>
          <p className="text-xs text-slate-600">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/90 flex flex-col h-[90vh] overflow-hidden">
        {/* Widget Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                {businessName}
              </h2>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified AI Customer Support
              </span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 max-w-xl ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                    }`}
                  >
                    <FormattedMessage content={m.content} isUser={isUser} />
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Checking verified documents...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about our policies, pricing, returns..."
              className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Grounded Answers powered by AI Support Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
