"use server";

import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { getRecipeById } from "@/lib/recipes/queries";
import { getInstagramHandle } from "@/lib/studio/queries";
import { getProjectForStudio } from "@/lib/studio/queries";

export interface RecipeStepRow {
  role: string;
  /** Human-readable paint label, e.g. "2× Mephiston Red + Nuln Oil". */
  paintLabel: string;
  /** Up to 3 hex strings (with #) for the paints in this step, in mix order. */
  hexes: string[];
}

export interface CanvasData {
  coverImageUrl: string;
  /** All image URLs sorted by sort_order; coverImageUrl === images[0]. */
  images: string[];
  title: string;
  /** Shown below the title in smaller text — game/faction for projects, null for recipes. */
  subtitle: string | null;
  /** Up to 8 hex strings (with #) derived from recipe step paints. Empty for projects. */
  swatchHexes: string[];
  /** Ordered recipe steps for the "full steps" overlay. Empty for projects. */
  steps: RecipeStepRow[];
  handle: string | null;
}

/**
 * Fetch recipe data for the canvas editor.
 * Returns null if the recipe has no cover image (fall back to server-route card).
 */
export async function getRecipeCanvasData(id: string): Promise<CanvasData | null> {
  await getAdminUserOrRedirect();
  const [recipe, handle] = await Promise.all([getRecipeById(id), getInstagramHandle()]);
  if (!recipe) return null;

  const sortedImages = [...recipe.images].sort((a, b) => a.sort_order - b.sort_order);
  const coverImage = sortedImages[0] ?? null;
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
    images: sortedImages.map((img) => img.image_url),
    title: recipe.title,
    subtitle: null,
    swatchHexes,
    steps,
    handle,
  };
}

/**
 * Fetch project data for the canvas editor.
 * Returns null if the project has no cover image (fall back to server-route card).
 */
export async function getModelCanvasData(id: string): Promise<CanvasData | null> {
  await getAdminUserOrRedirect();
  const [project, handle] = await Promise.all([getProjectForStudio(id), getInstagramHandle()]);
  if (!project || !project.cover_image_url) return null;

  const subtitle = [project.game, project.faction].filter(Boolean).join(" · ") || null;

  return {
    coverImageUrl: project.cover_image_url,
    images: [project.cover_image_url],
    title: project.title,
    subtitle,
    swatchHexes: [],
    steps: [],
    handle,
  };
}
