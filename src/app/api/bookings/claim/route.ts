import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple in-memory rate limiting (per user_id)
const claimAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60000; // 1 minute

function checkRateLimit(userId: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = claimAttempts.get(userId);

  if (!record || now > record.resetAt) {
    // Reset or first attempt
    claimAttempts.set(userId, { count: 1, resetAt: now + COOLDOWN_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * POST /api/bookings/claim
 * Allows authenticated user to claim a guest booking
 * Input: { referenceCode, email }
 * Output: { ok: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "You must be logged in to claim a booking" },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitCheck = checkRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      const secondsRemaining = Math.ceil((rateLimitCheck.remainingMs || 0) / 1000);
      console.error("[bookings/claim] Rate limit exceeded:", user.id);
      return NextResponse.json(
        {
          ok: false,
          error: `Too many attempts. Please wait ${secondsRemaining} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { referenceCode, email } = body;

    // Validation
    if (!referenceCode || typeof referenceCode !== "string") {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Reference code is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "email_mismatch", message: "Email is required" },
        { status: 400 }
      );
    }

    // Use service role to check and update booking
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    console.log("[bookings/claim] Attempting to claim:", {
      user_id: user.id,
      reference_code: referenceCode,
      email: email.toLowerCase().trim(),
    });

    // Fetch booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, reference_code, customer_email, user_id")
      .eq("reference_code", referenceCode.toUpperCase().trim())
      .single();

    if (fetchError || !booking) {
      console.error("[bookings/claim] Booking not found:", fetchError);
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Booking not found with that reference code" },
        { status: 404 }
      );
    }

    // Verify email matches
    const bookingEmail = booking.customer_email.toLowerCase().trim();
    const providedEmail = email.toLowerCase().trim();

    if (bookingEmail !== providedEmail) {
      console.error("[bookings/claim] Email mismatch:", {
        booking_email: bookingEmail,
        provided_email: providedEmail,
      });
      return NextResponse.json(
        { ok: false, error: "email_mismatch", message: "Email does not match booking records" },
        { status: 403 }
      );
    }

    // Check if already claimed
    if (booking.user_id) {
      console.error("[bookings/claim] Already claimed:", {
        booking_id: booking.id,
        existing_user_id: booking.user_id,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "already_claimed",
          message: "This booking has already been claimed by an account",
        },
        { status: 409 }
      );
    }

    // Claim the booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ user_id: user.id })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[bookings/claim] Failed to update:", {
        error: updateError.message,
        code: updateError.code,
      });
      return NextResponse.json(
        { ok: false, error: "server_error", message: "Failed to claim booking" },
        { status: 500 }
      );
    }

    console.log("[bookings/claim] Successfully claimed:", {
      booking_id: booking.id,
      user_id: user.id,
    });

    return NextResponse.json({
      ok: true,
      message: "Booking successfully claimed!",
    });
  } catch (error) {
    console.error("[bookings/claim] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: "server_error", message: errorMessage },
      { status: 500 }
    );
  }
}
