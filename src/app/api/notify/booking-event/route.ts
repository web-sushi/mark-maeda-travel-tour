// Server-only route: Send booking lifecycle event emails (confirm/paid/cancel/completed)
// Idempotent via booking_events table

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/email/brevo";
import {
  bookingConfirmedCustomer,
  paymentMarkedPaidCustomer,
  bookingCancelledCustomer,
  bookingCompletedCustomer,
} from "@/lib/email/templates";
import { Booking, BookingItemRow } from "@/types/booking";
import { getAppSettings } from "@/lib/settings/getAppSettings";
import type { EmailToggles } from "@/types/settings";

// Server-only Supabase admin client
function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// Normalised template signature: all templates accept (booking, items)
type TemplateFn = (
  booking: Booking,
  items: BookingItemRow[]
) => { subject: string; html: string; text?: string };

const ALLOWED_EVENT_TYPES = [
  "booking_confirmed",
  "payment_marked_paid",
  "booking_cancelled",
  "booking_completed",
] as const;

type AllowedEventType = (typeof ALLOWED_EVENT_TYPES)[number];

// Wrap templates that don't need items so they all share the same signature
const TEMPLATE_MAP: Record<AllowedEventType, TemplateFn> = {
  booking_confirmed: (booking, _items) => bookingConfirmedCustomer(booking),
  payment_marked_paid: (booking, _items) => paymentMarkedPaidCustomer(booking),
  booking_cancelled: (booking, _items) => bookingCancelledCustomer(booking),
  booking_completed: (booking, items) => bookingCompletedCustomer(booking, items),
};

const TOGGLE_MAP: Record<AllowedEventType, keyof EmailToggles> = {
  booking_confirmed: "booking_confirmed",
  payment_marked_paid: "payment_paid",
  booking_cancelled: "booking_cancelled",
  booking_completed: "booking_completed",
};

const EMAIL_LABELS: Record<AllowedEventType, string> = {
  booking_confirmed: "Booking Confirmed",
  payment_marked_paid: "Payment Received (Admin Manual)",
  booking_cancelled: "Booking Cancelled",
  booking_completed: "Tour/Transfer Completed",
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

    if (!ALLOWED_EVENT_TYPES.includes(eventType as AllowedEventType)) {
      return NextResponse.json({
        ok: false,
        error: `Invalid eventType: ${eventType}. Allowed: ${ALLOWED_EVENT_TYPES.join(", ")}`,
      });
    }

    const event = eventType as AllowedEventType;
    const supabase = getAdminClient();

    // Fetch booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      console.error(`[booking-event/${event}] Failed to fetch booking ${bookingId}:`, fetchError);
      return NextResponse.json({ ok: true, errorLogged: true });
    }

    const refCode = booking.reference_code || bookingId;

    console.log(`[booking-event/${event}] Processing:`, {
      emailType: EMAIL_LABELS[event],
      bookingId,
      referenceCode: refCode,
      customerEmail: booking.customer_email,
    });

    // Idempotency: prevent duplicate emails for the same event type
    const eventKey = `email_sent_${event}`;
    const { data: existingEvent } = await supabase
      .from("booking_events")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("event_type", eventKey)
      .single();

    if (existingEvent) {
      console.log(`[booking-event/${event}] Email already sent for booking ${refCode}, skipping`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Check email toggle in app settings
    const appSettings = await getAppSettings();
    const emailToggles = appSettings?.email_toggles || {};
    const toggleKey = TOGGLE_MAP[event];

    if (emailToggles[toggleKey] === false) {
      console.log(`[booking-event/${event}] Email disabled in settings (toggle: ${toggleKey}), skipping`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Fetch booking_items (needed for booking_completed template; passed to all for consistency)
    const { data: bookingItems, error: itemsError } = await supabase
      .from("booking_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.warn(`[booking-event/${event}] Could not fetch booking_items for ${refCode}:`, itemsError);
    }

    const items: BookingItemRow[] = bookingItems || [];

    // Build template
    const templateFn = TEMPLATE_MAP[event];
    const template = templateFn(booking as Booking, items);

    // Send email
    const recipient = booking.customer_email;
    console.log(`[booking-event/${event}] Sending "${EMAIL_LABELS[event]}" email:`, {
      to: recipient,
      bookingId,
      referenceCode: refCode,
      subject: template.subject,
      itemsCount: items.length,
    });

    try {
      await sendBrevoEmail({
        to: recipient,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      console.log(`[booking-event/${event}] ✅ Email sent to ${recipient} (ref: ${refCode})`);
    } catch (emailError) {
      console.error(`[booking-event/${event}] ❌ Failed to send email to ${recipient}:`, emailError);
      // Don't fail the response — log and continue
    }

    // Record idempotency event
    const { error: eventError } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: eventKey,
      event_payload: {
        email_type: EMAIL_LABELS[event],
        sent_to: recipient,
        reference_code: refCode,
        items_count: items.length,
      },
    });

    if (eventError) {
      console.error(`[booking-event/${event}] Failed to record booking event:`, eventError);
    }

    return NextResponse.json({
      ok: true,
      emailType: EMAIL_LABELS[event],
      sentTo: recipient,
      referenceCode: refCode,
    });
  } catch (error) {
    console.error("[booking-event] Unexpected error:", error);
    return NextResponse.json({ ok: true, errorLogged: true });
  }
}
