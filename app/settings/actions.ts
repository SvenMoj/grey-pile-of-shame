"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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
