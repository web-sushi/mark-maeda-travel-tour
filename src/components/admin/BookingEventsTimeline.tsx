"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { BookingEvent } from "@/types/booking";

interface BookingEventsTimelineProps {
  bookingId: string;
}

const EVENT_DESCRIPTIONS: Record<string, string> = {
  booking_confirmed: "Booking confirmed",
  booking_cancelled: "Booking cancelled",
  booking_completed: "Booking marked as completed",
  payment_marked_paid: "Payment marked as paid",
  booking_created: "Booking created",
  payment_received: "Payment received",
  status_updated: "Status updated",
};

export default function BookingEventsTimeline({
  bookingId,
}: BookingEventsTimelineProps) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error: fetchError } = await supabase
          .from("booking_events")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setEvents(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Timeline</h2>
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Timeline</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Timeline</h2>
        <p className="text-gray-600">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Timeline</h2>
      <div className="space-y-4">
        {events.map((event) => {
          const eventDate = new Date(event.created_at);
          const description =
            EVENT_DESCRIPTIONS[event.event_type] || event.event_type.replace(/_/g, " ");

          return (
            <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{description}</p>
                    {event.event_payload && Object.keys(event.event_payload).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(event.event_payload, null, 2)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {eventDate.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
