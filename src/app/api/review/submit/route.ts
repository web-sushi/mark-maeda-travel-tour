import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ReviewSubmission } from "@/types/review";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/review/submit
 * Submits reviews for booking items
 * Input: { token, displayName?, overallComment?, itemReviews: [...] }
 * Output: { ok, error? }
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReviewSubmission = await request.json();
    const { token, displayName, overallComment, itemReviews } = body;

    // Validation
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid token" },
        { status: 400 }
      );
    }

    if (!itemReviews || !Array.isArray(itemReviews) || itemReviews.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one item review is required" },
        { status: 400 }
      );
    }

    // Validate ratings
    for (const review of itemReviews) {
      if (!review.rating || review.rating < 1 || review.rating > 5) {
        return NextResponse.json(
          { ok: false, error: "Invalid rating (must be 1-5)" },
          { status: 400 }
        );
      }
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
      console.error("[review/submit] Token validation failed:", {
        token,
        error: tokenError?.message,
        code: tokenError?.code,
        details: tokenError?.details,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid token",
          debug: tokenError?.message,
        },
        { status: 400 }
      );
    }

    // Check if already used
    if (reviewRequest.used_at) {
      console.error("[review/submit] Token already used:", {
        token,
        used_at: reviewRequest.used_at,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "This review link has already been used",
        },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(reviewRequest.expires_at);
    if (expiresAt < now) {
      console.error("[review/submit] Token expired:", {
        token,
        expires_at: reviewRequest.expires_at,
        now: now.toISOString(),
      });
      return NextResponse.json(
        {
          ok: false,
          error: "This review link has expired",
        },
        { status: 400 }
      );
    }

    // Fetch booking items to verify they belong to this booking
    const { data: bookingItems, error: itemsError } = await supabase
      .from("booking_items")
      .select("id")
      .eq("booking_id", reviewRequest.booking_id);

    if (itemsError || !bookingItems) {
      console.error("[review/submit] Failed to fetch booking items:", {
        booking_id: reviewRequest.booking_id,
        error: itemsError?.message,
        code: itemsError?.code,
        details: itemsError?.details,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Booking items not found",
          debug: itemsError?.message,
        },
        { status: 404 }
      );
    }

    const validItemIds = new Set(bookingItems.map((item) => item.id));

    // Verify all submitted item IDs are valid
    for (const review of itemReviews) {
      if (!validItemIds.has(review.bookingItemId)) {
        console.error("[review/submit] Invalid booking item ID:", {
          submitted_id: review.bookingItemId,
          valid_ids: Array.from(validItemIds),
        });
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid booking item ID",
            debug: `Item ${review.bookingItemId} not found in booking`,
          },
          { status: 400 }
        );
      }
    }

    // Insert reviews with correct column names: is_approved, is_featured
    // Fallback: use overallComment if per-item comment is empty
    const reviewsToInsert = itemReviews.map((review) => {
      const itemComment = review.comment?.trim() || "";
      const fallbackComment = overallComment?.trim() || "";
      const finalComment = itemComment || fallbackComment;

      return {
        booking_item_id: review.bookingItemId,
        booking_id: reviewRequest.booking_id,
        rating: review.rating,
        comment: finalComment,
        display_name: displayName || "",
        is_approved: false, // Requires admin approval
        is_featured: false,
      };
    });

    console.log("[review/submit] Inserting reviews:", {
      booking_id: reviewRequest.booking_id,
      count: reviewsToInsert.length,
      overallComment: overallComment?.trim() || "(none)",
      reviews: reviewsToInsert,
    });

    const { error: reviewsError } = await supabase
      .from("reviews")
      .insert(reviewsToInsert);

    if (reviewsError) {
      console.error("[review/submit] Failed to insert reviews:", {
        error: reviewsError.message,
        code: reviewsError.code,
        details: reviewsError.details,
        hint: reviewsError.hint,
        reviewsData: reviewsToInsert,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to submit reviews",
          debug: reviewsError.message,
        },
        { status: 500 }
      );
    }

    console.log("[review/submit] Reviews inserted successfully");

    // Mark token as used
    const { error: updateError } = await supabase
      .from("review_requests")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    if (updateError) {
      console.error("[review/submit] Failed to mark token as used:", {
        token,
        error: updateError.message,
        code: updateError.code,
      });
      // Don't fail the request, reviews are already saved
    } else {
      console.log("[review/submit] Token marked as used");
    }

    // Create booking event with summary (no emails)
    const { error: eventError } = await supabase.from("booking_events").insert({
      booking_id: reviewRequest.booking_id,
      event_type: "review_submitted",
      event_payload: {
        reviews_count: itemReviews.length,
        display_name: displayName || "Anonymous",
        overall_comment: overallComment || null,
      },
    });

    if (eventError) {
      console.error("[review/submit] Failed to insert booking event:", {
        booking_id: reviewRequest.booking_id,
        error: eventError.message,
        code: eventError.code,
      });
      // Don't fail the request, reviews are already saved
    } else {
      console.log("[review/submit] Booking event created");
    }

    console.log("[review/submit] Review submission complete for booking:", reviewRequest.booking_id);

    return NextResponse.json({
      ok: true,
      message: "Reviews submitted successfully",
    });
  } catch (error) {
    console.error("[review/submit] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        ok: false, 
        error: "Internal server error",
        debug: errorMessage,
      },
      { status: 500 }
    );
  }
}
