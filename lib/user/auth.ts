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

  return user;
}
