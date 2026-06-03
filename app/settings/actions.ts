"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { validatePassword } from "@/lib/auth/password";
import type { LoginState } from "@/app/login/actions";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * DSGVO deletion stub: writes deletion_requested_at to profiles, signs out.
 * Hard-delete is a later admin/cron job; cascade FKs on all user-domain tables
 * are already wired (on delete cascade from auth.users).
 */
export async function requestAccountDeletionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await adminClient
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  await supabase.auth.signOut();
  redirect("/login?message=deletion_requested");
}

export async function updatePasswordAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = (formData.get("password") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  const validationError = validatePassword(password, confirm);
  if (validationError) return { message: validationError, success: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password,
    data: { has_password: true },
  });

  if (error) return { message: error.message, success: false };

  return { message: "Password updated successfully.", success: true };
}
