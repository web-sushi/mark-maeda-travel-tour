import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/bookings/create
 * Creates a new booking with booking_items using service role (bypasses RLS)
 * Automatically links to authenticated user if session exists
 * Input: { bookingData, cartItems }
 * Output: { ok: boolean, bookingId?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingData, cartItems } = body;

    // Validation
    if (!bookingData || !cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "reference_code",
      "customer_name",
      "customer_email",
      "total_amount",
      "booking_status",
      "payment_status",
    ];

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { ok: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if user is authenticated (read session from cookies)
    const supabaseAuth = await createServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    let userId: string | null = null;
    if (!authError && user) {
      userId = user.id;
      console.log("[bookings/create] Authenticated user detected:", user.id);
    } else {
      console.log("[bookings/create] Guest checkout (no session)");
    }

    // Use service role to insert (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Generate a random token for guest access to booking success/track pages
    const publicViewToken = randomUUID();

    // Add user_id and public_view_token to booking data
    const finalBookingData = {
      ...bookingData,
      user_id: userId, // null for guest, user.id for authenticated
      public_view_token: publicViewToken,
    };

    console.log("[bookings/create] Creating booking:", {
      reference_code: finalBookingData.reference_code,
      customer_email: finalBookingData.customer_email,
      total_amount: finalBookingData.total_amount,
      user_id: userId || "guest",
      items_count: cartItems.length,
      has_token: !!publicViewToken,
    });

    // DEBUGGING: Log full booking payload before insert
    console.log("[bookings/create] Full booking payload:", JSON.stringify(finalBookingData, null, 2));

    // Insert booking
    const { data: insertedBooking, error: insertError } = await supabase
      .from("bookings")
      .insert(finalBookingData)
      .select("id, public_view_token")
      .single();

    if (insertError) {
      // ENHANCED ERROR LOGGING
      console.error("[bookings/create] Failed to insert booking:", {
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      console.error("[bookings/create] Rejected payload:", JSON.stringify(finalBookingData, null, 2));
      
      return NextResponse.json(
        {
          ok: false,
          error: insertError.message || "Failed to create booking",
        },
        { status: 500 }
      );
    }

    console.log("[bookings/create] Booking created:", insertedBooking.id);

    // Insert booking_items with trip details
    const bookingItems = cartItems.map((item: any) => {
      const tripDetails = item.tripDetails || {};
      const meta: any = {};
      
      // Add optional metadata (flight_number and special_requests go in meta jsonb)
      if (tripDetails.flightNumber) {
        meta.flight_number = tripDetails.flightNumber;
      }
      if (tripDetails.specialRequests) {
        meta.special_requests = tripDetails.specialRequests;
      }

      return {
        booking_id: insertedBooking.id,
        item_type: item.type,
        item_id: item.id,
        title: item.title,
        slug: item.slug,
        vehicle_selection: item.vehicleSelection,
        vehicle_rates: item.vehicleRates,
        subtotal_amount: item.subtotal,
        // Core trip details (stored in dedicated columns)
        pickup_location: tripDetails.pickupLocation || '',
        dropoff_location: tripDetails.dropoffLocation || '',
        travel_date: (item.type === 'tour' || item.type === 'transfer') ? tripDetails.travelDate || null : null,
        start_date: item.type === 'package' ? tripDetails.startDate || null : null,
        end_date: item.type === 'package' ? tripDetails.endDate || null : null,
        pickup_time: tripDetails.pickupTime || null,
        passengers_count: tripDetails.passengersCount ? Number(tripDetails.passengersCount) : 1,
        large_suitcases: tripDetails.largeSuitcases ? Number(tripDetails.largeSuitcases) : 0,
        // Optional metadata stored in jsonb
        meta: Object.keys(meta).length > 0 ? meta : null,
      };
    });

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) {
      console.error("[bookings/create] Failed to insert booking items:", {
        booking_id: insertedBooking.id,
        error: itemsError.message,
        code: itemsError.code,
      });
      // Don't fail the whole booking, but log it
      // Booking is already created, return success
    } else {
      console.log("[bookings/create] Booking items inserted:", bookingItems.length);
    }

    return NextResponse.json({
      ok: true,
      bookingId: insertedBooking.id,
      publicViewToken: insertedBooking.public_view_token,
    });
  } catch (error) {
    console.error("[bookings/create] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
