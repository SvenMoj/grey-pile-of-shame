/**
 * Pure helpers for the per-user hidden-brands preference.
 *
 * No Supabase or Next.js dependencies — fully unit-testable.
 */

/**
 * Normalise the list of brands a user wants to hide.
 *
 * - Only keeps brands that exist in `knownBrands` (prevents stale/junk values).
 * - Deduplicates.
 * - Returns a stable alphabetical sort so the stored value is deterministic.
 */
export function normalizeHiddenBrands(submitted: string[], knownBrands: string[]): string[] {
  const known = new Set(knownBrands);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const brand of submitted) {
    if (known.has(brand) && !seen.has(brand)) {
      seen.add(brand);
      result.push(brand);
    }
  }

  return result.sort();
}
