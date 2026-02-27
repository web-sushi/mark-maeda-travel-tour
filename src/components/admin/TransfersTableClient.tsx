"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getLowestVehicleRate } from "@/types/vehicle";

interface Transfer {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  from_area: string | null;
  to_area: string | null;
  base_price_jpy: number | null;
  vehicle_rates: any;
  status: string | null;
  display_order: number | null;
  created_at: string;
}

interface TransfersTableClientProps {
  initialTransfers: Transfer[];
}

export default function TransfersTableClient({
  initialTransfers,
}: TransfersTableClientProps) {
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [undoState, setUndoState] = useState<{
    id: string;
    previousStatus: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTransfers = includeArchived
    ? transfers
    : transfers.filter((transfer) => transfer.status !== "archived");

  useEffect(() => {
    if (undoState) {
      const timer = setTimeout(() => {
        setUndoState(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleArchive = async (transfer: Transfer) => {
    if (!confirm("Archive this item?")) return;

    const previousStatus = transfer.status || "active";
    const newStatus = "archived";

    // Optimistic update
    setTransfers(
      transfers.map((t) => (t.id === transfer.id ? { ...t, status: newStatus } : t))
    );
    setUndoState({ id: transfer.id, previousStatus });

    try {
      const { error } = await supabase
        .from("transfers")
        .update({ status: newStatus })
        .eq("id", transfer.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setTransfers(
        transfers.map((t) =>
          t.id === transfer.id ? { ...t, status: previousStatus } : t
        )
      );
      setError(err instanceof Error ? err.message : "Failed to archive transfer");
      setUndoState(null);
    }
  };

  const handleRestore = async (transfer: Transfer) => {
    const newStatus = "active";

    // Optimistic update
    setTransfers(
      transfers.map((t) => (t.id === transfer.id ? { ...t, status: newStatus } : t))
    );

    try {
      const { error } = await supabase
        .from("transfers")
        .update({ status: newStatus })
        .eq("id", transfer.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setTransfers(
        transfers.map((t) =>
          t.id === transfer.id ? { ...t, status: transfer.status } : t
        )
      );
      setError(err instanceof Error ? err.message : "Failed to restore transfer");
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    const transfer = transfers.find((t) => t.id === undoState.id);
    if (!transfer) return;

    // Optimistic update
    setTransfers(
      transfers.map((t) =>
        t.id === undoState.id ? { ...t, status: undoState.previousStatus } : t
      )
    );

    try {
      const { error } = await supabase
        .from("transfers")
        .update({ status: undoState.previousStatus })
        .eq("id", undoState.id);

      if (error) throw error;
      setUndoState(null);
    } catch (err) {
      // Revert on error
      setTransfers(
        transfers.map((t) =>
          t.id === undoState.id ? { ...t, status: transfer.status } : t
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
                Category
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                From → To
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
            {filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No transfers found
                </td>
              </tr>
            ) : (
              filteredTransfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  className={`hover:bg-gray-50 ${
                    transfer.status === "archived" ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {transfer.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {transfer.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {transfer.from_area && transfer.to_area
                      ? `${transfer.from_area} → ${transfer.to_area}`
                      : transfer.from_area || transfer.to_area || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {(() => {
                      const lowestRate = getLowestVehicleRate(transfer.vehicle_rates);
                      return lowestRate !== null
                        ? `¥${lowestRate.toLocaleString()}`
                        : "—";
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        transfer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : transfer.status === "off_season"
                          ? "bg-yellow-100 text-yellow-800"
                          : transfer.status === "archived"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {transfer.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/transfers/${transfer.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      {transfer.status === "archived" ? (
                        <button
                          onClick={() => handleRestore(transfer)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(transfer)}
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
