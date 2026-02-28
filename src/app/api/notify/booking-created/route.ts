// Server-only route: Send booking creation emails (customer + admin)
// Idempotent via booking_events

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/email/brevo";
import {
  bookingReceivedCustomer,
  bookingReceivedAdmin,
} from "@/lib/email/templates";
import { Booking } from "@/types/booking";
import { getAppSettings } from "@/lib/settings/getAppSettings";

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === "development";

  console.log("[booking-created] start");

  // Parse JSON safely
  let body;
  try {
    body = await req.json();
  } catch (parseError) {
    console.error("[booking-created] JSON parse error:", parseError);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { bookingId } = body;

  if (!bookingId || typeof bookingId !== "string") {
    console.error("[booking-created] missing or invalid bookingId");
    return NextResponse.json(
      { ok: false, error: "missing bookingId" },
      { status: 400 }
    );
  }

  console.log("[booking-created] bookingId:", bookingId);

  // Create server-only Supabase admin client
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[booking-created] Missing Supabase credentials");
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("[booking-created] Fetching booking...");

  // Fetch booking robustly
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    console.error("[booking-created] supabase error", {
      step: "fetch_booking",
      error: fetchError,
    });
    return NextResponse.json(
      {
        ok: false,
        error: isDev ? "Database error" : "Database error",
        ...(isDev && {
          step: "fetch_booking",
          message: fetchError.message,
          code: fetchError.code,
          hint: fetchError.hint,
          details: fetchError.details,
        }),
      },
      { status: 500 }
    );
  }

  if (!booking) {
    console.error("[booking-created] Booking not found:", bookingId);
    return NextResponse.json(
      { ok: false, error: "booking not found" },
      { status: 404 }
    );
  }

  console.log("[booking-created] Booking found:", {
    id: booking.id,
    customer_email: booking.customer_email,
  });

  // Fetch booking_items for the booking
  console.log("[booking-created] Fetching booking_items...");
  
  const { data: bookingItems, error: itemsError } = await supabaseAdmin
    .from("booking_items")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("[booking-created] Error fetching booking_items:", itemsError);
    // Continue without items rather than failing completely
  }

  const items = bookingItems || [];
  console.log("[booking-created] Booking items found:", items.length);

  // Idempotency check
  console.log("[booking-created] Checking for existing event...");

  const { data: existingEvent, error: checkError } = await supabaseAdmin
    .from("booking_events")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("event_type", "email_sent_booking_created")
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("[booking-created] supabase error", {
      step: "idempotency_check",
      error: checkError,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Database error",
        ...(isDev && {
          step: "idempotency_check",
          message: checkError.message,
          code: checkError.code,
          hint: checkError.hint,
          details: checkError.details,
        }),
      },
      { status: 500 }
    );
  }

  if (existingEvent) {
    console.log("[booking-created] Already sent, skipping:", bookingId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  console.log("[booking-created] No existing event, proceeding...");

  // Fetch app settings for email toggles and fallback admin email
  const appSettings = await getAppSettings();
  const emailToggles = appSettings?.email_toggles || {};

  // Admin email: priority order
  // 1. app_settings.admin_notification_email (new field)
  // 2. app_settings.admin_notify_email (old field, backwards compat)
  // 3. env.ADMIN_EMAIL (fallback)
  const adminEmail = 
    appSettings?.admin_notification_email ||
    appSettings?.admin_notify_email || 
    process.env.ADMIN_EMAIL || 
    null;
  
  const customerEmail = booking.customer_email;
  const emailFrom = process.env.EMAIL_FROM || "";

  console.log("[booking-created] Email configuration:", {
    customerEmail,
    adminEmail: adminEmail || "(not configured)",
    emailFrom: emailFrom || "(not configured)",
  });

  // Safeguard: if admin email === from email, use fallback to avoid self-send filtering
  let finalAdminEmail = adminEmail;
  if (adminEmail && emailFrom && adminEmail.toLowerCase() === emailFrom.toLowerCase()) {
    const fallbackAdminEmail = process.env.ADMIN_EMAIL;
    if (fallbackAdminEmail && fallbackAdminEmail.toLowerCase() !== emailFrom.toLowerCase()) {
      finalAdminEmail = fallbackAdminEmail;
      console.warn("[booking-created] ⚠️  Admin email equals FROM email, using fallback:", {
        original: adminEmail,
        fallback: finalAdminEmail,
      });
    } else {
      console.error("[booking-created] ❌ Admin email equals FROM email and no valid fallback available");
      finalAdminEmail = null;
    }
  }

  console.log("[booking-created] Final admin recipient:", finalAdminEmail || "(none)");

  // Insert booking_event BEFORE sending emails
  console.log("[booking-created] Inserting booking_event...");

  const { error: insertError } = await supabaseAdmin
    .from("booking_events")
    .insert({
      booking_id: bookingId,
      event_type: "email_sent_booking_created",
      event_payload: {
        sent_to: [customerEmail, finalAdminEmail].filter(Boolean),
        mode: "booking-created",
      },
    });

  if (insertError) {
    console.error("[booking-created] supabase error", {
      step: "insert_event",
      error: insertError,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "insert failed",
        ...(isDev && {
          step: "insert_event",
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          details: insertError.details,
        }),
      },
      { status: 500 }
    );
  }

  console.log("[booking-created] Event inserted successfully");

  // Send emails (non-blocking errors)
  let emailError = false;

  // Send customer email (if enabled)
  if (emailToggles.booking_received_customer !== false) {
    console.log("[booking-created] Sending customer email...");
    try {
      const customerTemplate = bookingReceivedCustomer(booking as Booking, items);
      await sendBrevoEmail({
        to: customerEmail,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        text: customerTemplate.text,
      });
      console.log("[booking-created] Customer email sent:", customerEmail);
    } catch (error) {
      console.error("[booking-created] Customer email failed:", error);
      emailError = true;
    }
  } else {
    console.log("[booking-created] Customer email disabled in settings");
  }

  // Send admin email (if enabled and email configured)
  if (emailToggles.booking_received_admin !== false) {
    if (finalAdminEmail) {
      console.log("[booking-created] Sending admin email to:", finalAdminEmail);
      try {
        const adminTemplate = bookingReceivedAdmin(booking as Booking, items);
        await sendBrevoEmail({
          to: finalAdminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
        });
        console.log("[booking-created] ✅ Admin email sent successfully to:", finalAdminEmail);
      } catch (error) {
        console.error("[booking-created] ❌ Admin email failed:", error);
        emailError = true;
      }
    } else {
      console.log("[booking-created] ⚠️  No admin email configured (skipping admin notification)");
    }
  } else {
    console.log("[booking-created] Admin email disabled in settings");
  }

  console.log("[booking-created] Complete");

  return NextResponse.json({
    ok: true,
    inserted: true,
    bookingId,
    customerEmail,
    adminEmail: finalAdminEmail || null,
    ...(emailError && { emailError: true }),
  });
}
