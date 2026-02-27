import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/reviews/feature
 * Updates review featured status
 * Input: { reviewId: string, isFeatured: boolean }
 * Output: { ok: boolean, review?: object, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin user
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      console.error("[reviews/feature] Auth failed:", authError);
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseServer.rpc("is_admin");

    if (adminCheckError || !isAdmin) {
      console.error("[reviews/feature] Admin check failed:", {
        user_id: user.id,
        error: adminCheckError?.message,
      });
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reviewId, isFeatured } = body;

    // Validation
    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json(
        { ok: false, error: "reviewId is required" },
        { status: 400 }
      );
    }

    if (typeof isFeatured !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "isFeatured must be a boolean" },
        { status: 400 }
      );
    }

    // Use service role to fetch and update
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // If featuring, check that review is approved
    if (isFeatured) {
      const { data: review, error: fetchError } = await supabase
        .from("reviews")
        .select("is_approved")
        .eq("id", reviewId)
        .single();

      if (fetchError) {
        console.error("[reviews/feature] Failed to fetch review:", {
          reviewId,
          error: fetchError.message,
        });
        return NextResponse.json(
          { ok: false, error: "Review not found" },
          { status: 404 }
        );
      }

      if (!review.is_approved) {
        console.error("[reviews/feature] Cannot feature unapproved review:", reviewId);
        return NextResponse.json(
          { ok: false, error: "Cannot feature an unapproved review" },
          { status: 400 }
        );
      }
    }

    console.log("[reviews/feature] Updating review:", {
      reviewId,
      isFeatured,
      user_id: user.id,
    });

    const { data: review, error: updateError } = await supabase
      .from("reviews")
      .update({ is_featured: isFeatured })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      console.error("[reviews/feature] Update failed:", {
        reviewId,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
      });
      return NextResponse.json(
        {
          ok: false,
          error: updateError.message || "Failed to update review",
        },
        { status: 500 }
      );
    }

    console.log("[reviews/feature] Review featured status updated:", reviewId);

    return NextResponse.json({
      ok: true,
      review,
    });
  } catch (error) {
    console.error("[reviews/feature] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
