/**
 * Server-side data fetchers used by the Share Studio route handlers.
 * All functions use the request-scoped Supabase client (cookie auth)
 * so they respect RLS and can read private entities owned by the caller.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";

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

/** Project shape used by the studio share-image route. */
export type ProjectForStudio = {
  id: string;
  title: string;
  cover_image_url: string | null;
  game: string | null;
  faction: string | null;
  /** Title of the first linked recipe (sort_order=0), or null if no recipes. */
  first_recipe_title: string | null;
};

/**
 * Fetch a single project by id for the Studio showcase card.
 * Returns null if not found or the caller doesn't have read access.
 */
export async function getProjectForStudio(id: string): Promise<ProjectForStudio | null> {
  const supabase = await createClient();

  const [projectResult, imageResult, recipeResult] = await Promise.all([
    (supabase as any)
      .from("projects")
      .select("id, title, game, faction")
      .eq("id", id)
      .maybeSingle(),
    (supabase as any)
      .from("project_images")
      .select("image_url, sort_order")
      .eq("project_id", id)
      .order("sort_order")
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("project_recipes")
      .select("recipe:recipes!project_recipes_recipe_id_fkey(title)")
      .eq("project_id", id)
      .order("sort_order")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!projectResult.data) return null;

  const project = projectResult.data as {
    id: string;
    title: string;
    game: string | null;
    faction: string | null;
  };

  return {
    id: project.id,
    title: project.title,
    cover_image_url: (imageResult.data as { image_url: string } | null)?.image_url ?? null,
    game: project.game,
    faction: project.faction,
    first_recipe_title:
      (recipeResult.data as { recipe: { title: string } | null } | null)?.recipe?.title ?? null,
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
