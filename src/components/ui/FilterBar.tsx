"use client";

import { useState } from "react";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  regions?: FilterOption[];
  durations?: FilterOption[];
  priceRanges?: FilterOption[];
  sortOptions?: FilterOption[];
  onFilterChange?: (filters: any) => void;
}

export default function FilterBar({
  regions = [],
  durations = [],
  priceRanges = [],
  sortOptions = [
    { label: "Popular", value: "popular" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
  ],
  onFilterChange,
}: FilterBarProps) {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedSort, setSelectedSort] = useState("popular");

  const handleChange = (type: string, value: string) => {
    const updates: any = {};
    
    if (type === "region") {
      setSelectedRegion(value);
      updates.region = value;
    } else if (type === "duration") {
      setSelectedDuration(value);
      updates.duration = value;
    } else if (type === "price") {
      setSelectedPrice(value);
      updates.price = value;
    } else if (type === "sort") {
      setSelectedSort(value);
      updates.sort = value;
    }

    if (onFilterChange) {
      onFilterChange({
        region: type === "region" ? value : selectedRegion,
        duration: type === "duration" ? value : selectedDuration,
        price: type === "price" ? value : selectedPrice,
        sort: type === "sort" ? value : selectedSort,
      });
    }
  };

  return (
    <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {regions.length > 0 && (
            <select
              value={selectedRegion}
              onChange={(e) => handleChange("region", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          )}

          {durations.length > 0 && (
            <select
              value={selectedDuration}
              onChange={(e) => handleChange("duration", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent"
            >
              <option value="">Duration</option>
              {durations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          )}

          {priceRanges.length > 0 && (
            <select
              value={selectedPrice}
              onChange={(e) => handleChange("price", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent"
            >
              <option value="">Price Range</option>
              {priceRanges.map((price) => (
                <option key={price.value} value={price.value}>
                  {price.label}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto">
            <select
              value={selectedSort}
              onChange={(e) => handleChange("sort", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent"
            >
              {sortOptions.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
