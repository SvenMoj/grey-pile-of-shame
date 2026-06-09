import { cache } from "react";
import { isPublicSupabaseConfigured, publicClient } from "@/lib/supabase/public";

/**
 * Fetch the distinct list of brand names from the database.
 * Used by recipe brand-substitution (BrandSubstitutePicker) and the
 * hidden-brands preference in settings.
 * Results are cached per request (React cache) to avoid redundant fetches.
 */
export const getBrands = cache(async (): Promise<string[]> => {
  if (!isPublicSupabaseConfigured()) return [];
  const { data, error } = await publicClient.rpc("paint_brands");
  if (error) throw new Error(`Failed to fetch brands: ${error.message}`);
  return (data as string[]) ?? [];
});
