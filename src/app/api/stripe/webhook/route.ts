import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Stripe Webhook Handler
 * Handles checkout.session.completed events
 * Updates booking payment amounts with idempotency
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    
    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Missing webhook secret configuration" },
        { status: 500 }
      );
    }

    // Get raw body text for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract booking ID from metadata or client_reference_id
      const bookingId = session.metadata?.booking_id || session.client_reference_id;
      const payPercent = session.metadata?.pay_percent;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      console.log(`[Stripe Webhook] checkout.session.completed:`, {
        sessionId: session.id,
        bookingId,
        payPercent,
        paymentIntentId,
        amountTotal: session.amount_total,
      });

      if (!bookingId) {
        console.error("[Stripe Webhook] No bookingId found in session metadata or client_reference_id");
        return NextResponse.json({ received: true, error: "Missing bookingId" });
      }

      if (!paymentIntentId) {
        console.error("[Stripe Webhook] No payment_intent found in session");
        return NextResponse.json({ received: true, error: "Missing payment_intent" });
      }

      // Use service role client to bypass RLS
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      // Check idempotency: has this payment_intent already been recorded?
      const { data: existingEvent, error: eventCheckError } = await supabase
        .from("booking_events")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("event_type", "stripe_payment_recorded")
        .contains("event_payload", { payment_intent_id: paymentIntentId })
        .single();

      if (existingEvent) {
        console.log(`[Stripe Webhook] Payment already recorded for booking ${bookingId}, payment_intent ${paymentIntentId}`);
        return NextResponse.json({ received: true, message: "Already processed" });
      }

      // Fetch booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError || !booking) {
        console.error("[Stripe Webhook] Booking not found:", bookingError);
        return NextResponse.json({ received: true, error: "Booking not found" });
      }

      // JPY has no minor unit - amount_total is already in yen (integer)
      const paidAmount = session.amount_total || 0;
      const newPaidAmount = (booking.amount_paid || 0) + paidAmount;
      const newRemainingAmount = Math.max(booking.total_amount - newPaidAmount, 0);

      // Determine payment status
      let paymentStatus: "unpaid" | "partial" | "paid";
      if (newRemainingAmount === 0) {
        paymentStatus = "paid";
      } else if (newPaidAmount > 0) {
        paymentStatus = "partial";
      } else {
        paymentStatus = "unpaid";
      }

      console.log(`[Stripe Webhook] Updating booking ${bookingId}:`, {
        previousPaidAmount: booking.amount_paid,
        paidAmount,
        newPaidAmount,
        previousRemainingAmount: booking.remaining_amount,
        newRemainingAmount,
        previousPaymentStatus: booking.payment_status,
        newPaymentStatus: paymentStatus,
      });

      // Update booking
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          amount_paid: newPaidAmount,
          remaining_amount: newRemainingAmount,
          payment_status: paymentStatus,
          last_action_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("[Stripe Webhook] Failed to update booking:", updateError);
        return NextResponse.json({ received: true, error: "Update failed" });
      }

      // Insert booking event for idempotency
      const { error: eventError } = await supabase
        .from("booking_events")
        .insert({
          booking_id: bookingId,
          event_type: "stripe_payment_recorded",
          event_payload: {
            payment_intent_id: paymentIntentId,
            session_id: session.id,
            amount_paid: paidAmount,
            pay_percent: payPercent,
            new_paid_amount: newPaidAmount,
            new_remaining_amount: newRemainingAmount,
            payment_status: paymentStatus,
          },
        });

      if (eventError) {
        console.error("[Stripe Webhook] Failed to insert booking event:", eventError);
        // Don't fail the webhook, booking is already updated
      }

      // Send payment received email (with idempotency)
      try {
        // Check if email already sent for this payment_intent
        const { data: emailSentEvent } = await supabase
          .from("booking_events")
          .select("id")
          .eq("booking_id", bookingId)
          .eq("event_type", "email_sent_payment_received")
          .contains("event_payload", { payment_intent_id: paymentIntentId })
          .single();

        if (!emailSentEvent) {
          // Import dynamically to avoid circular deps
          const { sendBrevoEmail } = await import("@/lib/email/brevo");
          const { paymentReceivedCustomer } = await import("@/lib/email/templates");

          const { subject, html, text } = paymentReceivedCustomer(
            booking,
            paidAmount,
            newRemainingAmount
          );

          await sendBrevoEmail({
            to: booking.customer_email,
            subject,
            html,
            text,
          });

          // Record email sent
          await supabase.from("booking_events").insert({
            booking_id: bookingId,
            event_type: "email_sent_payment_received",
            event_payload: {
              payment_intent_id: paymentIntentId,
              email: booking.customer_email,
              amount_paid: paidAmount,
            },
          });

          console.log(`[Stripe Webhook] Payment received email sent to ${booking.customer_email}`);
        } else {
          console.log(`[Stripe Webhook] Payment email already sent for payment_intent ${paymentIntentId}`);
        }
      } catch (emailError) {
        console.error("[Stripe Webhook] Failed to send payment email:", emailError);
        // Don't fail the webhook
      }

      console.log(`[Stripe Webhook] Successfully processed payment for booking ${bookingId}`);
      return NextResponse.json({ received: true, success: true });
    }

    // Acknowledge other event types
    console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

// Disable body parsing for webhook signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
