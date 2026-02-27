import { NextResponse, type NextRequest } from "next/server";

// Minimal middleware: only adds debug header
// Auth protection is handled in src/app/admin/layout.tsx (Server Component)
// /admin-login is outside the admin layout (in (auth) group) so it's publicly accessible
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/admin/:path*", "/admin-register/:path*", "/admin-login/:path*"],
};