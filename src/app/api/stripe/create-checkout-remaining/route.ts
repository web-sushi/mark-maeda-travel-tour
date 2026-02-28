import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/stripe/create-checkout-remaining
 * Creates Stripe Checkout session for remaining balance payment
 * Uses service role to fetch booking (bypasses RLS)
 * 
 * Input: { bookingId }
 * Output: { ok: true, url: string } or { ok: false, error: string, message: string, type?: string, code?: string, raw?: any }
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  
  try {
    const body = await request.json();
    const { bookingId } = body;

    console.log("[Stripe create-checkout-remaining] Request received:", { bookingId });

    // Validate required fields
    if (!bookingId) {
      console.error("[Stripe create-checkout-remaining] Missing bookingId");
      return NextResponse.json(
        { 
          ok: false, 
          error: "missing_booking_id",
          message: "Booking ID is required"
        },
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
      .select("*, public_view_token")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("[Stripe create-checkout-remaining] Booking not found:", {
        bookingId,
        error: bookingError?.message,
      });
      return NextResponse.json(
        { 
          ok: false, 
          error: "booking_not_found",
          message: "Booking not found. Please verify your booking reference."
        },
        { status: 404 }
      );
    }

    console.log("[Stripe create-checkout-remaining] Booking found:", {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      remainingAmount: booking.remaining_amount,
      bookingStatus: booking.booking_status,
      hasToken: !!booking.public_view_token,
    });

    // Validate remaining amount > 0
    if (booking.remaining_amount <= 0) {
      console.error("[Stripe create-checkout-remaining] No remaining balance");
      return NextResponse.json(
        { 
          ok: false, 
          error: "no_balance",
          message: "No remaining balance to pay. Your booking is already paid in full."
        },
        { status: 400 }
      );
    }

    // Validate booking is not cancelled
    if (booking.booking_status === "cancelled") {
      console.error("[Stripe create-checkout-remaining] Booking cancelled");
      return NextResponse.json(
        { 
          ok: false, 
          error: "booking_cancelled",
          message: "Cannot process payment for a cancelled booking."
        },
        { status: 400 }
      );
    }

    // JPY has no minor unit; amount is already in yen
    const amountToCharge = Math.round(booking.remaining_amount);

    if (amountToCharge <= 0) {
      console.error("[Stripe create-checkout-remaining] Invalid amount:", amountToCharge);
      return NextResponse.json(
        { 
          ok: false, 
          error: "invalid_amount",
          message: "Invalid remaining amount calculated. Please contact support."
        },
        { status: 400 }
      );
    }

    // Build success and cancel URLs with access token
    const token = booking.public_view_token;
    const successUrl = token
      ? `${siteUrl}/booking/success?bookingId=${booking.id}&t=${token}`
      : `${siteUrl}/booking/success?bookingId=${booking.id}`;
    const cancelUrl = token
      ? `${siteUrl}/booking/track?bookingId=${booking.id}&t=${token}`
      : `${siteUrl}/booking/track?bookingId=${booking.id}`;

    // Stripe environment mode
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test";

    console.log("[Stripe create-checkout-remaining] Creating Stripe session:", {
      mode: stripeMode,
      amount: amountToCharge,
      currency: "jpy",
      referenceCode: booking.reference_code,
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      hasToken: !!token,
      metadata: {
        booking_id: booking.id,
        pay_type: "remaining",
      },
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
        bookingId: booking.id, // Duplicate for compatibility
        pay_type: "remaining",
        paymentType: "remaining", // Duplicate for compatibility
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          bookingId: booking.id,
          pay_type: "remaining",
          paymentType: "remaining",
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("[Stripe create-checkout-remaining] ✅ Session created successfully:", {
      sessionId: session.id,
      bookingId: booking.id,
      amount: amountToCharge,
      referenceCode: booking.reference_code,
      url: session.url,
      mode: stripeMode,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("[Stripe create-checkout-remaining] ❌ Error:", error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      const stripeError = error as Stripe.errors.StripeError;
      
      console.error("[Stripe create-checkout-remaining] Stripe error details:", {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "stripe_error",
          message: stripeError.message || "Payment processing error. Please try again.",
          type: stripeError.type,
          code: stripeError.code,
          raw: {
            statusCode: stripeError.statusCode,
            requestId: stripeError.requestId,
          },
        },
        { status: stripeError.statusCode || 500 }
      );
    }

    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    console.error("[Stripe create-checkout-remaining] Generic error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "checkout_creation_failed",
        message: "Failed to create payment session. Please try again or contact support.",
        raw: {
          details: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
