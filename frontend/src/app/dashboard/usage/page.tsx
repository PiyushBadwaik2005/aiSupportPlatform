"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Search,
} from "lucide-react";

interface UsageLog {
  _id: string;
  apiKeyId?: {
    name: string;
    keyPrefix: string;
  };
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  tokensUsed: number;
  isSuccess: boolean;
  errorMessage?: string;
  timestamp: string;
}

interface UsageSummary {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  totalTokens: number;
}

export default function ApiUsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchUsage();
  }, [page]);

  async function fetchUsage() {
    setIsLoading(true);
    const res = await apiRequest<{ summary: UsageSummary; logs: UsageLog[] }>(
      `/v1/integrations/usage?page=${page}&limit=15`
    );

    if (res.success && res.data) {
      setSummary(res.data.summary);
      setLogs(res.data.logs);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    }
    setIsLoading(false);
  }

  const successRate =
    summary && summary.totalCalls > 0
      ? Math.round((summary.successCalls / summary.totalCalls) * 100)
      : 100;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Usage & Telemetry</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor incoming REST requests, response latencies, error rates, and token consumption.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total API Requests</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{summary?.totalCalls || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">All versioned endpoints</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{successRate}%</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {summary?.successCalls || 0} successful / {summary?.failedCalls || 0} failed
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Latency</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{summary?.avgResponseTime || 0} ms</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">End-to-end response time</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tokens Processed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{summary?.totalTokens.toLocaleString() || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Gemini generation tokens</p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent API Request Logs</h2>
          <span className="text-xs text-slate-500">
            Total records: <strong className="text-slate-800">{totalCount}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Method & Endpoint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Key Used</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    Loading telemetry logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    No API activity recorded yet. Send requests via the integration API to see logs here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 mr-2 font-bold uppercase">
                        {log.method}
                      </span>
                      {log.endpoint}
                    </td>

                    <td className="py-3 px-4">
                      {log.isSuccess ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          {log.statusCode} OK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 font-mono">
                          {log.statusCode} FAIL
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">{log.responseTimeMs} ms</td>

                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {log.apiKeyId ? (
                        <span>
                          {log.apiKeyId.name} ({log.apiKeyId.keyPrefix}...)
                        </span>
                      ) : (
                        <span className="text-slate-400">Direct / Session</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

