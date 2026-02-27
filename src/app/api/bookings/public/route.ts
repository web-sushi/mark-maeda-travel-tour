import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/bookings/public?bookingId=...&t=...
 * Fetch booking details for guests using a one-time token
 * This bypasses RLS while keeping bookings secure
 * 
 * Query params:
 * - bookingId: booking UUID
 * - t: public_view_token
 * 
 * Returns minimal safe fields for guest viewing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("bookingId");
    const token = searchParams.get("t");

    // Validate required parameters
    if (!bookingId || !token) {
      return NextResponse.json(
        { error: "Missing bookingId or token" },
        { status: 400 }
      );
    }

    console.log("[bookings/public] Fetching booking:", {
      bookingId,
      hasToken: !!token,
    });

    // First check if user is authenticated and owns this booking
    let isOwner = false;
    try {
      const supabaseAuth = await createServerClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      
      if (user) {
        // Check if user owns this booking
        const { data: ownerCheck } = await supabaseAuth
          .from("bookings")
          .select("id")
          .eq("id", bookingId)
          .eq("user_id", user.id)
          .single();
        
        isOwner = !!ownerCheck;
        console.log("[bookings/public] User authenticated, is owner:", isOwner);
      }
    } catch (authError) {
      // Not authenticated or error checking ownership - continue with token validation
      console.log("[bookings/public] Guest access, validating token");
    }

    // Use service role to fetch booking (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Query booking with token validation (unless user is owner)
    const query = supabase
      .from("bookings")
      .select(`
        id,
        reference_code,
        booking_status,
        payment_status,
        total_amount,
        amount_paid,
        remaining_amount,
        customer_name,
        customer_email,
        travel_date,
        passengers_count,
        created_at
      `)
      .eq("id", bookingId);

    // If not owner, require token match
    if (!isOwner) {
      query.eq("public_view_token", token);
    }

    const { data: booking, error: fetchError } = await query.single();

    if (fetchError || !booking) {
      console.error("[bookings/public] Booking not found:", {
        bookingId,
        error: fetchError?.message,
      });
      return NextResponse.json(
        { error: "Booking not found or invalid token" },
        { status: 404 }
      );
    }

    console.log("[bookings/public] Booking found:", {
      bookingId: booking.id,
      referenceCode: booking.reference_code,
      isOwner,
    });

    // Fetch booking items
    const { data: items } = await supabase
      .from("booking_items")
      .select("item_type, title, subtotal_amount")
      .eq("booking_id", bookingId);

    // Return safe booking data
    return NextResponse.json({
      booking: {
        id: booking.id,
        reference_code: booking.reference_code,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        total_amount: booking.total_amount,
        amount_paid: booking.amount_paid,
        remaining_amount: booking.remaining_amount,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        travel_date: booking.travel_date,
        passengers_count: booking.passengers_count,
        created_at: booking.created_at,
        items: items || [],
      },
    });
  } catch (error) {
    console.error("[bookings/public] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
