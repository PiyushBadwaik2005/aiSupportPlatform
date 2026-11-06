"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

export function FormattedMessage({ content, isUser = false }: FormattedMessageProps) {
  if (!content) return null;

  // Render inline formatting (bold text, strip raw asterisks)
  const renderInline = (text: string) => {
    // Match **bold** blocks
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        const innerText = part.slice(2, -2).trim();
        return (
          <strong
            key={idx}
            className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}
          >
            {innerText}
          </strong>
        );
      }
      // Clean any rogue single asterisks from remaining text
      const cleaned = part.replace(/\*/g, "");
      return <span key={idx}>{cleaned}</span>;
    });
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 my-1.5 pl-1">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`list-flush-${lineIdx}`);
      return;
    }

    // Check if line starts with a list bullet (*, -, •, or number like 1.)
    const bulletMatch = trimmed.match(/^([*\-•]|\d+\.)\s+(.*)$/);

    if (bulletMatch) {
      const itemContent = bulletMatch[2];
      currentListItems.push(
        <li key={`li-${lineIdx}`} className="flex items-start gap-2">
          <span
            className={`font-bold select-none shrink-0 text-xs mt-0.5 ${
              isUser ? "text-white/80" : "text-blue-600"
            }`}
          >
            •
          </span>
          <span className="flex-1">{renderInline(itemContent)}</span>
        </li>
      );
    } else {
      flushList(`list-before-p-${lineIdx}`);
      elements.push(
        <p key={`p-${lineIdx}`} className="leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  flushList("list-final");

  return <div className="space-y-1.5">{elements}</div>;
}
