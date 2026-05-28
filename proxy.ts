import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") return response;

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin/login?error=not_allowed", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
