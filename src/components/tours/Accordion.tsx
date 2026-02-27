"use client";

import { useState } from "react";

interface AccordionProps {
  title: string;
  items?: string[];
  content?: string;
  defaultOpen?: boolean;
}

export default function Accordion({
  title,
  items,
  content,
  defaultOpen = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-amber-200">
          {items && items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span className="text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
