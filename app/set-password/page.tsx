import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import SetPasswordForm from "./SetPasswordForm";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Already done — skip through (admin or user who has a password)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email === adminEmail || user.user_metadata?.has_password) {
    redirect("/pile");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <SetPasswordForm />
      </main>
    </>
  );
}
