/**
 * Client-side fuzzy matching for the inventory owned-items filter.
 *
 * Mirrors pg_trgm's word_similarity concept so the UX is consistent with the
 * catalog search (which uses the server-side search_paints RPC):
 *   - Dice coefficient over character trigrams for typo tolerance
 *   - Short queries (< 3 chars) fall back to plain substring matching
 *   - Empty/whitespace queries return the full list unchanged
 */

/** Normalise a string: strip diacritics, lowercase, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Build the set of 3-character substrings (trigrams) of an already-normalised string. */
function trigramSet(normalised: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i <= normalised.length - 3; i++) {
    set.add(normalised.slice(i, i + 3));
  }
  return set;
}

/** Dice coefficient between two trigram sets (0–1). */
function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  return (2 * intersection) / (a.size + b.size);
}

/**
 * Trigram similarity between two strings (0 = unrelated, 1 = identical).
 * Both strings are normalised internally.
 */
export function trigramSimilarity(a: string, b: string): number {
  return diceCoefficient(trigramSet(normalize(a)), trigramSet(normalize(b)));
}

/**
 * Fuzzy-filter `items` by `query`, returning only items whose best text-field
 * score meets `threshold`, sorted by score descending.
 *
 * @param query     - User-typed search string.
 * @param items     - Array of items to filter.
 * @param getText   - Extracts the text fields to match against for each item.
 *                    Nullish fields are skipped.
 * @param threshold - Minimum similarity score to include (default 0.3).
 */
export function fuzzyFilter<T>(
  query: string,
  items: T[],
  getText: (item: T) => (string | null | undefined)[],
  threshold = 0.3,
): T[] {
  const nq = normalize(query);
  if (!nq) return items;

  // Short queries: trigrams are meaningless with < 3 chars; use substring match.
  if (nq.length < 3) {
    return items.filter((item) =>
      getText(item).some((field) => field != null && normalize(field).includes(nq)),
    );
  }

  const scored: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    const fields = getText(item).filter((f): f is string => f != null && f.length > 0);
    let best = 0;

    for (const field of fields) {
      const nf = normalize(field);
      // Exact substring match → top score (short-circuit the loop).
      if (nf.includes(nq)) {
        best = 1;
        break;
      }
      const sim = diceCoefficient(trigramSet(nq), trigramSet(nf));
      if (sim > best) best = sim;
    }

    if (best >= threshold) {
      scored.push({ item, score: best });
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
