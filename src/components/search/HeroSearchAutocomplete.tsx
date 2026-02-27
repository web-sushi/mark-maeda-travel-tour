"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  type: "tour" | "transfer" | "package";
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  region?: string | null;
}

const TYPE_COLORS = {
  tour: "bg-blue-600",
  transfer: "bg-purple-600",
  package: "bg-amber-600",
};

const TYPE_LABELS = {
  tour: "Tour",
  transfer: "Transfer",
  package: "Package",
};

// Helper: Convert underscores to spaces and Title Case
function formatCategory(label?: string | null): string {
  if (!label) return "";
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Helper: Map transfer categories to clean marketing labels
function niceTransferType(type?: string | null): string {
  switch (type) {
    case "city_to_city_transfer":
      return "City-to-City Transfer";
    case "airport_transfer":
      return "Airport Transfer";
    case "hourly_charter":
      return "Private Charter";
    case "theme_park_transfer":
      return "Theme Park Transfer";
    case "station_transfer":
      return "Station Transfer";
    case "port_transfer":
      return "Port Transfer";
    case "custom_transfer":
      return "Custom Transfer";
    default:
      return "";
  }
}

// Helper: Get formatted subtitle for dropdown item
function getSubtitle(item: Suggestion): string {
  if (item.type === "transfer") {
    const label = niceTransferType(item.category) || formatCategory(item.category) || "Transfer";
    return `${label} • Private Vehicle`;
  }

  // Tours show region, packages show category
  if (item.type === "tour" && item.region) {
    return item.region;
  }
  
  return formatCategory(item.category || item.region || "");
}

export default function HeroSearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error("Search suggest error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (query) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Navigate to selected item
  const handleSelect = (suggestion: Suggestion) => {
    const paths = {
      tour: "/tours",
      transfer: "/transfers",
      package: "/packages",
    };
    router.push(`${paths[suggestion.type]}/${suggestion.slug}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-4xl mx-auto mt-8 relative">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
        {/* Search Input */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tours, transfers..."
            className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-[#E4005A] focus:outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-5 w-5 text-[#E4005A]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {suggestions.length > 0 ? (
            <ul className="max-h-[400px] overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const subtitle = getSubtitle(suggestion);
                
                return (
                  <li key={`${suggestion.type}-${suggestion.id}`}>
                    <button
                      onClick={() => handleSelect(suggestion)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        highlightedIndex === index ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Badge */}
                        <span
                          className={`${TYPE_COLORS[suggestion.type]} text-white text-xs font-semibold px-2 py-1 rounded mt-0.5 whitespace-nowrap`}
                        >
                          {TYPE_LABELS[suggestion.type]}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {suggestion.title}
                          </p>
                          {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No results found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try different keywords
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
