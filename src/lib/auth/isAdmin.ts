import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is an admin
 * Returns true if user is logged in and is_admin() returns true
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    // Call Supabase RPC to check if user is admin
    const { data, error } = await supabase.rpc("is_admin");

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Unexpected error in isAdmin:", error);
    return false;
  }
}
