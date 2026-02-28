import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/stripe/create-checkout
 * Creates Stripe Checkout session for initial booking payment
 * Uses service role to fetch booking (bypasses RLS for guest checkout)
 * 
 * Input: { bookingId, publicViewToken, depositChoice }
 * Output: { ok: true, url: string } or { ok: false, error: string, message: string, type?: string, code?: string, raw?: any }
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  
  try {
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
        { 
          ok: false, 
          error: "missing_booking_id",
          message: "Booking ID is required"
        },
        { status: 400 }
      );
    }

    if (!publicViewToken) {
      console.error("[Stripe create-checkout] Missing publicViewToken");
      return NextResponse.json(
        { 
          ok: false, 
          error: "missing_token",
          message: "Public view token is required"
        },
        { status: 400 }
      );
    }

    if (!depositChoice || ![25, 50, 100].includes(depositChoice)) {
      console.error("[Stripe create-checkout] Invalid depositChoice:", depositChoice);
      return NextResponse.json(
        { 
          ok: false, 
          error: "invalid_deposit_choice",
          message: "Deposit choice must be 25%, 50%, or 100%"
        },
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
        { 
          ok: false, 
          error: "booking_not_found",
          message: "Booking not found. Please verify your booking reference."
        },
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
        { 
          ok: false, 
          error: "invalid_amount",
          message: "Invalid deposit amount calculated. Please contact support."
        },
        { status: 400 }
      );
    }

    // Build URLs
    const successUrl = `${siteUrl}/booking/success?bookingId=${booking.id}&t=${publicViewToken}`;
    const cancelUrl = `${siteUrl}/booking/success?bookingId=${booking.id}&t=${publicViewToken}`;

    // Stripe environment mode
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test";

    console.log("[Stripe create-checkout] Creating Stripe session:", {
      mode: stripeMode,
      amount: amountToCharge,
      currency: "jpy",
      depositChoice: `${depositChoice}%`,
      referenceCode: booking.reference_code,
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        booking_id: booking.id,
        pay_type: "deposit",
        pay_percent: depositChoice,
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
        bookingId: booking.id, // Duplicate for compatibility
        pay_percent: depositChoice.toString(),
        pay_type: "deposit",
        paymentType: "deposit", // Duplicate for compatibility
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          bookingId: booking.id,
          pay_percent: depositChoice.toString(),
          pay_type: "deposit",
          paymentType: "deposit",
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("[Stripe create-checkout] ✅ Session created successfully:", {
      sessionId: session.id,
      bookingId: booking.id,
      depositChoice,
      amount: amountToCharge,
      url: session.url,
      mode: stripeMode,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("[Stripe create-checkout] ❌ Error:", error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      const stripeError = error as Stripe.errors.StripeError;
      
      console.error("[Stripe create-checkout] Stripe error details:", {
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
    
    console.error("[Stripe create-checkout] Generic error:", {
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
