"use client";

import { useState } from "react";
import BookingItemCard from "./BookingItemCard";
import type { Booking, BookingItem } from "@/types/booking";
import type { SafeBookingEvent } from "@/types/tracking";

interface BookingDetailsProps {
  booking: Booking;
  events: SafeBookingEvent[];
}

export default function BookingDetails({
  booking,
  events,
}: BookingDetailsProps) {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const paymentStatusColors = {
    unpaid: "bg-red-100 text-red-800 border-red-200",
    partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    refunded: "bg-gray-100 text-gray-800 border-gray-200",
    payment_failed: "bg-red-100 text-red-800 border-red-200",
  };

  const formatVehicleSelection = (item: BookingItem) => {
    if (!item.vehicleSelection) return null;
    const parts: string[] = [];
    Object.entries(item.vehicleSelection).forEach(([key, count]) => {
      if (count > 0) {
        parts.push(`${key} x${count}`);
      }
    });
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const handlePayRemaining = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-remaining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        // Display the detailed error message from the API
        const errorMessage = data.message || data.error || "Failed to create payment session";
        console.error("[BookingDetails] Payment error:", {
          status: response.status,
          error: data.error,
          message: data.message,
          type: data.type,
          code: data.code,
        });
        throw new Error(errorMessage);
      }

      if (!data.url) {
        throw new Error("No checkout URL received. Please try again.");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("[BookingDetails] Error initiating payment:", err);
      setPaymentError(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Status Badges */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">
              Ref: {booking.reference_code}
            </p>
          </div>
          <div className="flex gap-3">
            <div
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                statusColors[booking.booking_status]
              }`}
            >
              {booking.booking_status.toUpperCase()}
            </div>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                paymentStatusColors[booking.payment_status]
              }`}
            >
              {booking.payment_status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Travel Date</p>
            <p className="text-gray-900 font-medium">{formatDate(booking.travel_date)}</p>
          </div>
          {booking.pickup_location && (
            <div>
              <p className="text-sm text-gray-600">Pickup Location</p>
              <p className="text-gray-900">{booking.pickup_location}</p>
            </div>
          )}
          {booking.dropoff_location && (
            <div>
              <p className="text-sm text-gray-600">Dropoff Location</p>
              <p className="text-gray-900">{booking.dropoff_location}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Passengers</p>
            <p className="text-gray-900">
              {booking.passengers_count ? `${booking.passengers_count} passengers` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Large Suitcases</p>
            <p className="text-gray-900">
              {booking.large_suitcases ? `${booking.large_suitcases} suitcases` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      {booking.items && booking.items.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Booking Items ({booking.items.length})
          </h3>
          <div className="space-y-4">
            {booking.items.map((item: any, index: number) => (
              <BookingItemCard key={item.id || index} item={item} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h3>
        
        {paymentError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {paymentError}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-gray-900 font-semibold">
              {formatCurrency(booking.total_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid</span>
            <span className="text-green-600 font-medium">
              {formatCurrency(booking.amount_paid)}
            </span>
          </div>
          {booking.remaining_amount > 0 ? (
            <>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-900 font-semibold">Remaining Balance</span>
                <span className="text-red-600 font-bold">
                  {formatCurrency(booking.remaining_amount)}
                </span>
              </div>
              
              {/* Pay Remaining Balance Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handlePayRemaining}
                  disabled={paymentLoading || booking.booking_status === "cancelled"}
                  className="w-full px-6 py-3 bg-[#E4005A] text-white font-semibold rounded-lg hover:bg-[#C4004A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading
                    ? "Processing..."
                    : `Pay Remaining Balance (${formatCurrency(booking.remaining_amount)})`}
                </button>
                {booking.booking_status === "cancelled" && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Cannot pay for cancelled booking
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Fully Paid</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Timeline */}
      {events && events.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {events.map((event: SafeBookingEvent, index: number) => (
              <div key={index} className="border-l-2 border-gray-300 pl-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {event.summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
