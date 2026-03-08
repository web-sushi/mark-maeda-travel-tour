import { NextResponse, type NextRequest } from "next/server";

const STRIPE_WEBHOOK_PATH = "/api/stripe/webhook";

// Minimal middleware: only adds debug header
// Auth protection is handled in src/app/admin/layout.tsx (Server Component)
// /admin-login is outside the admin layout (in (auth) group) so it's publicly accessible
//
// CRITICAL: /api/stripe/webhook must NEVER be redirected.
// Stripe webhooks cannot follow redirects (307/308) - they require a direct 200 response.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === STRIPE WEBHOOK: Bypass ALL middleware logic - never redirect ===
  if (pathname === STRIPE_WEBHOOK_PATH) {
    return NextResponse.next();
  }

  // Allow /admin-register through (protected by setup key in the page itself)
  if (pathname.startsWith("/admin-register")) {
    return NextResponse.next();
  }

  // Allow /admin-login through (it's the login page, must be public)
  if (pathname.startsWith("/admin-login")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.headers.set("x-mw", "hit"); // Debug header to confirm middleware ran
  return res;
}

export const config = {
  // NOTE: matcher entries must be static string literals so Next.js
  // can statically analyze them at build time.
  matcher: [
    "/api/stripe/webhook",
    "/admin/:path*",
    "/admin-register/:path*",
    "/admin-login/:path*",
  ],
};