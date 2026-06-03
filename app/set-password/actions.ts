"use server";

import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/auth/password";
import { redirect } from "next/navigation";
import type { LoginState } from "@/app/login/actions";

export async function setPasswordAction(
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

  redirect("/pile");
}
