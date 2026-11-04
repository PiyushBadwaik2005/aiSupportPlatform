"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import {
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  FileText,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Bot,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OverviewData {
  totalConversations: number;
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  answerRate: number;
  documents: {
    total: number;
    ready: number;
    processing: number;
    failed: number;
  };
  apiUsage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
  };
  recentConversations: Array<{
    _id: string;
    title: string;
    source: string;
    messageCount: number;
    updatedAt: string;
  }>;
  recentUnanswered: Array<{
    _id: string;
    question: string;
    relevanceScore: number;
    createdAt: string;
    reason: string;
  }>;
  chartData: Array<{
    date: string;
    answered: number;
    unanswered: number;
  }>;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    setIsLoading(true);
    const res = await apiRequest<OverviewData>("/v1/analytics/overview");
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error || "Failed to load dashboard metrics");
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
        {error || "Could not load dashboard data."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your assistant performance, document readiness, and customer answer rates.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{data.totalConversations}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Across playground, widget & API</p>
          </div>
        </div>

        {/* Answered Questions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Answered Questions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{data.answeredQuestions}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                {data.answerRate}% Rate
              </span>
              <span className="text-[11px] text-slate-500">Grounded answers</span>
            </div>
          </div>
        </div>

        {/* Unanswered Questions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unanswered Questions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{data.unansweredQuestions}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Requires knowledge base addition</p>
          </div>
        </div>

        {/* Knowledge Base Documents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Knowledge Base</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{data.documents.ready} / {data.documents.total}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data.documents.ready} ready documents indexed
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Document Readiness Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Activity & Grounding Trends</h2>
              <p className="text-xs text-slate-500">Answered vs Unsupported questions over last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Unanswered</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUnanswered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="answered" stroke="#2563eb" fillOpacity={1} fill="url(#colorAnswered)" strokeWidth={2} />
                <Area type="monotone" dataKey="unanswered" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUnanswered)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System & Processing Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Knowledge Ingestion Status</h2>
            <p className="text-xs text-slate-500 mb-5">Indexing pipeline health</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready & Searchable
                </span>
                <span className="font-semibold text-slate-800">{data.documents.ready}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Currently Processing
                </span>
                <span className="font-semibold text-slate-800">{data.documents.processing}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Failed Indexing
                </span>
                <span className="font-semibold text-slate-800">{data.documents.failed}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-800 mb-2">Integration API Calls</h3>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Total Calls</span>
                <span className="font-medium">{data.apiUsage.totalRequests}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1.5">
                <span>Failed API Calls</span>
                <span className="font-medium text-red-600">{data.apiUsage.failedRequests}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/dashboard/documents"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <span>Manage Documents</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Conversations</h2>
            <Link href="/dashboard/conversations" className="text-xs text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customer conversations recorded yet.
              </div>
            ) : (
              data.recentConversations.map((c) => (
                <div key={c._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-800 truncate">{c.title || "Customer Inquiry"}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(c.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                      {c.source}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {c.messageCount} msgs
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Unanswered Questions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Unanswered Questions</h2>
              {data.recentUnanswered.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  {data.unansweredQuestions} open
                </span>
              )}
            </div>
            <Link href="/dashboard/unanswered" className="text-xs text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentUnanswered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No unanswered questions! All inquiries have been grounded.
              </div>
            ) : (
              data.recentUnanswered.map((u) => (
                <div key={u._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-slate-800 truncate">{u.question}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/documents`}
                    className="text-[11px] text-blue-600 hover:underline font-medium shrink-0 ml-2"
                  >
                    Add Doc &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

