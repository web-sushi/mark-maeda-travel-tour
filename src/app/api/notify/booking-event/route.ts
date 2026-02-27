// Server-only route: Send booking event emails (confirm/paid/cancel)
// Idempotent via booking_events

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/email/brevo";
import {
  bookingConfirmedCustomer,
  paymentMarkedPaidCustomer,
  bookingCancelledCustomer,
} from "@/lib/email/templates";
import { Booking } from "@/types/booking";
import { getAppSettings } from "@/lib/settings/getAppSettings";
import type { EmailToggles } from "@/types/settings";

// Server-only Supabase admin client (never expose to client)
function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

const ALLOWED_EVENT_TYPES = [
  "booking_confirmed",
  "payment_marked_paid",
  "booking_cancelled",
];

const TEMPLATE_MAP = {
  booking_confirmed: bookingConfirmedCustomer,
  payment_marked_paid: paymentMarkedPaidCustomer,
  booking_cancelled: bookingCancelledCustomer,
};

const TOGGLE_MAP: Record<string, keyof EmailToggles> = {
  booking_confirmed: "booking_confirmed",
  payment_marked_paid: "payment_paid",
  booking_cancelled: "booking_cancelled",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, eventType } = body;

    if (!bookingId || !eventType) {
      return NextResponse.json({
        ok: false,
        error: "Missing bookingId or eventType",
      });
    }

    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({
        ok: false,
        error: `Invalid eventType: ${eventType}`,
      });
    }

    const supabase = getAdminClient();

    // Fetch booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      console.error("Failed to fetch booking:", fetchError);
      return NextResponse.json({ ok: true, errorLogged: true });
    }

    // Idempotency check
    const eventKey = `email_sent_${eventType}`;
    const { data: existingEvent } = await supabase
      .from("booking_events")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("event_type", eventKey)
      .single();

    if (existingEvent) {
      console.log(`Email already sent for ${eventType}:`, bookingId);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Fetch app settings for email toggles
    const appSettings = await getAppSettings();
    const emailToggles = appSettings?.email_toggles || {};
    const toggleKey = TOGGLE_MAP[eventType];

    // Check if this email type is enabled
    if (emailToggles[toggleKey] === false) {
      console.log(`Email disabled for ${eventType} in settings, skipping`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Get template function
    const templateFn = TEMPLATE_MAP[eventType as keyof typeof TEMPLATE_MAP];
    if (!templateFn) {
      return NextResponse.json({
        ok: false,
        error: `No template for ${eventType}`,
      });
    }

    const sentTo: string[] = [];

    // Send customer email
    try {
      const template = templateFn(booking as Booking);
      await sendBrevoEmail({
        to: booking.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      sentTo.push(booking.customer_email);
      console.log(`Customer ${eventType} email sent:`, booking.customer_email);
    } catch (error) {
      console.error(`Failed to send ${eventType} email:`, error);
    }

    // Record event
    const { error: eventError } = await supabase
      .from("booking_events")
      .insert({
        booking_id: bookingId,
        event_type: eventKey,
        event_payload: { sent_to: sentTo },
      });

    if (eventError) {
      console.error("Failed to record booking event:", eventError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in booking-event notification:", error);
    return NextResponse.json({ ok: true, errorLogged: true });
  }
}
