import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Require an authenticated user. Redirects to /login if no session.
 * Parallel to lib/admin/auth.ts — no email check, any authenticated user passes.
 */
export async function getUserOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Require a password to be set before accessing the app (admin is exempt)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email !== adminEmail && !user.user_metadata?.has_password) {
    redirect("/set-password");
  }

  return user;
}
