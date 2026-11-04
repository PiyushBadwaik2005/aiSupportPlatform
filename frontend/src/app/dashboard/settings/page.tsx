"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  Settings,
  Building,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const { business, updateBusinessState } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [defaultGreeting, setDefaultGreeting] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [minRelevanceScore, setMinRelevanceScore] = useState(0.35);
  const [ragRetrievalMode, setRagRetrievalMode] = useState<"keyword" | "vector" | "hybrid">("keyword");

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (business) {
      setBusinessName(business.name || "");
      setWebsite(business.website || "");
      setDefaultGreeting(
        business.settings?.defaultGreeting ||
          "Hello! How can I assist you today with our products and services?"
      );
      setFallbackMessage(
        business.settings?.fallbackMessage ||
          "I couldn't find this information in the business's available documents. Please contact the business for confirmation."
      );
      setMinRelevanceScore(business.settings?.minRelevanceScore ?? 0.35);
      setRagRetrievalMode(business.settings?.ragRetrievalMode || "keyword");
    }
  }, [business]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await apiRequest<{
      _id: string;
      name: string;
      slug: string;
      website: string;
      settings: any;
    }>("/v1/business/settings", {
      method: "PUT",
      body: JSON.stringify({
        name: businessName.trim(),
        website: website.trim(),
        settings: {
          defaultGreeting: defaultGreeting.trim(),
          fallbackMessage: fallbackMessage.trim(),
          minRelevanceScore: Number(minRelevanceScore),
          ragRetrievalMode,
        },
      }),
    });

    if (res.success && res.data) {
      setFeedback({ type: "success", message: "Settings successfully saved." });
      updateBusinessState(res.data as any);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update settings" });
    }
    setIsSaving(false);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure business details, custom AI greetings, fallback behavior, and RAG retrieval sensitivity.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Business Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Public Business Slug (Used in embed widget)
            </label>
            <input
              type="text"
              readOnly
              value={business?.slug || ""}
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* AI Assistant Grounding & Behavior */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">AI Personality & Grounding Controls</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Initial Greeting Message
            </label>
            <textarea
              value={defaultGreeting}
              onChange={(e) => setDefaultGreeting(e.target.value)}
              rows={2}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Displayed when a customer starts a new session.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Conservative Fallback Response (When Evidence is Insufficient)
            </label>
            <textarea
              value={fallbackMessage}
              onChange={(e) => setFallbackMessage(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Returned automatically when documents do not contain reliable evidence, preventing AI hallucinations.
            </p>
          </div>

          {/* RAG Retrieval Mode */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              RAG Retrieval Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "keyword",
                  title: "Keyword Search",
                  desc: "Zero external dependencies. MongoDB full-text index matching.",
                },
                {
                  id: "vector",
                  title: "Vector Search",
                  desc: "Semantic embeddings via Gemini text-embedding-004.",
                },
                {
                  id: "hybrid",
                  title: "Hybrid Search",
                  desc: "Combines keyword coverage with semantic similarity.",
                },
              ].map((mode) => (
                <label
                  key={mode.id}
                  className={`p-3 border rounded-xl cursor-pointer transition-colors block ${
                    ragRetrievalMode === mode.id
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="ragMode"
                    value={mode.id}
                    checked={ragRetrievalMode === mode.id}
                    onChange={() => setRagRetrievalMode(mode.id as any)}
                    className="sr-only"
                  />
                  <p className="text-xs font-semibold text-slate-900">{mode.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{mode.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Sensitivity Slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Minimum Relevance Score Cutoff:</span>
              <span className="font-mono text-blue-600 font-bold">{minRelevanceScore}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={minRelevanceScore}
              onChange={(e) => setMinRelevanceScore(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.10 (Permissive)</span>
              <span>0.35 (Recommended Default)</span>
              <span>0.80 (Strict / Conservative)</span>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Settings..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

