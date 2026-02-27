"use client";

import { useState, useMemo } from "react";
import RegionChips from "@/components/ui/RegionChips";
import HorizontalCardCarousel from "@/components/ui/HorizontalCardCarousel";
import CarouselCardWrapper from "@/components/ui/CarouselCardWrapper";
import ListingCard from "@/components/listing/ListingCard";
import EmptyState from "@/components/listing/EmptyState";

interface Package {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  items: any;
  price: number | null; // Pre-computed on server
  imageUrl: string | null; // Pre-computed on server
}

interface PackagesListClientProps {
  packages: Package[];
}

export default function PackagesListClient({
  packages,
}: PackagesListClientProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Normalize and extract regions
  const { regions, regionCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    
    packages.forEach((pkg) => {
      const region = pkg.region?.trim() || "Other";
      counts[region] = (counts[region] || 0) + 1;
    });

    const uniqueRegions = Object.keys(counts).sort();
    return { regions: uniqueRegions, regionCounts: counts };
  }, [packages]);

  // Filter packages by selected region
  const filteredPackages = useMemo(() => {
    if (selectedRegion === "all") {
      return packages;
    }
    return packages.filter((pkg) => {
      const region = pkg.region?.trim() || "Other";
      return region === selectedRegion;
    });
  }, [packages, selectedRegion]);

  return (
    <>
      {/* Region Filter Chips */}
      {regions.length > 0 && (
        <RegionChips
          regions={regions}
          regionCounts={regionCounts}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />
      )}

      {/* Carousel or Empty State */}
      <div className="py-12 mt-12">
        {filteredPackages.length > 0 ? (
          <HorizontalCardCarousel
            title={
              selectedRegion === "all"
                ? "Available Packages"
                : `Packages in ${selectedRegion}`
            }
            subtitle="Swipe to explore our curated travel bundles"
          >
            {filteredPackages.map((pkg) => {
              const itemsCount = Array.isArray(pkg.items) ? pkg.items.length : 0;
              
              const tags = [`${itemsCount} items included`];
              tags.push("Bundle Deal");

              return (
                <CarouselCardWrapper key={pkg.id}>
                  <ListingCard
                    title={pkg.title}
                    imageUrl={pkg.imageUrl}
                    price={pkg.price}
                    region={pkg.region}
                    tags={tags}
                    href={`/packages/${pkg.slug}`}
                    variant="package"
                  />
                </CarouselCardWrapper>
              );
            })}
          </HorizontalCardCarousel>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              title={`No packages available in ${selectedRegion}`}
              description="Try selecting a different region or check back soon for new package deals."
            />
          </div>
        )}
      </div>
    </>
  );
}
