import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/transfer-quotes/create
 * Creates a new transfer quote request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transfer_id,
      pickup_location,
      dropoff_location,
      date,
      time,
      passengers,
      luggage,
      notes,
      contact_name,
      contact_email,
      contact_phone,
    } = body;

    // Validation
    if (!pickup_location || !dropoff_location || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!passengers || passengers < 1) {
      return NextResponse.json(
        { error: "Passengers must be at least 1" },
        { status: 400 }
      );
    }

    if (!contact_name || !contact_email) {
      return NextResponse.json(
        { error: "Contact name and email are required" },
        { status: 400 }
      );
    }

    // Use service role to insert
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("transfer_quote_requests")
      .insert({
        transfer_id: transfer_id || null,
        pickup_location: pickup_location.trim(),
        dropoff_location: dropoff_location.trim(),
        date,
        time,
        passengers,
        luggage: luggage?.trim() || null,
        notes: notes?.trim() || null,
        contact_name: contact_name.trim(),
        contact_email: contact_email.trim(),
        contact_phone: contact_phone?.trim() || null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[transfer-quotes/create] Error:", error);
      return NextResponse.json(
        { error: "Failed to submit quote request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      quoteRequestId: data.id,
    });
  } catch (error) {
    console.error("[transfer-quotes/create] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
