import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

/**
 * Proxy (Next.js 16 equivalent of middleware).
 *
 * Two jobs:
 *  1. Refresh the Supabase auth session cookie on every request.
 *  2. Protect /admin/* routes — requires the ADMIN_EMAIL user.
 *
 * User-facing routes (/pile, /onboarding, /login, /settings) are open here;
 * /settings protection is handled by getUserOrRedirect() in its layout.
 */
export default async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request);
  const pathname = request.nextUrl.pathname;

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return response; // login page always open

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin/login?error=not_allowed", request.url));
    }
  }

  // All other routes: session cookie refreshed as a side-effect of createProxyClient; pass through.
  return response;
}

export const config = {
  // Run on all routes except Next.js internals, static files,
  // and the public convert pages + sitemap/robots (no auth needed, save the overhead).
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|convert(?:/.*)?$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
