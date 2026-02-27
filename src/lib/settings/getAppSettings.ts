import { createClient } from "@supabase/supabase-js";
import type { AppSettings } from "@/types/settings";

/**
 * Fetch app settings using service role (server-side only)
 * Returns null if settings don't exist yet
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration for service role");
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("singleton_key", "default")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - settings not created yet
      return null;
    }
    console.error("Error fetching app settings:", error);
    return null;
  }

  return data as AppSettings;
}
