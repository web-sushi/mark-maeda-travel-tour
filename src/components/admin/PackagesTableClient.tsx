"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getLowestVehicleRate } from "@/types/vehicle";

interface Package {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  items: any;
  base_price_jpy: number | null;
  vehicle_rates: any;
  status: string | null;
  display_order: number | null;
  created_at: string;
}

interface PackagesTableClientProps {
  initialPackages: Package[];
}

export default function PackagesTableClient({
  initialPackages,
}: PackagesTableClientProps) {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [undoState, setUndoState] = useState<{
    id: string;
    previousStatus: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredPackages = includeArchived
    ? packages
    : packages.filter((pkg) => pkg.status !== "archived");

  useEffect(() => {
    if (undoState) {
      const timer = setTimeout(() => {
        setUndoState(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleArchive = async (pkg: Package) => {
    if (!confirm("Archive this item?")) return;

    const previousStatus = pkg.status || "active";
    const newStatus = "archived";

    // Optimistic update
    setPackages(
      packages.map((p) => (p.id === pkg.id ? { ...p, status: newStatus } : p))
    );
    setUndoState({ id: pkg.id, previousStatus });

    try {
      const { error } = await supabase
        .from("packages")
        .update({ status: newStatus })
        .eq("id", pkg.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setPackages(
        packages.map((p) => (p.id === pkg.id ? { ...p, status: previousStatus } : p))
      );
      setError(err instanceof Error ? err.message : "Failed to archive package");
      setUndoState(null);
    }
  };

  const handleRestore = async (pkg: Package) => {
    const newStatus = "active";

    // Optimistic update
    setPackages(
      packages.map((p) => (p.id === pkg.id ? { ...p, status: newStatus } : p))
    );

    try {
      const { error } = await supabase
        .from("packages")
        .update({ status: newStatus })
        .eq("id", pkg.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setPackages(
        packages.map((p) => (p.id === pkg.id ? { ...p, status: pkg.status } : p))
      );
      setError(err instanceof Error ? err.message : "Failed to restore package");
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    const pkg = packages.find((p) => p.id === undoState.id);
    if (!pkg) return;

    // Optimistic update
    setPackages(
      packages.map((p) =>
        p.id === undoState.id ? { ...p, status: undoState.previousStatus } : p
      )
    );

    try {
      const { error } = await supabase
        .from("packages")
        .update({ status: undoState.previousStatus })
        .eq("id", undoState.id);

      if (error) throw error;
      setUndoState(null);
    } catch (err) {
      // Revert on error
      setPackages(
        packages.map((p) =>
          p.id === undoState.id ? { ...p, status: pkg.status } : p
        )
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
                Items count
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                From Price
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
            {filteredPackages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No packages found
                </td>
              </tr>
            ) : (
              filteredPackages.map((pkg) => {
                const itemsCount = Array.isArray(pkg.items) ? pkg.items.length : 0;
                return (
                  <tr
                    key={pkg.id}
                    className={`hover:bg-gray-50 ${
                      pkg.status === "archived" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {pkg.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {pkg.region || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {itemsCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {(() => {
                        const lowestRate = getLowestVehicleRate(pkg.vehicle_rates);
                        return lowestRate !== null
                          ? `¥${lowestRate.toLocaleString()}`
                          : "—";
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          pkg.status === "active"
                            ? "bg-green-100 text-green-800"
                            : pkg.status === "off_season"
                            ? "bg-yellow-100 text-yellow-800"
                            : pkg.status === "archived"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/packages/${pkg.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                        {pkg.status === "archived" ? (
                          <button
                            onClick={() => handleRestore(pkg)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(pkg)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
