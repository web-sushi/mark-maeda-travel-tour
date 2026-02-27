import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/stripe/create-checkout
 * Creates Stripe Checkout session for initial booking payment
 * Uses service role to fetch booking (bypasses RLS for guest checkout)
 * 
 * Input: { bookingId, publicViewToken, depositChoice }
 * Output: { ok: true, url: string } or { ok: false, error: string }
 */
export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { bookingId, publicViewToken, depositChoice } = body;

    console.log("[Stripe create-checkout] Request received:", {
      bookingId,
      hasToken: !!publicViewToken,
      depositChoice,
    });

    // Validate required fields
    if (!bookingId) {
      console.error("[Stripe create-checkout] Missing bookingId");
      return NextResponse.json(
        { ok: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    if (!publicViewToken) {
      console.error("[Stripe create-checkout] Missing publicViewToken");
      return NextResponse.json(
        { ok: false, error: "publicViewToken is required" },
        { status: 400 }
      );
    }

    if (!depositChoice || ![25, 50, 100].includes(depositChoice)) {
      console.error("[Stripe create-checkout] Invalid depositChoice:", depositChoice);
      return NextResponse.json(
        { ok: false, error: "depositChoice must be 25, 50, or 100" },
        { status: 400 }
      );
    }

    // Use service role to fetch booking (bypasses RLS)
    // This allows guest checkout to work
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    console.log("[Stripe create-checkout] Fetching booking:", bookingId);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[Stripe create-checkout] Booking not found:", {
        bookingId,
        error: bookingError?.message,
      });
      return NextResponse.json(
        { ok: false, error: "booking_not_found" },
        { status: 404 }
      );
    }

    console.log("[Stripe create-checkout] Booking found:", {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      totalAmount: booking.total_amount,
      customerEmail: booking.customer_email,
    });

    // JPY has no minor unit; amounts stored/sent as yen.
    // Calculate amount to charge (in yen)
    const amountToCharge = Math.round((booking.total_amount * depositChoice) / 100);

    if (amountToCharge <= 0) {
      console.error("[Stripe create-checkout] Invalid amount:", amountToCharge);
      return NextResponse.json(
        { ok: false, error: "Invalid deposit amount calculated" },
        { status: 400 }
      );
    }

    console.log("[Stripe create-checkout] Creating Stripe session:", {
      amount: amountToCharge,
      depositChoice,
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
              name: `Booking Deposit (${depositChoice}%) - ${booking.reference_code}`,
              description: `Deposit payment for booking ${booking.reference_code}`,
            },
            unit_amount: amountToCharge,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        booking_id: booking.id,
        pay_percent: depositChoice.toString(),
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          pay_percent: depositChoice.toString(),
        },
      },
      success_url: `${siteUrl}/booking/success?bookingId=${booking.id}&t=${publicViewToken}`,
      cancel_url: `${siteUrl}/booking/success?bookingId=${booking.id}&t=${publicViewToken}`,
    });

    console.log("[Stripe create-checkout] Session created successfully:", {
      sessionId: session.id,
      bookingId: booking.id,
      depositChoice,
      amount: amountToCharge,
      url: session.url,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("[Stripe create-checkout] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
}
