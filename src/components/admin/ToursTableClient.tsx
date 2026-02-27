"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

import { getLowestVehicleRate } from "@/types/vehicle";

interface Tour {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  duration_hours: number | null;
  base_price_jpy: number | null;
  vehicle_rates: any;
  status: string | null;
  display_order: number | null;
  created_at: string;
  is_featured: boolean | null;
  featured_rank: number | null;
}

interface ToursTableClientProps {
  initialTours: Tour[];
}

export default function ToursTableClient({ initialTours }: ToursTableClientProps) {
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [undoState, setUndoState] = useState<{
    id: string;
    previousStatus: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTours = includeArchived
    ? tours
    : tours.filter((tour) => tour.status !== "archived");

  // Sort: featured first, then by featured_rank ascending
  const sortedTours = [...filteredTours].sort((a, b) => {
    // Featured tours come first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    // If both featured, sort by rank (lower first)
    if (a.is_featured && b.is_featured) {
      const rankA = a.featured_rank ?? 999999;
      const rankB = b.featured_rank ?? 999999;
      return rankA - rankB;
    }
    // Otherwise maintain original order
    return 0;
  });

  useEffect(() => {
    if (undoState) {
      const timer = setTimeout(() => {
        setUndoState(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleArchive = async (tour: Tour) => {
    if (!confirm("Archive this item?")) return;

    const previousStatus = tour.status || "active";
    const newStatus = "archived";

    // Optimistic update
    setTours(
      tours.map((t) => (t.id === tour.id ? { ...t, status: newStatus } : t))
    );
    setUndoState({ id: tour.id, previousStatus });

    try {
      const { error } = await supabase
        .from("tours")
        .update({ status: newStatus })
        .eq("id", tour.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setTours(
        tours.map((t) => (t.id === tour.id ? { ...t, status: previousStatus } : t))
      );
      setError(err instanceof Error ? err.message : "Failed to archive tour");
      setUndoState(null);
    }
  };

  const handleRestore = async (tour: Tour) => {
    const previousStatus = "active";
    const newStatus = "active";

    // Optimistic update
    setTours(
      tours.map((t) => (t.id === tour.id ? { ...t, status: newStatus } : t))
    );

    try {
      const { error } = await supabase
        .from("tours")
        .update({ status: newStatus })
        .eq("id", tour.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setTours(
        tours.map((t) => (t.id === tour.id ? { ...t, status: tour.status } : t))
      );
      setError(err instanceof Error ? err.message : "Failed to restore tour");
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    const tour = tours.find((t) => t.id === undoState.id);
    if (!tour) return;

    // Optimistic update
    setTours(
      tours.map((t) =>
        t.id === undoState.id ? { ...t, status: undoState.previousStatus } : t
      )
    );

    try {
      const { error } = await supabase
        .from("tours")
        .update({ status: undoState.previousStatus })
        .eq("id", undoState.id);

      if (error) throw error;
      setUndoState(null);
    } catch (err) {
      // Revert on error
      setTours(
        tours.map((t) => (t.id === undoState.id ? { ...t, status: tour.status } : t))
      );
      setError(err instanceof Error ? err.message : "Failed to undo archive");
      setUndoState(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {undoState && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-blue-800">Archived. Undo (10s)</span>
          <button
            onClick={handleUndo}
            className="px-3 py-1 text-sm border border-blue-300 rounded hover:bg-blue-100"
          >
            Undo
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Include archived</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Region
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Duration (hours)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                From Price
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Featured
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTours.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No tours found
                </td>
              </tr>
            ) : (
              sortedTours.map((tour) => (
                <tr
                  key={tour.id}
                  className={`hover:bg-gray-50 ${
                    tour.status === "archived" ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {tour.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {tour.region || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {tour.duration_hours ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {(() => {
                      const lowestRate = getLowestVehicleRate(tour.vehicle_rates);
                      return lowestRate !== null
                        ? `¥${lowestRate.toLocaleString()}`
                        : "—";
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {tour.is_featured ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {tour.is_featured ? (tour.featured_rank ?? 0) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tour.status === "active"
                          ? "bg-green-100 text-green-800"
                          : tour.status === "off_season"
                          ? "bg-yellow-100 text-yellow-800"
                          : tour.status === "archived"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tour.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/tours/${tour.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      {tour.status === "archived" ? (
                        <button
                          onClick={() => handleRestore(tour)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(tour)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
