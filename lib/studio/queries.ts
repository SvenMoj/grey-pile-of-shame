/**
 * Server-side data fetchers used by the Share Studio route handlers.
 * All functions use the request-scoped Supabase client (cookie auth)
 * so they respect RLS and can read private entities owned by the caller.
 */

import { createClient } from "@/lib/supabase/server";
import type { PileItem } from "@/lib/pile/types";

/** Fetch the caller's Instagram handle from their profile. Returns null if unset. */
export async function getInstagramHandle(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("instagram_handle")
    .eq("id", user.id)
    .maybeSingle();

  return data?.instagram_handle ?? null;
}

/** Fetch a single miniature item by id. Returns null if not found or unauthorized. */
export async function getModelForStudio(id: string): Promise<
  | (Pick<PileItem, "id" | "display_name" | "state" | "image_url" | "game" | "faction"> & {
      applied_recipe_title: string | null;
    })
  | null
> {
  const supabase = await createClient();

  const [itemResult, appResult] = await Promise.all([
    supabase
      .from("miniature_items")
      .select("id, display_name, state, image_url, game, faction")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recipe_applications")
      .select("recipe:recipes!recipe_applications_recipe_id_fkey(title)")
      .eq("miniature_item_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!itemResult.data) return null;

  const raw = itemResult.data as {
    id: string;
    display_name: string;
    state: string;
    image_url: string | null;
    game: string | null;
    faction: string | null;
  };

  const recipeTitle =
    (appResult.data as { recipe: { title: string } | null } | null)?.recipe?.title ?? null;

  return {
    id: raw.id,
    display_name: raw.display_name,
    state: raw.state as PileItem["state"],
    image_url: raw.image_url,
    game: raw.game,
    faction: raw.faction,
    applied_recipe_title: recipeTitle,
  };
}

export interface StatsPayload {
  /** Models marked as `painted` whose `painted_at` falls in the current calendar month. */
  paintedThisMonth: number;
  /** Points painted this month (sum of point_value for the above). */
  pointsThisMonth: number;
  /** All-time painted model count. */
  totalPainted: number;
  /** All-time total model count. */
  totalModels: number;
}

/**
 * Aggregate pile statistics for the current user.
 * `now` is passed in to keep the function pure / testable — use `new Date()` at the call site.
 */
export async function getStatsForStudio(now: Date): Promise<StatsPayload> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("miniature_items")
    .select("state, point_value, painted_at");

  if (error || !data)
    return { paintedThisMonth: 0, pointsThisMonth: 0, totalPainted: 0, totalModels: 0 };

  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  let paintedThisMonth = 0;
  let pointsThisMonth = 0;
  let totalPainted = 0;
  const totalModels = data.length;

  for (const row of data as {
    state: string;
    point_value: number | null;
    painted_at: string | null;
  }[]) {
    if (row.state === "painted") {
      totalPainted++;
      if (row.painted_at) {
        const d = new Date(row.painted_at);
        if (d.getFullYear() === year && d.getMonth() === month) {
          paintedThisMonth++;
          pointsThisMonth += row.point_value ?? 0;
        }
      }
    }
  }

  return { paintedThisMonth, pointsThisMonth, totalPainted, totalModels };
}
