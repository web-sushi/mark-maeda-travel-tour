import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { reviewRequestCustomer } from "@/lib/email/templates";
import type { Booking } from "@/types/booking";
import type { BookingItem } from "@/types/review";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/review/request
 * Triggers review request email after booking completion
 * - Creates or reuses review_requests token
 * - Checks idempotency (don't send duplicate emails)
 * - Sends email with review link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid bookingId" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Check idempotency: has review request email already been sent?
    const { data: existingEvent } = await supabase
      .from("booking_events")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("event_type", "email_sent_review_request")
      .single();

    if (existingEvent) {
      return NextResponse.json({
        ok: true,
        message: "Review request email already sent",
      });
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Fetch booking items
    const { data: items, error: itemsError } = await supabase
      .from("booking_items")
      .select("id, title, item_type")
      .eq("booking_id", bookingId);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { error: "No booking items found" },
        { status: 404 }
      );
    }

    // Create or reuse review_requests token
    let token: string;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Check for existing unused token
    const { data: existingToken } = await supabase
      .from("review_requests")
      .select("token")
      .eq("booking_id", bookingId)
      .is("used_at", null)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (existingToken) {
      token = existingToken.token;
    } else {
      // Generate new token
      token = generateToken();
      const { error: tokenError } = await supabase
        .from("review_requests")
        .insert({
          booking_id: bookingId,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error("Failed to create review token:", tokenError);
        return NextResponse.json(
          { error: "Failed to create review token" },
          { status: 500 }
        );
      }
    }

    // Build review link
    const reviewLink = `${siteUrl}/review?token=${token}`;

    // Prepare email
    const { subject, html, text } = reviewRequestCustomer(
      booking as Booking,
      items,
      reviewLink
    );

    // Send email
    try {
      await sendBrevoEmail({
        to: booking.customer_email,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error("Failed to send review request email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Record email sent event (idempotency marker)
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "email_sent_review_request",
      event_payload: {
        email: booking.customer_email,
        token,
        items_count: items.length,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Review request email sent",
    });
  } catch (error) {
    console.error("[review/request] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
