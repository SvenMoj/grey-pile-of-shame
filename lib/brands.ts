import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { isPublicSupabaseConfigured, publicClient } from "@/lib/supabase/public";

export type PaintRow = Database["public"]["Tables"]["paints"]["Row"];

export type BrandOverview = {
  brand: string;
  slug: string;
  paint_count: number;
  range_count: number;
  sample_hexes: string[];
};

export type PaintGroup<T extends { range: string | null } = PaintRow> = {
  range: string;
  paints: T[];
};

/**
 * Convert a brand display name to a URL-safe slug.
 * e.g. "Coat d'Arms" → "coat-d-arms", "Scale75" → "scale75"
 */
export function slugifyBrand(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

/**
 * Group an ordered array of paints by their `range` field.
 * Paints with a null range are bucketed into "Other" and placed last.
 * The order of groups follows the first appearance of each range in the input.
 */
export function groupPaintsByRange<T extends { range: string | null }>(
  paints: T[],
): PaintGroup<T>[] {
  const order: string[] = [];
  const map = new Map<string, T[]>();

  for (const paint of paints) {
    const range = paint.range ?? "Other";
    if (!map.has(range)) {
      order.push(range);
      map.set(range, []);
    }
    map.get(range)!.push(paint);
  }

  // Move "Other" to the end if present
  const otherIndex = order.indexOf("Other");
  if (otherIndex !== -1 && otherIndex < order.length - 1) {
    order.splice(otherIndex, 1);
    order.push("Other");
  }

  return order.map((range) => ({ range, paints: map.get(range)! }));
}

/**
 * Fetch per-brand aggregates (paint count, range count, sample hex colours).
 * Results are cached per request to deduplicate across pages.
 */
export const getBrandOverviews = cache(async (): Promise<BrandOverview[]> => {
  if (!isPublicSupabaseConfigured()) return [];
  const { data, error } = await publicClient.rpc("brand_overview");
  if (error) throw new Error(`Failed to fetch brand overviews: ${error.message}`);
  return ((data ?? []) as BrandOverview[]).map((row) => ({
    ...row,
    slug: slugifyBrand(row.brand),
  }));
});

/**
 * Fetch all paints for a given brand, ordered by range then name.
 * Uses an RPC to avoid the PostgREST 1000-row cap.
 */
export const getPaintsForBrand = cache(async (brand: string): Promise<PaintRow[]> => {
  if (!isPublicSupabaseConfigured()) return [];
  const { data, error } = await publicClient.rpc("paints_by_brand", { p_brand: brand });
  if (error) throw new Error(`Failed to fetch paints for brand "${brand}": ${error.message}`);
  return (data ?? []) as PaintRow[];
});

/**
 * Resolve a URL slug back to its canonical brand display name.
 * Accepts a list of all known brands to check against.
 * Returns null if no match is found.
 */
export function resolveBrandSlug(slug: string, brands: string[]): string | null {
  for (const brand of brands) {
    if (slugifyBrand(brand) === slug) return brand;
  }
  return null;
}

/**
 * Fetch the distinct list of brand names from the database.
 * Results are cached per request (React cache) to avoid redundant fetches
 * when multiple pages/params resolve brands during the same build render.
 */
export const getBrands = cache(async (): Promise<string[]> => {
  if (!isPublicSupabaseConfigured()) return [];
  const { data, error } = await publicClient.rpc("paint_brands");
  if (error) throw new Error(`Failed to fetch brands: ${error.message}`);
  return (data as string[]) ?? [];
});

/**
 * Resolve a URL slug to a canonical brand name using the live brand list.
 * Returns null if the slug does not correspond to any known brand.
 */
export async function resolveBrandSlugFromDb(slug: string): Promise<string | null> {
  const brands = await getBrands();
  return resolveBrandSlug(slug, brands);
}
