"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type LoginState = { message: string; success: boolean } | null;

export async function requestMagicLinkAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) return { message: "Server configuration error.", success: false };
  if (email !== adminEmail)
    return { message: "Email not authorized for admin access.", success: false };

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "";

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
