"use server";

import { adminClient } from "@/lib/supabase/admin";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { parsePaintForm } from "@/lib/admin/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPaintAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const result = parsePaintForm(formData);
  if ("errors" in result) {
    const msg = Object.values(result.errors).filter(Boolean).join("; ");
    redirect(`/admin/paints/new?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await adminClient.from("paints").insert(result.data as never);
  if (error) {
    redirect(`/admin/paints/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/paints");
  redirect("/admin/paints");
}

export async function updatePaintAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const id = (formData.get("_id") as string)?.trim();
  if (!id) redirect("/admin/paints");

  const result = parsePaintForm(formData);
  if ("errors" in result) {
    const msg = Object.values(result.errors).filter(Boolean).join("; ");
    redirect(`/admin/paints/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await adminClient
    .from("paints")
    .update(result.data as never)
    .eq("id", id);
  if (error) {
    redirect(
      `/admin/paints/${encodeURIComponent(id)}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/paints");
  redirect("/admin/paints");
}

export async function softDeletePaintAction(formData: FormData) {
  await getAdminUserOrRedirect();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return;

  await adminClient
    .from("paints")
    .update({
      status: "discontinued",
      discontinued_date: new Date().toISOString().slice(0, 10),
    } as never)
    .eq("id", id);

  revalidatePath("/admin/paints");
}
