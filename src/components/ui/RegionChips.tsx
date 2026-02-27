"use client";

import { useState } from "react";

interface RegionChipsProps {
  regions: string[];
  regionCounts: Record<string, number>;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

export default function RegionChips({
  regions,
  regionCounts,
  selectedRegion,
  onRegionChange,
}: RegionChipsProps) {
  const totalCount = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {/* All Chip */}
          <button
            onClick={() => onRegionChange("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedRegion === "all"
                ? "bg-[#E4005A] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({totalCount})
          </button>

          {/* Region Chips */}
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedRegion === region
                  ? "bg-[#E4005A] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {region} ({regionCounts[region] || 0})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
