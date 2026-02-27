import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/reviews/approve
 * Updates review approval status
 * Input: { reviewId: string, isApproved: boolean }
 * Output: { ok: boolean, review?: object, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin user
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      console.error("[reviews/approve] Auth failed:", authError);
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseServer.rpc("is_admin");

    if (adminCheckError || !isAdmin) {
      console.error("[reviews/approve] Admin check failed:", {
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
    const { reviewId, isApproved } = body;

    // Validation
    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json(
        { ok: false, error: "reviewId is required" },
        { status: 400 }
      );
    }

    if (typeof isApproved !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "isApproved must be a boolean" },
        { status: 400 }
      );
    }

    // Use service role to update
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Build update data
    const updateData: { is_approved: boolean; is_featured?: boolean } = {
      is_approved: isApproved,
    };

    // If unapproving, also unfeature
    if (!isApproved) {
      updateData.is_featured = false;
    }

    console.log("[reviews/approve] Updating review:", {
      reviewId,
      updateData,
      user_id: user.id,
    });

    const { data: review, error: updateError } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      console.error("[reviews/approve] Update failed:", {
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

    console.log("[reviews/approve] Review updated successfully:", reviewId);

    return NextResponse.json({
      ok: true,
      review,
    });
  } catch (error) {
    console.error("[reviews/approve] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
