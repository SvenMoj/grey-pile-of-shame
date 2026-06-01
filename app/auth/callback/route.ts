import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (data.user.email === adminEmail) {
        // Admin — existing protected area unchanged
        return NextResponse.redirect(new URL("/admin/paints", origin));
      }
      // General user — go to the pile
      return NextResponse.redirect(new URL("/pile", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
}
