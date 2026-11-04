"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";
import { formatDate } from "../../../lib/utils";
import {
  HelpCircle,
  CheckCircle2,
  FilePlus,
  Search,
  MessageSquare,
  Clock,
  X,
  FileText,
} from "lucide-react";

interface UnansweredItem {
  _id: string;
  question: string;
  conversationId?: {
    _id: string;
    title: string;
    source: string;
  };
  status: "open" | "resolved" | "ignored";
  relevanceScore: number;
  reason?: string;
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export default function UnansweredQuestionsPage() {
  const [questions, setQuestions] = useState<UnansweredItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<UnansweredItem | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  useEffect(() => {
    fetchUnanswered();
  }, [page, statusFilter, search]);

  async function fetchUnanswered() {
    setIsLoading(true);
    let url = `/v1/unanswered-questions?page=${page}&limit=10`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    const res = await apiRequest<UnansweredItem[]>(url);
    if (res.success && res.data) {
      setQuestions(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    }
    setIsLoading(false);
  }

  async function handleResolveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolveTarget) return;

    setIsSubmittingResolve(true);
    const res = await apiRequest(`/v1/unanswered-questions/${resolveTarget._id}/resolve`, {
      method: "PUT",
      body: JSON.stringify({
        status: "resolved",
        notes: resolveNotes.trim() || "Resolved by business owner",
      }),
    });

    if (res.success) {
      setResolveTarget(null);
      setResolveNotes("");
      fetchUnanswered();
    } else {
      alert(`Error resolving question: ${res.error}`);
    }
    setIsSubmittingResolve(false);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unanswered Questions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Investigate customer questions where supporting knowledge was missing, and expand your documents.
        </p>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search question text..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="open">Open (Unresolved)</option>
              <option value="resolved">Resolved</option>
              <option value="">All Questions</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Question</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Diagnostic Reason</th>
                <th className="py-3 px-4">Asked Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading unanswered questions...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No unanswered questions found matching criteria.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-snug">{q.question}</p>
                          {q.conversationId && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> From session: {q.conversationId.title} ({q.conversationId.source})
                            </p>
                          )}
                          {q.notes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded mt-1.5 border border-slate-100">
                              Resolution Note: {q.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {q.status === "open" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Needs Knowledge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {q.reason || "insufficient_evidence"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(q.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {q.status === "open" && (
                          <button
                            onClick={() => {
                              setResolveTarget(q);
                              setResolveNotes("");
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        <Link
                          href="/dashboard/documents"
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                          title="Upload documents covering this topic"
                        >
                          <FilePlus className="w-3 h-3" />
                          <span>Add Document</span>
                        </Link>
                      </div>
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

      {/* Resolve Question Modal */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Mark Question as Resolved</h3>
              <button onClick={() => setResolveTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-700">Question:</p>
                <p className="text-xs text-slate-900 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                  "{resolveTarget.question}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resolution Notes (e.g., "Covered in Shipping Policy v2")
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain how this knowledge was addressed..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolve}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingResolve ? "Saving..." : "Confirm Resolved"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

