"use client";

import { useState, useMemo } from "react";
import ListingCard from "@/components/listing/ListingCard";
import EmptyState from "@/components/listing/EmptyState";

interface Tour {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  duration_hours: number | null;
  price: number | null;
  imageUrl: string | null;
  is_featured?: boolean;
  is_popular?: boolean;
  created_at?: string;
}

interface ToursListClientProps {
  tours: Tour[];
}

type SortOption = "popular" | "newest";
type PriceSortOption = "default" | "low_to_high" | "high_to_low";

/**
 * Get tour price safely (prefers price field from server)
 */
function getTourPrice(tour: Tour): number | null {
  return tour.price;
}

/**
 * Sort tours by selected option and price sort
 */
function sortTours(tours: Tour[], sort: SortOption, priceSort: PriceSortOption): Tour[] {
  const sorted = [...tours];
  
  // Apply price sort first if selected
  if (priceSort === "low_to_high") {
    return sorted.sort((a, b) => {
      const priceA = getTourPrice(a);
      const priceB = getTourPrice(b);
      
      // Handle null prices: put them at the end (treat as +Infinity)
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      
      return priceA - priceB;
    });
  }
  
  if (priceSort === "high_to_low") {
    return sorted.sort((a, b) => {
      const priceA = getTourPrice(a);
      const priceB = getTourPrice(b);
      
      // Handle null prices: put them at the end (treat as -Infinity)
      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;
      
      return priceB - priceA;
    });
  }
  
  // Otherwise, apply the regular sort
  if (sort === "popular") {
    // Popular: is_featured/is_popular first, then by created_at desc
    return sorted.sort((a, b) => {
      const aPopular = a.is_featured || a.is_popular ? 1 : 0;
      const bPopular = b.is_featured || b.is_popular ? 1 : 0;
      
      if (aPopular !== bPopular) return bPopular - aPopular;
      
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return bDate - aDate;
    });
  }
  
  if (sort === "newest") {
    return sorted.sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return bDate - aDate;
    });
  }
  
  return sorted;
}

export default function ToursListClient({ tours }: ToursListClientProps) {
  // Single source of truth for all filters
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPriceSort, setSelectedPriceSort] = useState<PriceSortOption>("default");
  const [selectedSort, setSelectedSort] = useState<SortOption>("popular");

  // Extract unique regions (based on full tour list)
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    tours.forEach((tour) => {
      const region = tour.region?.trim();
      if (region) regionSet.add(region);
    });
    return Array.from(regionSet).sort();
  }, [tours]);

  // Apply all filters in order: region → sort (with price sort override)
  const filteredTours = useMemo(() => {
    let result = tours;
    
    // 1. Filter by region
    if (selectedRegion !== "all") {
      result = result.filter((tour) => {
        const region = tour.region?.trim();
        return region === selectedRegion;
      });
    }
    
    // 2. Sort (price sort takes precedence if set)
    result = sortTours(result, selectedSort, selectedPriceSort);
    
    return result;
  }, [tours, selectedRegion, selectedPriceSort, selectedSort]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedRegion("all");
    setSelectedPriceSort("default");
    setSelectedSort("popular");
  };

  // Check if any filter is active
  const hasActiveFilters = selectedRegion !== "all" || 
                          selectedPriceSort !== "default" || 
                          selectedSort !== "popular";

  return (
    <>
      {/* Single Unified Filter Bar */}
      <div className="glass border-b sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 gap-3 items-center sm:flex sm:flex-wrap">
            {/* Region Dropdown */}
            {regions.length > 0 && (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent bg-white"
              >
                <option value="all">All Regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            )}

            {/* Price Sort Dropdown */}
            <select
              value={selectedPriceSort}
              onChange={(e) => setSelectedPriceSort(e.target.value as PriceSortOption)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent bg-white"
            >
              <option value="default">Price</option>
              <option value="low_to_high">Price: Low → High</option>
              <option value="high_to_low">Price: High → Low</option>
            </select>

            {/* Sort Dropdown */}
            <div className="col-span-2 flex items-center gap-3 sm:ml-auto">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E4005A] focus:border-transparent bg-white"
              >
                <option value="popular">Sort: Popular</option>
                <option value="newest">Sort: Newest</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#E4005A] hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-semibold">{filteredTours.length}</span> {filteredTours.length === 1 ? 'tour' : 'tours'}
            {hasActiveFilters && (
              <span className="ml-2 text-gray-500">
                (from {tours.length} total)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tours Display */}
      <div className="py-12 mt-8">
        {filteredTours.length > 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {selectedRegion === "all"
                  ? "Available Tours"
                  : `Tours in ${selectedRegion}`}
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Explore our handcrafted experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {filteredTours.map((tour) => (
                <ListingCard
                  key={tour.id}
                  title={tour.title}
                  imageUrl={tour.imageUrl}
                  price={tour.price}
                  region={tour.region}
                  duration_hours={tour.duration_hours}
                  href={`/tours/${tour.slug}`}
                  variant="experience"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="No tours match your filters"
              description="Try adjusting your filters or clearing them to see more results."
            />
          </div>
        )}
      </div>
    </>
  );
}
