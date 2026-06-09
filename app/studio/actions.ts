"use server";

import { getUserOrRedirect } from "@/lib/user/auth";
import { getRecipeById } from "@/lib/recipes/queries";
import { getInstagramHandle } from "@/lib/studio/queries";
import { createClient } from "@/lib/supabase/server";

export interface RecipeStepRow {
  role: string;
  /** Human-readable paint label, e.g. "2× Mephiston Red + Nuln Oil". */
  paintLabel: string;
  /** Up to 3 hex strings (with #) for the paints in this step, in mix order. */
  hexes: string[];
}

export interface CanvasData {
  coverImageUrl: string;
  title: string;
  /** Shown below the title in smaller text — state label for models, null for recipes. */
  subtitle: string | null;
  /** Up to 8 hex strings (with #) derived from recipe step paints. Empty for models. */
  swatchHexes: string[];
  /** Ordered recipe steps for the "full steps" overlay. Empty for models. */
  steps: RecipeStepRow[];
  handle: string | null;
}

/**
 * Fetch recipe data for the canvas editor.
 * Returns null if the recipe has no cover image (fall back to server-route card).
 */
export async function getRecipeCanvasData(id: string): Promise<CanvasData | null> {
  await getUserOrRedirect();
  const [recipe, handle] = await Promise.all([getRecipeById(id), getInstagramHandle()]);
  if (!recipe) return null;

  const coverImage = [...recipe.images].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
  if (!coverImage) return null;

  const swatchHexes: string[] = [];
  for (const step of recipe.steps) {
    for (const comp of step.paints) {
      const hex = comp.hex ?? comp.paint?.hex ?? null;
      if (hex && !swatchHexes.includes(`#${hex}`)) swatchHexes.push(`#${hex}`);
      if (swatchHexes.length >= 8) break;
    }
    if (swatchHexes.length >= 8) break;
  }

  const steps: RecipeStepRow[] = recipe.steps.map((step) => {
    const hexes: string[] = [];
    for (const c of step.paints) {
      const h = c.hex ?? c.paint?.hex ?? null;
      if (h && !hexes.includes(`#${h}`)) hexes.push(`#${h}`);
      if (hexes.length >= 3) break;
    }
    return {
      role: step.role,
      paintLabel: step.paints
        .map((c) => (c.ratio > 1 ? `${c.ratio}× ` : "") + (c.paint?.name ?? "Custom"))
        .join(" + "),
      hexes,
    };
  });

  return {
    coverImageUrl: coverImage.image_url,
    title: recipe.title,
    subtitle: null,
    swatchHexes,
    steps,
    handle,
  };
}

/**
 * Fetch model data for the canvas editor.
 * Returns null if the model has no photo (fall back to server-route card).
 */
export async function getModelCanvasData(id: string): Promise<CanvasData | null> {
  await getUserOrRedirect();

  const supabase = await createClient();
  const [{ data: row }, handle] = await Promise.all([
    supabase
      .from("miniature_items")
      .select("display_name, state, image_url")
      .eq("id", id)
      .maybeSingle(),
    getInstagramHandle(),
  ]);

  if (!row || !row.image_url) return null;

  return {
    coverImageUrl: row.image_url as string,
    title: row.display_name as string,
    subtitle: (row.state as string).replace(/_/g, " "),
    swatchHexes: [],
    steps: [],
    handle,
  };
}
