"use server";

import { adminClient } from "@/lib/supabase/admin";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { parseConversionForm } from "@/lib/admin/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createConversionAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const result = parseConversionForm(formData);
  if ("errors" in result) {
    const msg = Object.values(result.errors).filter(Boolean).join("; ");
    redirect(`/admin/conversions/new?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await adminClient.from("conversions").insert(result.data as never);
  if (error) {
    redirect(`/admin/conversions/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/conversions");
  redirect("/admin/conversions");
}

export async function updateConversionAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const id = (formData.get("_id") as string)?.trim();
  if (!id) redirect("/admin/conversions");

  const result = parseConversionForm(formData);
  if ("errors" in result) {
    const msg = Object.values(result.errors).filter(Boolean).join("; ");
    redirect(`/admin/conversions/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await adminClient
    .from("conversions")
    .update(result.data as never)
    .eq("id", id);
  if (error) {
    redirect(
      `/admin/conversions/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/conversions");
  redirect("/admin/conversions");
}

export async function deleteConversionAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return;

  await adminClient.from("conversions").delete().eq("id", id);
  revalidatePath("/admin/conversions");
}
