import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Auth Callback Handler
 * Exchanges Supabase auth code for session after email verification
 * Used for: signup verification, magic link login, password reset
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account"; // Default to account page

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error);
      // Redirect to login with error message
      return NextResponse.redirect(
        new URL("/login?error=verification_failed&next=" + encodeURIComponent(next), request.url)
      );
    }

    console.log("[Auth Callback] Session created successfully, redirecting to:", next);
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(next, request.url));
}
