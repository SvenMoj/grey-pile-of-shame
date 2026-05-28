import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL env var is required");
  return email;
}

export async function getAdminUserOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== getAdminEmail()) {
    redirect("/admin/login");
  }

  return user;
}
