import { cache } from "react";
import { isPublicSupabaseConfigured, publicClient } from "@/lib/supabase/public";

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
