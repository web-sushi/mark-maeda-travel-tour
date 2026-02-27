"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Booking } from "@/types/booking";
import type { SafeBookingEvent } from "@/types/tracking";

interface TrackBookingFormProps {
  initialRef?: string;
  onResult: (result: {
    booking?: Booking;
    events?: SafeBookingEvent[];
    error?: string;
  }) => void;
}

export default function TrackBookingForm({
  initialRef = "",
  onResult,
}: TrackBookingFormProps) {
  const [referenceCode, setReferenceCode] = useState(initialRef);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/booking/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: referenceCode.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        onResult({ error: data.error || "not_found" });
      } else {
        onResult({
          booking: data.booking,
          events: data.events,
        });
      }
    } catch (error) {
      console.error("Error tracking booking:", error);
      onResult({ error: "network_error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="referenceCode"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Reference Code
        </label>
        <input
          type="text"
          id="referenceCode"
          value={referenceCode}
          onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
          placeholder="ABC123XYZ"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Searching..." : "Track Booking"}
      </Button>
    </form>
  );
}
