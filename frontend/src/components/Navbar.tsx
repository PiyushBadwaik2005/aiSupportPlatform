"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import { Bot, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";

export function Navbar() {
  const { business } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">
            {business?.name || "Support Workspace"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" /> Grounded RAG Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {business && (
          <Link
            href={`/chat/${business.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <span>Live Chat Widget</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        <Link
          href="/dashboard/playground"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Test Assistant</span>
        </Link>
      </div>
    </header>
  );
}

