"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { validatePassword } from "@/lib/auth/password";
import { getBrands } from "@/lib/brands";
import { normalizeHiddenBrands } from "@/lib/brands/hidden-brands";
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

/** Save the user's hidden-brands preference. */
export async function updateHiddenBrandsAction(
  _prev: { message: string; success: boolean },
  formData: FormData,
): Promise<{ message: string; success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated.", success: false };

  const submitted = formData.getAll("hidden_brands") as string[];
  const knownBrands = await getBrands();
  const hidden_brands = normalizeHiddenBrands(submitted, knownBrands);

  const { error } = await supabase.from("profiles").update({ hidden_brands }).eq("id", user.id);

  if (error) return { message: error.message, success: false };
  return {
    message:
      hidden_brands.length > 0
        ? `Preferences saved — ${hidden_brands.length} brand${hidden_brands.length === 1 ? "" : "s"} hidden.`
        : "All brands visible.",
    success: true,
  };
}

/** Save (or clear) the user's Instagram handle stored on their profile. */
export async function updateInstagramHandleAction(
  _prev: { message: string; success: boolean },
  formData: FormData,
): Promise<{ message: string; success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not authenticated.", success: false };

  // Strip leading @ if present and trim whitespace; empty → null
  const raw = (formData.get("instagram_handle") as string) ?? "";
  const handle = raw.trim().replace(/^@/, "") || null;

  const { error } = await supabase
    .from("profiles")
    .update({ instagram_handle: handle })
    .eq("id", user.id);

  if (error) return { message: error.message, success: false };
  return { message: handle ? `Handle saved as @${handle}.` : "Handle cleared.", success: true };
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
