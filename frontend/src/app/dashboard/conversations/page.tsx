"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { formatDate } from "../../../lib/utils";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { FormattedMessage } from "../../../components/FormattedMessage";
import {
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  X,
  BookOpen,
} from "lucide-react";

interface ConversationItem {
  _id: string;
  sessionId: string;
  source: "playground" | "widget" | "api";
  title?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageItem {
  _id: string;
  role: "user" | "assistant";
  content: string;
  isAnswered: boolean;
  citations: Array<{
    documentTitle: string;
    snippet: string;
    page?: number;
    relevanceScore?: number;
  }>;
  createdAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected conversation modal
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [convMessages, setConvMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [page, sourceFilter]);

  async function fetchConversations() {
    setIsLoading(true);
    let url = `/v1/conversations?page=${page}&limit=10`;
    if (sourceFilter) url += `&source=${sourceFilter}`;

    const res = await apiRequest<ConversationItem[]>(url);
    if (res.success && res.data) {
      setConversations(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    }
    setIsLoading(false);
  }

  async function openConversationDetail(conv: ConversationItem) {
    setActiveConv(conv);
    setIsLoadingMessages(true);

    const res = await apiRequest<{ conversation: ConversationItem; messages: MessageItem[] }>(
      `/v1/conversations/${conv._id}`
    );

    if (res.success && res.data) {
      setConvMessages(res.data.messages);
    }
    setIsLoadingMessages(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const res = await apiRequest(`/v1/conversations/${deleteTarget._id}`, {
      method: "DELETE",
    });

    if (res.success) {
      setDeleteTarget(null);
      if (activeConv?._id === deleteTarget._id) {
        setActiveConv(null);
      }
      fetchConversations();
    } else {
      alert(`Failed to delete conversation: ${res.error}`);
    }
    setIsDeleting(false);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Conversations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review full dialogue histories, grounding citations, and interaction sessions.
        </p>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
            >
              <option value="">All Sources</option>
              <option value="widget">Website Widget</option>
              <option value="playground">AI Playground</option>
              <option value="api">Business Integration API</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total recorded: <strong className="text-slate-800">{totalCount}</strong>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Initial Question / Topic</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Messages</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading conversations...
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No conversations found.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-sm truncate">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{conv.title || "Inquiry Session"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {conv.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {conv.messageCount} messages
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(conv.updatedAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openConversationDetail(conv)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          View Transcript
                        </button>
                        <button
                          onClick={() => setDeleteTarget(conv)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
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

      {/* Conversation Detail Modal */}
      {activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="overflow-hidden">
                <h3 className="font-semibold text-slate-900 text-sm truncate">
                  {activeConv.title || "Conversation Transcript"}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ID: {activeConv._id} • Channel: {activeConv.source}
                </p>
              </div>
              <button
                onClick={() => setActiveConv(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/30">
              {isLoadingMessages ? (
                <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
              ) : convMessages.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No messages in conversation.</div>
              ) : (
                convMessages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-start gap-2.5 sm:gap-3 max-w-[88%] sm:max-w-xl ${
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs ${
                          isUser ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
                        }`}
                      >
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>

                      <div className="space-y-1 min-w-0 break-words">
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            isUser
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-200 text-slate-800"
                          }`}
                        >
                          <FormattedMessage content={msg.content} isUser={isUser} />
                        </div>

                        {!isUser && (
                          <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              {msg.isAnswered ? (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Answered
                                </span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                                  <HelpCircle className="w-2.5 h-2.5" /> Fallback
                                </span>
                              )}
                              <span>{formatDate(msg.createdAt)}</span>
                            </div>

                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-1 p-2 bg-slate-100 rounded text-[10px] space-y-1">
                                <span className="font-semibold text-slate-700 flex items-center gap-1">
                                  <BookOpen className="w-2.5 h-2.5" /> Sources:
                                </span>
                                {msg.citations.map((c, i) => (
                                  <p key={i} className="text-slate-600 italic">
                                    • {c.documentTitle} (Page {c.page || "N/A"}): "{c.snippet}"
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setActiveConv(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Conversation"
        message="Are you sure you want to permanently delete this conversation and its associated messages?"
        confirmText="Delete Conversation"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

