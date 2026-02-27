import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppSettingsFormData } from "@/types/settings";

/**
 * GET /api/admin/settings
 * Fetch app settings (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch settings
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("singleton_key", "default")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Unexpected error in GET /api/admin/settings:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Update or create app settings (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AppSettingsFormData;

    // Check if settings row exists
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("singleton_key", "default")
      .single();

    if (existing) {
      // Update existing row
      const { data, error } = await supabase
        .from("app_settings")
        .update({
          business_name: body.business_name || null,
          support_email: body.support_email || null,
          support_phone: body.support_phone || null,
          admin_notify_email: body.admin_notify_email || null,
          timezone: body.timezone || "Asia/Tokyo",
          email_toggles: body.email_toggles || {},
        })
        .eq("singleton_key", "default")
        .select()
        .single();

      if (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ settings: data });
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from("app_settings")
        .insert({
          singleton_key: "default",
          business_name: body.business_name || null,
          support_email: body.support_email || null,
          support_phone: body.support_phone || null,
          admin_notify_email: body.admin_notify_email || null,
          timezone: body.timezone || "Asia/Tokyo",
          email_toggles: body.email_toggles || {},
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ settings: data });
    }
  } catch (err) {
    console.error("Unexpected error in POST /api/admin/settings:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
