/**
 * Server-side data fetchers for the recipes feature.
 *
 * IMPORTANT: uses createClient() from lib/supabase/server.ts (the request-scoped
 * cookie-bound client), NOT publicClient. This is required because:
 *   - Recipes can be private; owners must see their own private rows.
 *   - Inventory cross-ref (getOwnedPaintIds) needs the authenticated user's session.
 *
 * Each exported function creates its own client instance when called from a server
 * component; they are not wrapped in React cache() because the server client is
 * already request-scoped.
 */

import { createClient } from "@/lib/supabase/server";
import type { RawConversionRow } from "./cross-reference";
import type { Recipe, RecipeImage, RecipeListItem, RecipeStep, RecipeWithDetail } from "./types";

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
        "id, step_order, role, target_paint_id, target_hex, technique_note, area_note, created_at, updated_at, paint:paints!recipe_steps_target_paint_id_fkey(id, brand, name, hex, range)",
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

  return {
    ...(recipeResult.data as unknown as Recipe),
    steps: (stepsResult.data ?? []) as unknown as RecipeStep[],
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
    search_query: searchQuery ?? null,
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
 * Return the set of catalog_paint_ids that the current user owns or has marked
 * as running_low. Returns an empty set for unauthenticated viewers (RLS returns nothing).
 */
export async function getOwnedPaintIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_paints")
    .select("catalog_paint_id")
    .in("state", ["owned", "running_low"]);

  if (error) return new Set();
  const ids = (data ?? [])
    .map((row) => row.catalog_paint_id as string | null)
    .filter((id): id is string => id !== null);
  return new Set(ids);
}

/**
 * List all recipes belonging to the current user (for the apply-to-model picker).
 * Includes both private and public (owner sees all their own via RLS).
 */
export async function listMyRecipes(): Promise<RecipeListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, visibility, author_user_id")
    .eq("author_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => ({
    ...(r as unknown as Pick<RecipeListItem, "id" | "title" | "visibility" | "author_user_id">),
    cover_image_url: null,
    step_count: 0,
  }));
}

/**
 * List a user's miniature items (models) for the recipe-detail apply picker.
 */
export async function listMyModels(): Promise<
  { id: string; display_name: string; state: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("miniature_items")
    .select("id, display_name, state")
    .order("display_name");
  if (error) return [];
  return (data ?? []) as { id: string; display_name: string; state: string }[];
}
