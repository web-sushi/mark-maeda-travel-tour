import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/is-admin
 * Checks if the current authenticated user is an admin by querying public.admin_users
 * Returns: { isAdmin: boolean, userId?: string, email?: string }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("[is-admin] No authenticated user");
      return NextResponse.json({ isAdmin: false });
    }

    console.log("[is-admin] Checking admin status for user:", {
      id: user.id,
      email: user.email,
    });

    // Check if user exists in admin_users table
    const { data: adminUser, error: queryError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      console.error("[is-admin] Query error:", queryError);
      return NextResponse.json({ isAdmin: false, error: queryError.message });
    }

    const isAdmin = !!adminUser;

    console.log("[is-admin] Result:", {
      userId: user.id,
      email: user.email,
      isAdmin,
    });

    return NextResponse.json({
      isAdmin,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error("[is-admin] Unexpected error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
