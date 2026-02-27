import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Require admin access or redirect
 * Call this in admin page/layout server components
 * 
 * Redirects:
 * - Unauthenticated users → /admin-login
 * - Authenticated non-admins → /?error=access_denied
 */
export async function requireAdmin() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Not logged in → redirect to admin login page
    redirect("/admin-login");
  }

  // Check if user is admin using RPC
  const { data: isAdminResult, error: rpcError } = await supabase.rpc("is_admin");

  if (rpcError) {
    console.error("Error checking admin status:", rpcError);
    redirect("/?error=access_denied");
  }

  if (!isAdminResult) {
    // Logged in but not admin → redirect to home with error
    redirect("/?error=access_denied");
  }

  return user;
}
