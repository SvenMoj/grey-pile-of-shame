"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validateProjectForm, parseProjectRecipesPayload } from "./validation";

export type ProjectFormState = { error: string } | null;

/** Result returned to the client so it can flush staged images before navigating. */
export type SaveProjectResult = { projectId: string; slug: string } | { error: string };

// ─── saveProjectAction ────────────────────────────────────────────────────────

/**
 * Create or update a project together with its recipe links.
 * Recipe links are received as a JSON string in the hidden "project_recipes" field.
 *
 * Returns { projectId, slug } on success so the caller can flush staged images
 * browser-side before navigating.
 *
 * Form fields expected:
 *   _id              (string, empty → create)
 *   title            (string)
 *   slug             (string)
 *   summary          (string, optional)
 *   body             (string, optional)
 *   status           ("draft" | "published", defaults to "draft")
 *   game             (string, optional)
 *   faction          (string, optional)
 *   project_recipes  (JSON string of ParsedProjectRecipeLink[])
 */
export async function saveProjectAction(formData: FormData): Promise<SaveProjectResult> {
  const user = await getAdminUserOrRedirect();

  const projectResult = validateProjectForm(formData);
  if ("errors" in projectResult) {
    const msg = Object.values(projectResult.errors).filter(Boolean).join(" ");
    return { error: msg };
  }

  const rawLinks = formData.get("project_recipes") as string | null;
  const linksResult = parseProjectRecipesPayload(rawLinks ?? "[]");
  if ("errors" in linksResult) {
    return { error: linksResult.errors._ };
  }

  const supabase = await createClient();
  const existingId = ((formData.get("_id") as string) ?? "").trim();
  const isEdit = existingId !== "";

  const { status } = projectResult.data;
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  let projectId: string;
  let slug: string = projectResult.data.slug;

  if (isEdit) {
    // Verify ownership before updating (RLS also blocks it, but surface a clear error).
    const updatePayload: any = {
      title: projectResult.data.title,
      slug: projectResult.data.slug,
      summary: projectResult.data.summary,
      body: projectResult.data.body,
      status,
      game: projectResult.data.game,
      faction: projectResult.data.faction,
    };

    // Only update published_at when transitioning to published; don't overwrite existing.
    if (status === "published") {
      // Check whether it's already published to preserve the original publish date.
      const { data: existing } = await (supabase as any)
        .from("projects")
        .select("published_at, status")
        .eq("id", existingId)
        .maybeSingle();
      if (!existing?.published_at) {
        updatePayload.published_at = publishedAt;
      }
    } else {
      updatePayload.published_at = null;
    }

    const { error } = await (supabase as any)
      .from("projects")
      .update(updatePayload)
      .eq("id", existingId)
      .eq("author_user_id", user.id);

    if (error) return { error: error.message };
    projectId = existingId;
  } else {
    const { data, error } = await (supabase as any)
      .from("projects")
      .insert({
        author_user_id: user.id,
        title: projectResult.data.title,
        slug: projectResult.data.slug,
        summary: projectResult.data.summary,
        body: projectResult.data.body,
        status,
        game: projectResult.data.game,
        faction: projectResult.data.faction,
        published_at: status === "published" ? publishedAt : null,
      })
      .select("id, slug")
      .single();

    if (error) return { error: error.message };
    projectId = data.id as string;
    slug = data.slug as string;
  }

  // Atomically replace recipe links: delete all for this project, reinsert from payload.
  await (supabase as any).from("project_recipes").delete().eq("project_id", projectId);

  if (linksResult.data.length > 0) {
    const rows = linksResult.data.map((link) => ({
      project_id: projectId,
      recipe_id: link.recipe_id,
      area: link.area,
      sort_order: link.sort_order,
      note: link.note,
    }));

    const { error: linksError } = await (supabase as any).from("project_recipes").insert(rows);

    if (linksError) return { error: linksError.message };
  }

  revalidatePath("/");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");
  return { projectId, slug };
}

// ─── deleteProjectAction ──────────────────────────────────────────────────────

/**
 * Delete a project, cleaning up Storage objects first so the bucket stays tidy.
 * Postgres cascades handle project_images / project_recipes rows.
 *
 * Form fields: id (uuid)
 */
export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await getAdminUserOrRedirect();
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();

  // Remove Storage objects under <userId>/<projectId>/ before deleting the row.
  const { data: objects } = await supabase.storage.from("project-images").list(`${user.id}/${id}`);

  if (objects && objects.length > 0) {
    const paths = objects.map((o) => `${user.id}/${id}/${o.name}`);
    await supabase.storage.from("project-images").remove(paths);
  }

  // RLS enforces author_user_id = auth.uid(); cascade removes images/recipes links.
  await (supabase as any).from("projects").delete().eq("id", id).eq("author_user_id", user.id);

  revalidatePath("/");
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

// ─── Image row mutations ──────────────────────────────────────────────────────
// NOTE: File upload stays in the browser (direct to Supabase Storage) because
// server action request bodies are capped at ~1MB. Only the DB row writes go
// through these actions.

export async function addProjectImageAction(formData: FormData): Promise<{ error?: string }> {
  await getAdminUserOrRedirect();

  const projectId = (formData.get("projectId") as string) ?? "";
  const storagePath = (formData.get("storage_path") as string) ?? "";
  const imageUrl = (formData.get("image_url") as string) ?? "";
  const sortOrder = parseInt((formData.get("sort_order") as string) ?? "0", 10);

  if (!projectId || !storagePath || !imageUrl) return { error: "Missing fields." };

  const supabase = await createClient();
  const { error } = await (supabase as any).from("project_images").insert({
    project_id: projectId,
    storage_path: storagePath,
    image_url: imageUrl,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/projects`);
  return {};
}

export async function removeProjectImageAction(formData: FormData): Promise<{ error?: string }> {
  await getAdminUserOrRedirect();

  const imageId = (formData.get("imageId") as string) ?? "";
  const storagePath = (formData.get("storage_path") as string) ?? "";

  if (!imageId) return { error: "Missing image id." };

  const supabase = await createClient();

  if (storagePath) {
    await supabase.storage.from("project-images").remove([storagePath]);
  }

  const { error } = await (supabase as any).from("project_images").delete().eq("id", imageId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/projects`);
  return {};
}
