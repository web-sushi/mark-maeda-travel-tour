"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatBookingItemDate } from "@/lib/admin/date-formatters";
import { BookingItemRow } from "@/types/booking";

interface Booking {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_email: string;
  travel_date: string | null;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  items: any;
  created_at: string;
  booking_items?: BookingItemRow[];
}

interface ItemTitlesMap {
  tour: Record<string, string>;
  transfer: Record<string, string>;
  package: Record<string, string>;
}

interface BookingsTableClientProps {
  initialBookings: Booking[];
  itemTitlesMap: ItemTitlesMap;
}

export default function BookingsTableClient({
  initialBookings,
  itemTitlesMap,
}: BookingsTableClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCancelled, setShowCancelled] = useState<boolean>(false);
  const [undoState, setUndoState] = useState<{
    id: string;
    previousStatus: string;
  } | null>(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  // Helper to get formatted date for a booking
  const getBookingDisplayDate = (booking: Booking): string => {
    // If we have booking_items with dates, use the first one
    if (booking.booking_items && booking.booking_items.length > 0) {
      const firstItem = booking.booking_items[0];
      return formatBookingItemDate({
        travel_date: firstItem.travel_date,
        start_date: firstItem.start_date,
        end_date: firstItem.end_date,
      });
    }
    
    // Fallback to booking.travel_date if no items
    if (booking.travel_date) {
      try {
        return new Date(booking.travel_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } catch {
        return "—";
      }
    }
    
    return "—";
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.reference_code.toLowerCase().includes(query) ||
          booking.customer_name.toLowerCase().includes(query) ||
          booking.customer_email.toLowerCase().includes(query)
      );
    }

    // Apply booking status filter
    if (bookingStatusFilter !== "All") {
      filtered = filtered.filter(
        (booking) => booking.booking_status === bookingStatusFilter
      );
    } else {
      // If filter is "All" and showCancelled is false, exclude cancelled
      if (!showCancelled) {
        filtered = filtered.filter(
          (booking) => booking.booking_status !== "cancelled"
        );
      }
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "All") {
      filtered = filtered.filter(
        (booking) => booking.payment_status === paymentStatusFilter
      );
    }

    return filtered;
  }, [bookings, searchQuery, bookingStatusFilter, paymentStatusFilter, showCancelled]);

  // Helper function to get item display text
  const getItemDisplayText = (item: any): string => {
    if (item.title) {
      return item.title;
    }
    const map = itemTitlesMap[item.type as keyof ItemTitlesMap];
    if (map && item.id && map[item.id]) {
      return map[item.id];
    }
    // Fallback
    return `${item.type} (${item.id?.substring(0, 8) || "unknown"})`;
  };

  // Helper function to render items summary
  const renderItemsSummary = (items: any[]): string => {
    if (!Array.isArray(items) || items.length === 0) {
      return "No items";
    }

    const displayItems = items.slice(0, 2).map((item) => getItemDisplayText(item));
    let result = displayItems.join(", ");

    if (items.length > 2) {
      result += ` +${items.length - 2} more`;
    }

    return result;
  };

  useEffect(() => {
    if (undoState) {
      setUndoTimeLeft(10);
      const interval = setInterval(() => {
        setUndoTimeLeft((prev) => {
          if (prev <= 1) {
            setUndoState(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [undoState]);

  const handleCancel = async (booking: Booking) => {
    if (!confirm("Cancel this booking?")) return;

    const previousStatus = booking.booking_status || "pending";
    const newStatus = "cancelled";

    // Optimistic update
    setBookings(
      bookings.map((b) =>
        b.id === booking.id ? { ...b, booking_status: newStatus } : b
      )
    );
    setUndoState({ id: booking.id, previousStatus });

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: newStatus })
        .eq("id", booking.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setBookings(
        bookings.map((b) =>
          b.id === booking.id ? { ...b, booking_status: previousStatus } : b
        )
      );
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
      setUndoState(null);
    }
  };

  const handleReopen = async (booking: Booking) => {
    const newStatus = "pending";

    // Optimistic update
    setBookings(
      bookings.map((b) =>
        b.id === booking.id ? { ...b, booking_status: newStatus } : b
      )
    );

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: newStatus })
        .eq("id", booking.id);

      if (error) throw error;
    } catch (err) {
      // Revert on error
      setBookings(
        bookings.map((b) =>
          b.id === booking.id ? { ...b, booking_status: booking.booking_status } : b
        )
      );
      setError(err instanceof Error ? err.message : "Failed to reopen booking");
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    const booking = bookings.find((b) => b.id === undoState.id);
    if (!booking) return;

    // Optimistic update
    setBookings(
      bookings.map((b) =>
        b.id === undoState.id ? { ...b, booking_status: undoState.previousStatus } : b
      )
    );

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_status: undoState.previousStatus })
        .eq("id", undoState.id);

      if (error) throw error;
      setUndoState(null);
    } catch (err) {
      // Revert on error
      setBookings(
        bookings.map((b) =>
          b.id === undoState.id ? { ...b, booking_status: booking.booking_status } : b
        )
      );
      setError(err instanceof Error ? err.message : "Failed to undo cancel");
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
          <span className="text-blue-800">Cancelled. Undo ({undoTimeLeft}s)</span>
          <button
            onClick={handleUndo}
            className="px-3 py-1 text-sm border border-blue-300 rounded hover:bg-blue-100"
          >
            Undo
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by ref code, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Booking Status Filter */}
          <div>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="All">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Show Cancelled Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="rounded border-gray-300"
                disabled={bookingStatusFilter === "cancelled"}
              />
              <span className="text-sm text-gray-700">
                Show cancelled
                {bookingStatusFilter === "cancelled" && (
                  <span className="text-xs text-gray-500 ml-1">(filtered)</span>
                )}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Travel Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Ref Code
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Items
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Paid
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Remaining
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Booking Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Payment Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const items = Array.isArray(booking.items) ? booking.items : [];
                return (
                  <tr
                    key={booking.id}
                    className={`hover:bg-gray-50 ${
                      booking.booking_status === "cancelled" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {getBookingDisplayDate(booking)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b font-mono">
                      {booking.reference_code}
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div>
                        <div className="text-gray-900 font-medium">
                          {booking.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      <div className="max-w-xs">
                        {renderItemsSummary(items)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {formatCurrency(booking.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {formatCurrency(booking.amount_paid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">
                      {formatCurrency(booking.remaining_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.booking_status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.booking_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.booking_status === "cancelled"
                            ? "bg-gray-100 text-gray-800"
                            : booking.booking_status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.booking_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : booking.payment_status === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.payment_status === "refunded"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                        {booking.booking_status === "cancelled" ? (
                          <button
                            onClick={() => handleReopen(booking)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCancel(booking)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Cancel
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
