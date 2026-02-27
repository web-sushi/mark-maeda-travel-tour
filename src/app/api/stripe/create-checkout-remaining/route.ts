import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/stripe/create-checkout-remaining
 * Creates Stripe Checkout session for remaining balance payment
 * Uses service role to fetch booking (bypasses RLS)
 * 
 * Input: { bookingId }
 * Output: { ok: true, url: string } or { ok: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { bookingId } = body;

    console.log("[Stripe create-checkout-remaining] Request received:", { bookingId });

    // Validate required fields
    if (!bookingId) {
      console.error("[Stripe create-checkout-remaining] Missing bookingId");
      return NextResponse.json(
        { ok: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Use service role to fetch booking (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    console.log("[Stripe create-checkout-remaining] Fetching booking:", bookingId);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[Stripe create-checkout-remaining] Booking not found:", {
        bookingId,
        error: bookingError?.message,
      });
      return NextResponse.json(
        { ok: false, error: "booking_not_found" },
        { status: 404 }
      );
    }

    console.log("[Stripe create-checkout-remaining] Booking found:", {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      remainingAmount: booking.remaining_amount,
      bookingStatus: booking.booking_status,
    });

    // Validate remaining amount > 0
    if (booking.remaining_amount <= 0) {
      console.error("[Stripe create-checkout-remaining] No remaining balance");
      return NextResponse.json(
        { ok: false, error: "No remaining balance to pay" },
        { status: 400 }
      );
    }

    // Validate booking is not cancelled
    if (booking.booking_status === "cancelled") {
      console.error("[Stripe create-checkout-remaining] Booking cancelled");
      return NextResponse.json(
        { ok: false, error: "Cannot pay for cancelled booking" },
        { status: 400 }
      );
    }

    // JPY has no minor unit; amount is already in yen
    const amountToCharge = Math.round(booking.remaining_amount);

    if (amountToCharge <= 0) {
      console.error("[Stripe create-checkout-remaining] Invalid amount:", amountToCharge);
      return NextResponse.json(
        { ok: false, error: "Invalid remaining amount" },
        { status: 400 }
      );
    }

    console.log("[Stripe create-checkout-remaining] Creating Stripe session:", {
      amount: amountToCharge,
      referenceCode: booking.reference_code,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      client_reference_id: booking.id, // For webhook lookup
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `Remaining Balance - ${booking.reference_code}`,
              description: `Final payment for booking ${booking.reference_code}`,
            },
            unit_amount: amountToCharge,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        booking_id: booking.id,
        pay_type: "remaining",
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          pay_type: "remaining",
        },
      },
      success_url: `${siteUrl}/booking/success?bookingId=${booking.id}`,
      cancel_url: `${siteUrl}/booking/track?bookingId=${booking.id}`,
    });

    console.log("[Stripe create-checkout-remaining] Session created successfully:", {
      sessionId: session.id,
      bookingId: booking.id,
      amount: amountToCharge,
      referenceCode: booking.reference_code,
      url: session.url,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("[Stripe create-checkout-remaining] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
}
