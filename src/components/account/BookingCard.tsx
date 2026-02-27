"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Booking {
  id: string;
  reference_code: string;
  customer_name: string;
  travel_date: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
}

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();
  const [paymentLoading, setPaymentLoading] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
  };

  const handlePayRemaining = async () => {
    setPaymentLoading(true);

    try {
      const response = await fetch("/api/stripe/create-checkout-remaining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("No checkout URL received");
      }

      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {booking.customer_name}
          </h3>
          <p className="text-sm text-gray-600 font-mono">
            Ref: {booking.reference_code}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Travel Date: {formatDate(booking.travel_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              statusColors[booking.booking_status as keyof typeof statusColors]
            }`}
          >
            {booking.booking_status.toUpperCase()}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              paymentStatusColors[
                booking.payment_status as keyof typeof paymentStatusColors
              ]
            }`}
          >
            {booking.payment_status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(booking.total_amount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount Paid</span>
          <span className="text-green-600 font-medium">
            {formatCurrency(booking.amount_paid)}
          </span>
        </div>
        {booking.remaining_amount > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-gray-900 font-semibold">
              Remaining Balance
            </span>
            <span className="text-red-600 font-bold">
              {formatCurrency(booking.remaining_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/account/bookings/${booking.id}`)
          }
          className="flex-1"
        >
          View Details
        </Button>
        {booking.remaining_amount > 0 &&
          booking.payment_status !== "paid" &&
          booking.booking_status !== "cancelled" && (
            <Button
              onClick={handlePayRemaining}
              disabled={paymentLoading}
              className="flex-1"
            >
              {paymentLoading
                ? "Processing..."
                : `Pay Remaining (${formatCurrency(
                    booking.remaining_amount
                  )})`}
            </Button>
          )}
      </div>
    </div>
  );
}
