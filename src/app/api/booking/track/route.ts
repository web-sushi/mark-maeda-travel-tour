import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Generate human-friendly summary from event type and payload
 * Returns a safe, public-appropriate description
 */
function getEventSummary(eventType: string, payload: any): string {
  // Map event types to friendly descriptions
  const summaries: Record<string, string> = {
    email_sent_booking_created: "Booking confirmation email sent",
    email_sent_booking_confirmed: "Booking confirmed notification sent",
    email_sent_payment_marked_paid: "Payment confirmation email sent",
    email_sent_booking_cancelled: "Cancellation notification sent",
    booking_created: "Booking created",
    booking_confirmed: "Booking confirmed by admin",
    booking_cancelled: "Booking cancelled",
    payment_received: "Payment received",
    payment_marked_paid: "Payment marked as paid",
    admin_note_added: "Admin added a note",
    status_updated: "Status updated",
  };

  // Return friendly summary or fallback to formatted event type
  return (
    summaries[eventType] ||
    eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * POST /api/booking/track
 * Secure server-side booking lookup (bypasses RLS)
 * Requires both reference code and email to verify ownership
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceCode, email } = body;

    // Validate inputs
    if (!referenceCode || typeof referenceCode !== "string") {
      return NextResponse.json(
        { ok: false, error: "missing_reference_code" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "missing_email" },
        { status: 400 }
      );
    }

    // Create admin client (server-only, bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { ok: false, error: "server_error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Fetch booking by reference code AND email (security: verify ownership)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        reference_code,
        customer_name,
        customer_email,
        travel_date,
        pickup_location,
        dropoff_location,
        passengers_count,
        large_suitcases,
        items,
        total_amount,
        amount_paid,
        remaining_amount,
        booking_status,
        payment_status,
        created_at,
        updated_at
      `
      )
      .eq("reference_code", referenceCode.trim().toUpperCase())
      .eq("customer_email", email.trim().toLowerCase())
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    // Fetch related events (last 20, most recent first)
    const { data: rawEvents, error: eventsError } = await supabase
      .from("booking_events")
      .select("id, event_type, event_payload, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      // Non-blocking: continue without events
    }

    // Sanitize events: create human-friendly summaries without exposing raw payload
    const safeEvents = (rawEvents || []).map((event) => {
      const summary = getEventSummary(event.event_type, event.event_payload);
      return {
        event_type: event.event_type,
        created_at: event.created_at,
        summary,
      };
    });

    return NextResponse.json({
      ok: true,
      booking,
      events: safeEvents,
    });
  } catch (error) {
    console.error("Error in /api/booking/track:", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
