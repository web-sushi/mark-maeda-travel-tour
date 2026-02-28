"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import TrackBookingForm from "@/components/booking/TrackBookingForm";
import BookingDetails from "@/components/booking/BookingDetails";
import type { Booking } from "@/types/booking";
import type { SafeBookingEvent } from "@/types/tracking";

export default function TrackPageContent() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref") || "";

  const [result, setResult] = useState<{
    booking?: Booking;
    events?: SafeBookingEvent[];
    error?: string;
  } | null>(null);

  const handleResult = (newResult: {
    booking?: Booking;
    events?: SafeBookingEvent[];
    error?: string;
  }) => {
    setResult(newResult);
  };

  const errorMessages: Record<string, string> = {
    not_found:
      "We couldn't find that booking. Please check your reference code and email address.",
    missing_reference_code: "Please enter your booking reference code.",
    missing_email: "Please enter your email address.",
    network_error: "Network error. Please check your connection and try again.",
    server_error: "Server error. Please try again later.",
  };

  return (
    <div className="min-h-[100svh] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Track Your Booking
          </h1>
          <p className="text-lg text-gray-600">
            Enter your booking details to view your reservation status
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <TrackBookingForm initialRef={refFromUrl} onResult={handleResult} />
        </div>

        {/* Error State */}
        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-semibold mb-1">
                  Booking Not Found
                </h3>
                <p className="text-red-700">
                  {errorMessages[result.error] || errorMessages.server_error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success State - Booking Details */}
        {result?.booking && (
          <BookingDetails
            booking={result.booking}
            events={result.events || []}
          />
        )}

        {/* Help Text */}
        {!result?.booking && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Need help? Contact us with your booking reference code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
