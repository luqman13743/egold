import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// This middleware only checks "is there a session cookie" for fast,
// cheap redirects (e.g. bounce anonymous visitors away from /account).
// It does NOT check roles — Edge middleware cannot safely verify a full
// session/role against the database on every request. The real
// authorization boundary is requireRole() in lib/auth/rbac.ts, called at
// the top of every admin Server Action and Route Handler. Never treat a
// passing middleware check as proof of admin access.
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPrefixes = ["/account", "/checkout", "/admin"];

  if (protectedPrefixes.some((p) => path.startsWith(p))) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
