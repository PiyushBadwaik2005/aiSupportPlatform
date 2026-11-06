"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../../../lib/api";
import { formatDate, formatBytes } from "../../../lib/utils";
import { ConfirmModal } from "../../../components/ConfirmModal";
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileUp,
  X,
  FileCode,
} from "lucide-react";

interface DocumentItem {
  _id: string;
  title: string;
  originalFilename: string;
  fileType: "pdf" | "docx" | "txt";
  fileSize: number;
  status: "pending" | "processing" | "ready" | "failed";
  errorMessage?: string;
  chunkCount: number;
  wordCount: number;
  version: number;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace modal state
  const [replaceTarget, setReplaceTarget] = useState<DocumentItem | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter, search]);

  async function fetchDocuments() {
    setIsLoading(true);
    let url = `/v1/documents?page=${page}&limit=10`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    const res = await apiRequest<DocumentItem[]>(url);
    if (res.success && res.data) {
      setDocuments(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    }
    setIsLoading(false);
  }

  function handleFileSelect(file: File) {
    setUploadError(null);
    setUploadSuccess(null);

    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setUploadError("Invalid file type. Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds the maximum 10MB size limit.");
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (customTitle.trim()) {
      formData.append("title", customTitle.trim());
    }

    const res = await apiRequest("/v1/documents", {
      method: "POST",
      body: formData,
    });

    if (res.success) {
      setUploadSuccess(`"${customTitle || selectedFile.name}" successfully indexed into Knowledge Base.`);
      setSelectedFile(null);
      setCustomTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } else {
      setUploadError(res.error || "Failed to process document");
    }
    setIsUploading(false);
  }

  async function handleRetry(doc: DocumentItem) {
    const res = await apiRequest(`/v1/documents/${doc._id}/retry`, {
      method: "POST",
    });

    if (res.success) {
      fetchDocuments();
    } else {
      alert(`Retry failed: ${res.error}`);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const res = await apiRequest(`/v1/documents/${deleteTarget._id}`, {
      method: "DELETE",
    });

    if (res.success) {
      setDeleteTarget(null);
      fetchDocuments();
    } else {
      alert(`Delete failed: ${res.error}`);
    }
    setIsDeleting(false);
  }

  async function handleConfirmReplace(e: React.FormEvent) {
    e.preventDefault();
    if (!replaceTarget || !replaceFile) return;

    setIsReplacing(true);
    const formData = new FormData();
    formData.append("file", replaceFile);

    const res = await apiRequest(`/v1/documents/${replaceTarget._id}/replace`, {
      method: "PUT",
      body: formData,
    });

    if (res.success) {
      setReplaceTarget(null);
      setReplaceFile(null);
      fetchDocuments();
    } else {
      alert(`Replacement failed: ${res.error}`);
    }
    setIsReplacing(false);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Knowledge Base Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload and manage verified business files (PDF, DOCX, TXT) used by Gemini for grounded support.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Upload New Knowledge Document</h2>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                {selectedFile ? (
                  <span className="text-blue-600 font-semibold">{selectedFile.name} ({formatBytes(selectedFile.size)})</span>
                ) : (
                  <span>Click to choose or drag & drop documents here</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF, DOCX, TXT (Maximum size: 10MB)
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Document Title / Reference
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Return Policy 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Ingesting & Chunking...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      <span>Upload & Process</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setCustomTitle("");
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </form>
      </div>

      {/* Document Library Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title..."
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
              <option value="">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Type / Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Words</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No documents found in knowledge base. Upload your first document above.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-800 truncate max-w-xs">{doc.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{doc.originalFilename}</p>
                          {doc.errorMessage && (
                            <p className="text-[10px] text-red-600 mt-0.5 truncate">{doc.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 uppercase text-[11px] font-mono text-slate-600">
                      {doc.fileType} • {formatBytes(doc.fileSize)}
                    </td>

                    <td className="py-3.5 px-4">
                      {doc.status === "ready" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                          <Clock className="w-3 h-3" /> Processing
                        </span>
                      )}
                      {doc.status === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">{doc.chunkCount}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{doc.wordCount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDate(doc.createdAt)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === "failed" && (
                          <button
                            onClick={() => handleRetry(doc)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            title="Retry ingestion"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setReplaceTarget(doc);
                            setReplaceFile(null);
                          }}
                          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Replace document file"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete document and chunks"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Showing {documents.length} of {totalCount} documents
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Document & Chunks"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All associated indexed chunks will be permanently purged from the retrieval index.`}
        confirmText="Delete Document"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Replace Document Modal */}
      {replaceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 mx-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Replace Document File</h3>
              <button onClick={() => setReplaceTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReplace} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Uploading a replacement for <span className="font-semibold text-slate-900">"{replaceTarget.title}"</span> will invalidate previous vector entries and re-index the new content under version {replaceTarget.version + 1}.
              </p>

              <div>
                <input
                  type="file"
                  ref={replaceInputRef}
                  accept=".pdf,.docx,.txt"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReplaceFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplaceTarget(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replaceFile || isReplacing}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isReplacing ? "Replacing..." : "Confirm Replacement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

