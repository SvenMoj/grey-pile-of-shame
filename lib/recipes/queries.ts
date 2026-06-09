/**
 * Server-side data fetchers for the recipes feature.
 *
 * IMPORTANT: uses createClient() from lib/supabase/server.ts (the request-scoped
 * cookie-bound client), NOT publicClient. This is required because:
 *   - Recipes can be private; owners must see their own private rows.
 *
 * Each exported function creates its own client instance when called from a server
 * component; they are not wrapped in React cache() because the server client is
 * already request-scoped.
 */

import { createClient } from "@/lib/supabase/server";
import type { RawConversionRow } from "./cross-reference";
import type {
  Recipe,
  RecipeImage,
  RecipeListItem,
  RecipeStep,
  RecipeStepComponent,
  RecipeWithDetail,
} from "./types";

// ─── Recipe detail ────────────────────────────────────────────────────────────

/**
 * Fetch a single recipe with its ordered steps (joined to catalog paints) and
 * ordered images. RLS returns null for private recipes that the viewer doesn't own.
 */
export async function getRecipeById(id: string): Promise<RecipeWithDetail | null> {
  const supabase = await createClient();

  const [recipeResult, stepsResult, imagesResult] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("recipe_steps")
      .select(
        "id, step_order, role, technique_note, area_note, paints:recipe_step_paints!recipe_step_paints_step_id_fkey(id, position, paint_id, hex, ratio, paint:paints!recipe_step_paints_paint_id_fkey(id, brand, name, hex, range))",
      )
      .eq("recipe_id", id)
      .order("step_order"),
    supabase
      .from("recipe_images")
      .select("id, storage_path, image_url, sort_order")
      .eq("recipe_id", id)
      .order("sort_order"),
  ]);

  if (recipeResult.error || !recipeResult.data) return null;

  // Sort each step's paint components by position (PostgREST nested-embed ordering
  // is not guaranteed, so we sort in JS after fetch).
  const rawSteps = (stepsResult.data ?? []) as unknown as (Omit<RecipeStep, "paints"> & {
    paints: RecipeStepComponent[];
  })[];
  const steps: RecipeStep[] = rawSteps.map((s) => ({
    ...s,
    paints: [...s.paints].sort((a, b) => a.position - b.position),
  }));

  return {
    ...(recipeResult.data as unknown as Recipe),
    steps,
    images: (imagesResult.data ?? []) as unknown as RecipeImage[],
  };
}

// ─── Public recipe list ───────────────────────────────────────────────────────

/**
 * List public recipes, optionally filtered by title or paint name/brand.
 * Calls the search_recipes RPC which ORs title against paint name/brand in one query.
 */
export async function listPublicRecipes(searchQuery?: string): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_recipes", {
    search_query: searchQuery ?? undefined,
    result_limit: 50,
  });
  if (error) throw new Error(`search_recipes RPC: ${error.message}`);
  return (data ?? []) as RecipeListItem[];
}

// ─── Cross-reference data ─────────────────────────────────────────────────────

/**
 * Fetch all conversions that touch any of the given paint ids (in either direction).
 * Returns raw rows for the caller to index via indexConversionsByRecipePaint().
 * Guards against empty input (which would produce a malformed .in.() filter).
 */
export async function getConversionsForPaints(paintIds: string[]): Promise<RawConversionRow[]> {
  if (paintIds.length === 0) return [];

  const supabase = await createClient();
  const inList = paintIds.join(",");
  const { data, error } = await supabase
    .from("conversions")
    .select(
      "confidence, paint_a:paints!paint_a_id(id, brand, name, hex, range), paint_b:paints!paint_b_id(id, brand, name, hex, range)",
    )
    .or(`paint_a_id.in.(${inList}),paint_b_id.in.(${inList})`);

  if (error) throw new Error(`getConversionsForPaints: ${error.message}`);
  return (data ?? []) as unknown as RawConversionRow[];
}

/**
 * List all recipes belonging to the current user, with cover image and step count.
 * Includes both private and public (owner sees all their own via RLS).
 * Used for: the "Your recipes" section on /recipes and the model apply-picker.
 */
export async function listMyRecipes(): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `id, title, visibility, author_user_id,
       cover:recipe_images!recipe_images_recipe_id_fkey(image_url, sort_order),
       steps:recipe_steps!recipe_steps_recipe_id_fkey(id)`,
    )
    .eq("author_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r) => {
    const images = (r.cover as { image_url: string; sort_order: number }[] | null) ?? [];
    const cover = images.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
    const steps = (r.steps as { id: string }[] | null) ?? [];
    return {
      id: r.id as string,
      title: r.title as string,
      visibility: r.visibility as RecipeListItem["visibility"],
      author_user_id: r.author_user_id as string,
      cover_image_url: cover?.image_url ?? null,
      step_count: steps.length,
    };
  });
}
