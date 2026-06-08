"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserOrRedirect } from "@/lib/user/auth";
import { revalidatePath } from "next/cache";
import type { RecipeApplicationStatus } from "./types";

const VALID_STATUSES: RecipeApplicationStatus[] = ["planned", "in_progress", "done"];

// ─── applyRecipeAction ────────────────────────────────────────────────────────

/**
 * Apply a recipe to a model (upsert on the unique (miniature_item_id, recipe_id) pair).
 * If an application already exists, its status is updated; otherwise a new row is inserted.
 *
 * Form fields: miniatureItemId, recipeId, status (optional, defaults to "planned")
 */
export async function applyRecipeAction(formData: FormData): Promise<{ error?: string }> {
  const user = await getUserOrRedirect();

  const miniatureItemId = ((formData.get("miniatureItemId") as string) ?? "").trim();
  const recipeId = ((formData.get("recipeId") as string) ?? "").trim();
  const rawStatus = ((formData.get("status") as string) ?? "planned").trim();
  const status: RecipeApplicationStatus = VALID_STATUSES.includes(
    rawStatus as RecipeApplicationStatus,
  )
    ? (rawStatus as RecipeApplicationStatus)
    : "planned";

  if (!miniatureItemId || !recipeId) return { error: "Missing fields." };

  const supabase = await createClient();

  // Check for an existing application on the unique pair.
  const { data: existing } = await supabase
    .from("recipe_applications")
    .select("id")
    .eq("miniature_item_id", miniatureItemId)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("recipe_applications")
      .update({ status })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("recipe_applications").insert({
      user_id: user.id,
      miniature_item_id: miniatureItemId,
      recipe_id: recipeId,
      status,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/model/${miniatureItemId}`);
  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

// ─── setApplicationStatusAction ───────────────────────────────────────────────

/**
 * Update the status of an existing recipe application.
 *
 * Form fields: applicationId, status, miniatureItemId (for revalidation), recipeId (optional)
 */
export async function setApplicationStatusAction(formData: FormData): Promise<{ error?: string }> {
  await getUserOrRedirect();

  const applicationId = ((formData.get("applicationId") as string) ?? "").trim();
  const rawStatus = ((formData.get("status") as string) ?? "").trim();
  const miniatureItemId = ((formData.get("miniatureItemId") as string) ?? "").trim();
  const recipeId = ((formData.get("recipeId") as string) ?? "").trim();

  if (!applicationId || !VALID_STATUSES.includes(rawStatus as RecipeApplicationStatus)) {
    return { error: "Invalid fields." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_applications")
    .update({ status: rawStatus as RecipeApplicationStatus })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  if (miniatureItemId) revalidatePath(`/model/${miniatureItemId}`);
  if (recipeId) revalidatePath(`/recipes/${recipeId}`);
  return {};
}

// ─── removeApplicationAction ──────────────────────────────────────────────────

/**
 * Remove a recipe application (unapply).
 *
 * Form fields: applicationId, miniatureItemId (for revalidation), recipeId (optional)
 */
export async function removeApplicationAction(formData: FormData): Promise<{ error?: string }> {
  await getUserOrRedirect();

  const applicationId = ((formData.get("applicationId") as string) ?? "").trim();
  const miniatureItemId = ((formData.get("miniatureItemId") as string) ?? "").trim();
  const recipeId = ((formData.get("recipeId") as string) ?? "").trim();

  if (!applicationId) return { error: "Missing applicationId." };

  const supabase = await createClient();
  const { error } = await supabase.from("recipe_applications").delete().eq("id", applicationId);

  if (error) return { error: error.message };

  if (miniatureItemId) revalidatePath(`/model/${miniatureItemId}`);
  if (recipeId) revalidatePath(`/recipes/${recipeId}`);
  return {};
}
