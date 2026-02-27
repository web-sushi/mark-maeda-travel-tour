"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type SearchType = "all" | "tours" | "transfers" | "packages";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set("q", query.trim());
    params.set("type", type);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
        {/* Type Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setType("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              type === "all"
                ? "bg-[#E4005A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setType("tours")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              type === "tours"
                ? "bg-[#E4005A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tours
          </button>
          <button
            type="button"
            onClick={() => setType("transfers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              type === "transfers"
                ? "bg-[#E4005A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Transfers
          </button>
          <button
            type="button"
            onClick={() => setType("packages")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              type === "packages"
                ? "bg-[#E4005A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Packages
          </button>
        </div>

        {/* Search Input Row */}
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 relative">
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
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tours, transfers..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-[#E4005A] focus:outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          <button
            type="submit"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-[#E4005A] hover:bg-[#C4004A] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
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
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}
