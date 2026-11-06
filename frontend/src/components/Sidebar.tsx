"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import {
  LayoutDashboard,
  FileText,
  Bot,
  MessageSquare,
  HelpCircle,
  KeyRound,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  ExternalLink,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const { business, user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Knowledge Base", href: "/dashboard/documents", icon: FileText },
    { label: "AI Playground", href: "/dashboard/playground", icon: Bot },
    { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { label: "Unanswered", href: "/dashboard/unanswered", icon: HelpCircle },
    { label: "Integrations & API", href: "/dashboard/integrations", icon: KeyRound },
    { label: "API Usage", href: "/dashboard/usage", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-20 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out h-full ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72 max-w-[85vw]`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 shrink-0">
          {!isCollapsed && (
            <Link
              href="/dashboard"
              onClick={() => onCloseMobile?.()}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-sm leading-tight tracking-tight">
                  AI Support
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Enterprise RAG</span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden lg:block"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Badge */}
        {!isCollapsed && business && (
          <div className="mx-3 my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{business.name}</p>
                <Link
                  href={`/chat/${business.slug}`}
                  target="_blank"
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-medium mt-0.5"
                >
                  Public Widget <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nav List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onCloseMobile?.()}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User info */}
        <div className="p-3 border-t border-slate-200 shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {!isCollapsed && (
              <div className="overflow-hidden mr-2 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
            )}
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

