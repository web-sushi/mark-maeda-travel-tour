"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import HorizontalCardCarousel from "@/components/ui/HorizontalCardCarousel";
import CarouselCardWrapper from "@/components/ui/CarouselCardWrapper";
import TransferCard from "@/components/listing/TransferCard";
import TransferFilterBar from "@/components/transfers/TransferFilterBar";
import EmptyState from "@/components/listing/EmptyState";

interface Transfer {
  id: string;
  title: string;
  slug: string;
  from_area: string | null;
  to_area: string | null;
  category: string;
  pricing_model: string;
  price: number | null;
  imageUrl: string | null;
}

interface TransfersBrowserProps {
  transfers: Transfer[];
  categoryLabels: Record<string, string>;
  sortedCategories: string[];
}

export default function TransfersBrowser({
  transfers,
  categoryLabels,
  sortedCategories,
}: TransfersBrowserProps) {
  const [fromFilter, setFromFilter] = useState<string>("");
  const [toFilter, setToFilter] = useState<string>("");

  // Extract unique from/to options for typeahead
  const { fromOptions, toOptions } = useMemo(() => {
    const fromSet = new Set<string>();
    const toSet = new Set<string>();

    transfers.forEach((transfer) => {
      if (transfer.from_area?.trim()) {
        fromSet.add(transfer.from_area.trim());
      }
      if (transfer.to_area?.trim()) {
        toSet.add(transfer.to_area.trim());
      }
    });

    return {
      fromOptions: Array.from(fromSet).sort(),
      toOptions: Array.from(toSet).sort(),
    };
  }, [transfers]);

  // Filter transfers based on from/to values
  const filteredTransfers = useMemo(() => {
    if (!fromFilter && !toFilter) {
      return transfers;
    }

    return transfers.filter((transfer) => {
      const fromMatch = !fromFilter || 
        (transfer.from_area?.toLowerCase().includes(fromFilter.toLowerCase()) ?? false);
      const toMatch = !toFilter || 
        (transfer.to_area?.toLowerCase().includes(toFilter.toLowerCase()) ?? false);

      return fromMatch && toMatch;
    });
  }, [transfers, fromFilter, toFilter]);

  // Group filtered transfers by category
  const transfersByCategory = useMemo(() => {
    const grouped: Record<string, Transfer[]> = {};

    filteredTransfers.forEach((transfer) => {
      const category = transfer.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(transfer);
    });

    return grouped;
  }, [filteredTransfers]);

  // Filter sorted categories to only show those with results
  const visibleCategories = useMemo(() => {
    return sortedCategories.filter(
      (category) => transfersByCategory[category]?.length > 0
    );
  }, [sortedCategories, transfersByCategory]);

  const handleSwap = useCallback(() => {
    const temp = fromFilter;
    setFromFilter(toFilter);
    setToFilter(temp);
  }, [fromFilter, toFilter]);

  const handleClear = useCallback(() => {
    setFromFilter("");
    setToFilter("");
  }, []);

  const hasActiveFilters = fromFilter || toFilter;
  const hasResults = visibleCategories.length > 0;

  return (
    /* iOS Safari Fix: isolation-isolate creates proper stacking context for carousel gradients */
    <div className="space-y-8 py-12 isolation-isolate">
      {/* Filter Bar */}
      <TransferFilterBar
        fromValue={fromFilter}
        toValue={toFilter}
        onFromChange={setFromFilter}
        onToChange={setToFilter}
        onSwap={handleSwap}
        onClear={handleClear}
        fromOptions={fromOptions}
        toOptions={toOptions}
      />

      {/* Results or Empty State */}
      {hasResults ? (
        <div className="space-y-12">
          {visibleCategories.map((category) => {
            const categoryTransfers = transfersByCategory[category];
            const categoryLabel = categoryLabels[category];

            return (
              <HorizontalCardCarousel
                key={category}
                title={categoryLabel}
                subtitle={
                  hasActiveFilters
                    ? `${categoryTransfers.length} transfer${categoryTransfers.length !== 1 ? 's' : ''} found`
                    : "Swipe to explore comfortable private transfers"
                }
              >
                {categoryTransfers.map((transfer) => (
                  <CarouselCardWrapper key={transfer.id}>
                    <TransferCard transfer={transfer} />
                  </CarouselCardWrapper>
                ))}
              </HorizontalCardCarousel>
            );
          })}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title={
              hasActiveFilters
                ? "No transfers found"
                : "No transfers available"
            }
            description={
              hasActiveFilters
                ? `No transfers match "${fromFilter || 'Any'}" → "${toFilter || 'Any'}". Try adjusting your filters.`
                : "Check back soon for new transfer services."
            }
          />
        </div>
      )}
    </div>
  );
}
