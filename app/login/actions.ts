"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type LoginState = { message: string; success: boolean } | null;

export async function requestMagicLinkAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email) return { message: "Please enter your email address.", success: false };

  const headerStore = await headers();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    headerStore.get("origin") ||
    (() => {
      const proto = headerStore.get("x-forwarded-proto") ?? "https";
      const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
      return `${proto}://${host}`;
    })();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { message: error.message, success: false };

  return {
    message: "Check your inbox — a magic link is on its way.",
    success: true,
  };
}
