import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/review/validate
 * Validates review token and returns booking summary + items
 * Input: { token }
 * Output: { ok, booking?, items?, error? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid token" },
        { status: 400 }
      );
    }

    // Use service role client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Validate token
    const { data: reviewRequest, error: tokenError } = await supabase
      .from("review_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !reviewRequest) {
      return NextResponse.json({
        ok: false,
        error: "Invalid token",
      });
    }

    // Check if already used
    if (reviewRequest.used_at) {
      return NextResponse.json({
        ok: false,
        error: "This review link has already been used",
      });
    }

    // Check if expired
    if (new Date(reviewRequest.expires_at) < new Date()) {
      return NextResponse.json({
        ok: false,
        error: "This review link has expired",
      });
    }

    // Fetch booking (safe fields only)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, reference_code, customer_name, travel_date")
      .eq("id", reviewRequest.booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        ok: false,
        error: "Booking not found",
      });
    }

    // Fetch booking items
    const { data: items, error: itemsError } = await supabase
      .from("booking_items")
      .select("id, title, item_type, item_id, slug")
      .eq("booking_id", reviewRequest.booking_id);

    if (itemsError || !items) {
      return NextResponse.json({
        ok: false,
        error: "Booking items not found",
      });
    }

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        reference_code: booking.reference_code,
        customer_name: booking.customer_name,
        travel_date: booking.travel_date,
      },
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        item_type: item.item_type,
        item_id: item.item_id,
        slug: item.slug,
      })),
    });
  } catch (error) {
    console.error("[review/validate] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
