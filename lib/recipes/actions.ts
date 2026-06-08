"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserOrRedirect } from "@/lib/user/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validateRecipeForm, parseStepsPayload } from "./validation";

export type RecipeFormState = { error: string } | null;

// ─── saveRecipeAction ────────────────────────────────────────────────────────

/**
 * Create or update a recipe together with its full step list.
 * Steps are received as a JSON string in the hidden "steps" field so the
 * entire recipe + steps write happens in one server round-trip.
 *
 * Form fields expected:
 *   _id          (string, empty → create)
 *   title        (string)
 *   description  (string, optional)
 *   visibility   ("private" | "public", optional, defaults to "private")
 *   source_url   (string, optional)
 *   steps        (JSON string of ParsedStep[])
 */
export async function saveRecipeAction(
  _prev: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const user = await getUserOrRedirect();

  const recipeResult = validateRecipeForm(formData);
  if ("errors" in recipeResult) {
    const msg = Object.values(recipeResult.errors).filter(Boolean).join(" ");
    return { error: msg };
  }

  const rawSteps = formData.get("steps") as string | null;
  const stepsResult = parseStepsPayload(rawSteps ?? "[]");
  if ("errors" in stepsResult) {
    return { error: stepsResult.errors._ };
  }

  const supabase = await createClient();
  const existingId = ((formData.get("_id") as string) ?? "").trim();
  const isEdit = existingId !== "";

  let recipeId: string;

  if (isEdit) {
    // Verify ownership before updating (RLS would also block it, but we want a clear error).
    const { error } = await supabase
      .from("recipes")
      .update({
        title: recipeResult.data.title,
        description: recipeResult.data.description,
        visibility: recipeResult.data.visibility,
        source_url: recipeResult.data.source_url,
      })
      .eq("id", existingId)
      .eq("author_user_id", user.id);

    if (error) return { error: error.message };
    recipeId = existingId;
  } else {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        author_user_id: user.id,
        title: recipeResult.data.title,
        description: recipeResult.data.description,
        visibility: recipeResult.data.visibility,
        source_url: recipeResult.data.source_url,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    recipeId = data.id as string;
  }

  // Atomically replace all steps via the save_recipe_steps RPC (delete + bulk-insert
  // in a single transaction). This ensures the on-screen order is always authoritative,
  // including newly-added steps that are interspersed between existing ones.
  const { error: stepsError } = await supabase.rpc("save_recipe_steps", {
    p_recipe_id: recipeId,
    p_steps: stepsResult.data as unknown as import("@/lib/supabase/database.types").Json,
  });

  if (stepsError) return { error: stepsError.message };

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

// ─── deleteRecipeAction ──────────────────────────────────────────────────────

/**
 * Delete a recipe, cleaning up Storage objects first so the bucket stays tidy.
 * Cascades in Postgres handle steps / images / applications rows.
 *
 * Form fields: id (uuid)
 */
export async function deleteRecipeAction(formData: FormData): Promise<void> {
  const user = await getUserOrRedirect();
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();

  // Remove Storage objects under <userId>/<recipeId>/ before deleting the row
  // so the bucket does not accumulate orphaned files.
  const { data: objects } = await supabase.storage.from("recipe-images").list(`${user.id}/${id}`);

  if (objects && objects.length > 0) {
    const paths = objects.map((o) => `${user.id}/${id}/${o.name}`);
    await supabase.storage.from("recipe-images").remove(paths);
  }

  // RLS enforces author_user_id = auth.uid(); cascade removes steps/images/applications.
  await supabase.from("recipes").delete().eq("id", id).eq("author_user_id", user.id);

  revalidatePath("/recipes");
  redirect("/recipes");
}

// ─── Image row mutations ─────────────────────────────────────────────────────
// NOTE: File upload stays in the browser (direct to Supabase Storage) because
// server action request bodies are capped at ~1MB by default; routing photos
// through FormData would require bumping serverActions.bodySizeLimit and would
// be slower than the existing direct-to-Storage path.
// Only the DB row writes go through these actions.

export async function addRecipeImageAction(formData: FormData): Promise<{ error?: string }> {
  await getUserOrRedirect();

  const recipeId = (formData.get("recipeId") as string) ?? "";
  const storagePath = (formData.get("storage_path") as string) ?? "";
  const imageUrl = (formData.get("image_url") as string) ?? "";
  const sortOrder = parseInt((formData.get("sort_order") as string) ?? "0", 10);

  if (!recipeId || !storagePath || !imageUrl) return { error: "Missing fields." };

  const supabase = await createClient();
  const { error } = await supabase.from("recipe_images").insert({
    recipe_id: recipeId,
    storage_path: storagePath,
    image_url: imageUrl,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/edit`);
  return {};
}

export async function removeRecipeImageAction(formData: FormData): Promise<{ error?: string }> {
  await getUserOrRedirect();

  const imageId = (formData.get("imageId") as string) ?? "";
  const storagePath = (formData.get("storage_path") as string) ?? "";
  const recipeId = (formData.get("recipeId") as string) ?? "";

  if (!imageId) return { error: "Missing image id." };

  const supabase = await createClient();

  if (storagePath) {
    await supabase.storage.from("recipe-images").remove([storagePath]);
  }

  const { error } = await supabase.from("recipe_images").delete().eq("id", imageId);
  if (error) return { error: error.message };

  if (recipeId) {
    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath(`/recipes/${recipeId}/edit`);
  }
  return {};
}

export async function reorderRecipeImagesAction(formData: FormData): Promise<{ error?: string }> {
  await getUserOrRedirect();

  const recipeId = (formData.get("recipeId") as string) ?? "";
  const raw = (formData.get("orderedIds") as string) ?? "[]";

  let orderedIds: string[];
  try {
    orderedIds = JSON.parse(raw) as string[];
  } catch {
    return { error: "Invalid orderedIds payload." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_recipe_images", {
    p_recipe_id: recipeId,
    p_ordered_ids: orderedIds,
  });

  if (error) return { error: error.message };

  if (recipeId) {
    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath(`/recipes/${recipeId}/edit`);
  }
  return {};
}
