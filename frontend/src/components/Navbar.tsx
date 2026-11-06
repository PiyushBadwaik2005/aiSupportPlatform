"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import { Bot, ExternalLink, ShieldCheck, Menu } from "lucide-react";

interface NavbarProps {
  onOpenMobileSidebar?: () => void;
}

export function Navbar({ onOpenMobileSidebar }: NavbarProps = {}) {
  const { business } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-3 sm:px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[130px] sm:max-w-xs md:max-w-md">
            {business?.name || "Support Workspace"}
          </span>
          <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">Grounded RAG</span> Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {business && (
          <Link
            href={`/chat/${business.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            title="Open Live Public Chat Widget"
          >
            <span className="hidden sm:inline">Live Chat Widget</span>
            <span className="sm:hidden">Widget</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}

        <Link
          href="/dashboard/playground"
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          title="Test AI Assistant"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Test Assistant</span>
          <span className="sm:hidden">Test AI</span>
        </Link>
      </div>
    </header>
  );
}

