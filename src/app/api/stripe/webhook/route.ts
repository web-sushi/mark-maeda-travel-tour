import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Stripe Webhook Handler
 * 
 * Handles:
 * - checkout.session.completed (immediate card payments)
 * - checkout.session.async_payment_succeeded (delayed payments: konbini, bank transfer)
 * - checkout.session.async_payment_failed (failed delayed payments)
 * - payment_intent.succeeded (fallback)
 * - charge.refunded (refund processing)
 * 
 * Features:
 * - Signature verification with raw request body
 * - Idempotency via stripe_webhook_events table
 * - Support for 2-payment flow (deposit + balance)
 * - Proper payment status management
 * - Refund handling
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    
    if (!webhookSecret) {
      console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Missing webhook secret configuration" },
        { status: 500 }
      );
    }

    // Get raw body text for signature verification
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Missing stripe-signature header");
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
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] ✅ Verified event: ${event.type} (${event.id})`);

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ==================== IDEMPOTENCY CHECK ====================
    // Check if this exact event has already been processed
    const { data: existingEvent } = await supabase
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`[Stripe Webhook] ⏭️  Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    // ==================== EVENT HANDLERS ====================
    
    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(supabase, event.id, session);
    }
    
    // Handle checkout.session.async_payment_succeeded (konbini, bank transfer, etc.)
    else if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleAsyncPaymentSucceeded(supabase, event.id, session);
    }
    
    // Handle checkout.session.async_payment_failed
    else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleAsyncPaymentFailed(supabase, event.id, session);
    }
    
    // Handle charge.refunded
    else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(supabase, event.id, charge);
    }
    
    // Handle payment_intent.succeeded (fallback)
    else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(supabase, event.id, paymentIntent);
    }
    
    // Acknowledge other event types
    else {
      console.log(`[Stripe Webhook] ℹ️  Unhandled event type: ${event.type}`);
      
      // Still record the event for tracking
      await supabase.from("stripe_webhook_events").insert({
        event_id: event.id,
        event_type: event.type,
        metadata: { message: "Unhandled event type" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] ❌ Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Webhook handler failed", details: errorMessage },
      { status: 400 }
    );
  }
}

// ==================== HANDLER FUNCTIONS ====================

/**
 * Handle checkout.session.completed
 * Fired when customer completes checkout (immediate card payments)
 */
async function handleCheckoutCompleted(
  supabase: any,
  eventId: string,
  session: Stripe.Checkout.Session
) {
  console.log(`[Stripe Webhook] 💳 checkout.session.completed: ${session.id}`);

  const bookingId = session.metadata?.booking_id || session.metadata?.bookingId;
  const paymentType = session.metadata?.pay_type || session.metadata?.paymentType || "deposit";
  
  if (!bookingId) {
    console.error("[Stripe Webhook] ❌ No bookingId in session metadata");
    await recordWebhookEvent(supabase, eventId, "checkout.session.completed", null, {
      error: "Missing bookingId",
      session_id: session.id,
    });
    return;
  }

  // For delayed payment methods (konbini, bank_transfer), don't mark as paid yet
  // Wait for async_payment_succeeded event
  if (session.payment_status === "unpaid") {
    console.log(`[Stripe Webhook] ⏳ Payment status is 'unpaid' (delayed payment), sending pending notification`);
    
    // Fetch booking for email
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const paymentAmount = session.amount_total || 0;
      const paymentMethodType = session.payment_method_types?.[0] || "delayed";
      
      // Fetch booking_items
      const { data: bookingItems } = await supabase
        .from("booking_items")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      const items = bookingItems || [];

      // Send pending payment emails
      try {
        const { sendBrevoEmail } = await import("@/lib/email/brevo");
        const { paymentPendingCustomer, paymentPendingAdmin } = await import("@/lib/email/templates");

        // Customer email
        const customerEmail = paymentPendingCustomer(booking, items, paymentAmount, paymentMethodType);
        await sendBrevoEmail({
          to: booking.customer_email,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        });

        // Admin email
        const adminEmail = paymentPendingAdmin(booking, items, paymentAmount, paymentMethodType);
        await sendBrevoEmail({
          to: process.env.ADMIN_EMAIL || booking.customer_email,
          subject: adminEmail.subject,
          html: adminEmail.html,
          text: adminEmail.text,
        });

        // Record email events
        await supabase.from("booking_events").insert([
          {
            booking_id: bookingId,
            event_type: "email_sent_payment_pending_customer",
            event_payload: {
              session_id: session.id,
              payment_type: paymentType,
              payment_method: paymentMethodType,
              amount: paymentAmount,
            },
          },
          {
            booking_id: bookingId,
            event_type: "email_sent_payment_pending_admin",
            event_payload: {
              session_id: session.id,
              payment_type: paymentType,
              payment_method: paymentMethodType,
              amount: paymentAmount,
            },
          },
        ]);

        console.log(`[Stripe Webhook] 📧 Payment pending emails sent for booking ${bookingId}`);
      } catch (emailError) {
        console.error("[Stripe Webhook] ⚠️  Failed to send pending payment emails:", emailError);
      }
    }

    await recordWebhookEvent(supabase, eventId, "checkout.session.completed", bookingId, {
      session_id: session.id,
      payment_status: session.payment_status,
      payment_type: paymentType,
      message: "Waiting for async payment",
    });
    return;
  }

  // Process immediate payment (card)
  await processPayment(supabase, eventId, bookingId, session, paymentType);
}

/**
 * Handle checkout.session.async_payment_succeeded
 * Fired when delayed payment succeeds (konbini, bank transfer)
 */
async function handleAsyncPaymentSucceeded(
  supabase: any,
  eventId: string,
  session: Stripe.Checkout.Session
) {
  console.log(`[Stripe Webhook] ✅ checkout.session.async_payment_succeeded: ${session.id}`);

  const bookingId = session.metadata?.booking_id || session.metadata?.bookingId;
  const paymentType = session.metadata?.pay_type || session.metadata?.paymentType || "deposit";
  
  if (!bookingId) {
    console.error("[Stripe Webhook] ❌ No bookingId in session metadata");
    await recordWebhookEvent(supabase, eventId, "checkout.session.async_payment_succeeded", null, {
      error: "Missing bookingId",
      session_id: session.id,
    });
    return;
  }

  await processPayment(supabase, eventId, bookingId, session, paymentType);
}

/**
 * Handle checkout.session.async_payment_failed
 * Fired when delayed payment fails
 */
async function handleAsyncPaymentFailed(
  supabase: any,
  eventId: string,
  session: Stripe.Checkout.Session
) {
  console.log(`[Stripe Webhook] ❌ checkout.session.async_payment_failed: ${session.id}`);

  const bookingId = session.metadata?.booking_id || session.metadata?.bookingId;
  const paymentType = session.metadata?.pay_type || session.metadata?.paymentType || "deposit";
  
  if (!bookingId) {
    console.error("[Stripe Webhook] ❌ No bookingId in session metadata");
    await recordWebhookEvent(supabase, eventId, "checkout.session.async_payment_failed", null, {
      error: "Missing bookingId",
      session_id: session.id,
    });
    return;
  }

  // Fetch booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    console.error(`[Stripe Webhook] ❌ Booking ${bookingId} not found`);
    return;
  }

  console.log(`[Stripe Webhook] 📝 Marking booking ${bookingId} as payment_failed (${paymentType})`);

  // Update booking to payment_failed (do NOT cancel booking)
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "payment_failed",
      last_action_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[Stripe Webhook] ❌ Failed to update booking:", updateError);
  }

  // Record event
  await recordWebhookEvent(supabase, eventId, "checkout.session.async_payment_failed", bookingId, {
    session_id: session.id,
    payment_type: paymentType,
    previous_status: booking.payment_status,
    new_status: "payment_failed",
  });

  // Insert booking event
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "payment_failed",
    event_payload: {
      session_id: session.id,
      payment_type: paymentType,
      reason: "Async payment failed",
    },
  });

  // Send payment failed emails
  try {
    const paymentAmount = session.amount_total || 0;
    const paymentMethodType = session.payment_method_types?.[0] || "delayed";

    // Fetch booking_items
    const { data: bookingItems } = await supabase
      .from("booking_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    const items = bookingItems || [];

    const { sendBrevoEmail } = await import("@/lib/email/brevo");
    const { paymentFailedCustomer, paymentFailedAdmin } = await import("@/lib/email/templates");

    // Customer email
    const customerEmail = paymentFailedCustomer(booking, items, paymentAmount, paymentMethodType);
    await sendBrevoEmail({
      to: booking.customer_email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
    });

    // Admin email
    const adminEmail = paymentFailedAdmin(booking, items, paymentAmount, paymentMethodType);
    await sendBrevoEmail({
      to: process.env.ADMIN_EMAIL || booking.customer_email,
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    // Record email events
    await supabase.from("booking_events").insert([
      {
        booking_id: bookingId,
        event_type: "email_sent_payment_failed_customer",
        event_payload: {
          session_id: session.id,
          payment_type: paymentType,
          amount: paymentAmount,
        },
      },
      {
        booking_id: bookingId,
        event_type: "email_sent_payment_failed_admin",
        event_payload: {
          session_id: session.id,
          payment_type: paymentType,
          amount: paymentAmount,
        },
      },
    ]);

    console.log(`[Stripe Webhook] 📧 Payment failed emails sent to customer and admin`);
  } catch (emailError) {
    console.error("[Stripe Webhook] ⚠️  Failed to send payment failed emails:", emailError);
  }

  console.log(`[Stripe Webhook] ✅ Payment failure recorded for booking ${bookingId}`);
}

/**
 * Handle charge.refunded
 * Fired when a charge is refunded
 */
async function handleChargeRefunded(
  supabase: any,
  eventId: string,
  charge: Stripe.Charge
) {
  console.log(`[Stripe Webhook] 💰 charge.refunded: ${charge.id}`);

  // Get payment intent to find booking
  const paymentIntentId = typeof charge.payment_intent === "string" 
    ? charge.payment_intent 
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.error("[Stripe Webhook] ❌ No payment_intent in charge");
    return;
  }

  // Find booking by payment intent ID
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .or(`stripe_deposit_payment_intent_id.eq.${paymentIntentId},stripe_balance_payment_intent_id.eq.${paymentIntentId}`)
    .single();

  if (!booking) {
    console.error(`[Stripe Webhook] ❌ No booking found for payment_intent ${paymentIntentId}`);
    await recordWebhookEvent(supabase, eventId, "charge.refunded", null, {
      error: "Booking not found",
      charge_id: charge.id,
      payment_intent_id: paymentIntentId,
    });
    return;
  }

  const refundAmount = charge.amount_refunded; // in yen (JPY has no minor unit)
  const refundReason = charge.refunds?.data[0]?.reason || "unknown";

  console.log(`[Stripe Webhook] 💰 Refunding ¥${refundAmount} for booking ${booking.id}`);

  // Update booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "refunded",
      refund_amount: refundAmount,
      refund_reason: refundReason,
      refunded_at: new Date().toISOString(),
      last_action_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("[Stripe Webhook] ❌ Failed to update booking:", updateError);
  }

  // Record event
  await recordWebhookEvent(supabase, eventId, "charge.refunded", booking.id, {
    charge_id: charge.id,
    payment_intent_id: paymentIntentId,
    refund_amount: refundAmount,
    refund_reason: refundReason,
    previous_status: booking.payment_status,
  });

  // Insert booking event
  await supabase.from("booking_events").insert({
    booking_id: booking.id,
    event_type: "refund_processed",
    event_payload: {
      charge_id: charge.id,
      refund_amount: refundAmount,
      refund_reason: refundReason,
    },
  });

  console.log(`[Stripe Webhook] ✅ Refund recorded for booking ${booking.id}`);
}

/**
 * Handle payment_intent.succeeded (fallback)
 * Usually not needed if checkout.session events are handled,
 * but provides a safety net
 */
async function handlePaymentIntentSucceeded(
  supabase: any,
  eventId: string,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`[Stripe Webhook] 💳 payment_intent.succeeded: ${paymentIntent.id}`);

  // Check if we already processed this via checkout.session.completed
  const { data: existingBookingEvent } = await supabase
    .from("booking_events")
    .select("id")
    .eq("event_type", "stripe_payment_recorded")
    .contains("event_payload", { payment_intent_id: paymentIntent.id })
    .single();

  if (existingBookingEvent) {
    console.log(`[Stripe Webhook] ⏭️  Payment intent ${paymentIntent.id} already processed via checkout session`);
    await recordWebhookEvent(supabase, eventId, "payment_intent.succeeded", null, {
      payment_intent_id: paymentIntent.id,
      message: "Already processed via checkout.session",
    });
    return;
  }

  // This is a fallback - log it but don't process
  console.log(`[Stripe Webhook] ℹ️  Payment intent succeeded but no checkout session event found. This may be a direct payment_intent charge.`);
  await recordWebhookEvent(supabase, eventId, "payment_intent.succeeded", null, {
    payment_intent_id: paymentIntent.id,
    message: "Fallback handler - no action taken",
  });
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Process a successful payment
 */
async function processPayment(
  supabase: any,
  eventId: string,
  bookingId: string,
  session: Stripe.Checkout.Session,
  paymentType: string
) {
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;

  if (!paymentIntentId) {
    console.error("[Stripe Webhook] ❌ No payment_intent in session");
    return;
  }

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    console.error("[Stripe Webhook] ❌ Booking not found:", bookingError);
    await recordWebhookEvent(supabase, eventId, session.object, bookingId, {
      error: "Booking not found",
      session_id: session.id,
    });
    return;
  }

  // JPY has no minor unit - amount_total is already in yen
  const paidAmount = session.amount_total || 0;
  const previousPaid = booking.amount_paid || 0;
  const newPaidAmount = previousPaid + paidAmount;
  const newRemainingAmount = Math.max(booking.total_amount - newPaidAmount, 0);

  // Determine new payment status
  let newPaymentStatus: string;
  if (newRemainingAmount === 0) {
    newPaymentStatus = "paid";
  } else if (newPaidAmount > 0) {
    newPaymentStatus = "partial";
  } else {
    newPaymentStatus = "unpaid";
  }

  console.log(`[Stripe Webhook] 💰 Payment for booking ${bookingId}:`, {
    payment_type: paymentType,
    session_id: session.id,
    paid_amount: paidAmount,
    previous_paid: previousPaid,
    new_paid: newPaidAmount,
    new_remaining: newRemainingAmount,
    previous_status: booking.payment_status,
    new_status: newPaymentStatus,
  });

  // Prepare update data
  const updateData: any = {
    amount_paid: newPaidAmount,
    remaining_amount: newRemainingAmount,
    payment_status: newPaymentStatus,
    last_action_at: new Date().toISOString(),
  };

  // Store session and payment intent IDs
  if (paymentType === "deposit") {
    updateData.stripe_deposit_session_id = session.id;
    updateData.stripe_deposit_payment_intent_id = paymentIntentId;
  } else if (paymentType === "remaining" || paymentType === "balance") {
    updateData.stripe_balance_session_id = session.id;
    updateData.stripe_balance_payment_intent_id = paymentIntentId;
  }

  // Update booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (updateError) {
    console.error("[Stripe Webhook] ❌ Failed to update booking:", updateError);
    return;
  }

  // Record webhook event
  await recordWebhookEvent(supabase, eventId, session.object, bookingId, {
    session_id: session.id,
    payment_intent_id: paymentIntentId,
    payment_type: paymentType,
    paid_amount: paidAmount,
    new_paid_amount: newPaidAmount,
    new_remaining_amount: newRemainingAmount,
    previous_status: booking.payment_status,
    new_status: newPaymentStatus,
  });

  // Insert booking event for tracking
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "stripe_payment_recorded",
    event_payload: {
      payment_intent_id: paymentIntentId,
      session_id: session.id,
      payment_type: paymentType,
      amount_paid: paidAmount,
      new_paid_amount: newPaidAmount,
      new_remaining_amount: newRemainingAmount,
      payment_status: newPaymentStatus,
    },
  });

  // Send payment received email (with idempotency check)
  try {
    const { data: emailSentEvent } = await supabase
      .from("booking_events")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("event_type", "email_sent_payment_received")
      .contains("event_payload", { payment_intent_id: paymentIntentId })
      .single();

    if (!emailSentEvent) {
      // Fetch booking_items
      const { data: bookingItems } = await supabase
        .from("booking_items")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      const items = bookingItems || [];

      const { sendBrevoEmail } = await import("@/lib/email/brevo");
      const { paymentReceivedCustomer } = await import("@/lib/email/templates");

      const { subject, html, text } = paymentReceivedCustomer(
        booking,
        items,
        paidAmount,
        newRemainingAmount
      );

      await sendBrevoEmail({
        to: booking.customer_email,
        subject,
        html,
        text,
      });

      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "email_sent_payment_received",
        event_payload: {
          payment_intent_id: paymentIntentId,
          email: booking.customer_email,
          amount_paid: paidAmount,
          payment_type: paymentType,
        },
      });

      console.log(`[Stripe Webhook] 📧 Payment email sent to ${booking.customer_email}`);
    }
  } catch (emailError) {
    console.error("[Stripe Webhook] ⚠️  Failed to send payment email:", emailError);
    // Don't fail the webhook
  }

  console.log(`[Stripe Webhook] ✅ Successfully processed payment for booking ${bookingId}`);
}

/**
 * Record webhook event for idempotency
 */
async function recordWebhookEvent(
  supabase: any,
  eventId: string,
  eventType: string,
  bookingId: string | null,
  metadata: Record<string, any>
) {
  await supabase.from("stripe_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    booking_id: bookingId,
    metadata,
  });
}

// Disable body parsing for webhook signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
