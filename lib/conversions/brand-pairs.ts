import { cache } from "react";
import { isPublicSupabaseConfigured, publicClient } from "@/lib/supabase/public";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PublicPaintSummary = {
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

/** A conversion row augmented with the joined paint A and paint B data. */
export type PublicConversion = {
  id: string;
  confidence: number;
  source_type: "official_chart" | "community" | "hex_derived";
  source_url: string | null;
  notes: string | null;
  verified_count: number;
  disputed_count: number;
  paint_a: PublicPaintSummary;
  paint_b: PublicPaintSummary;
};

export type BrandPairCount = {
  brand_a: string;
  brand_b: string;
  n: number;
};

export type FaqItem = {
  question: string;
  answer: string;
};

// ---------------------------------------------------------------------------
// DB queries (cached per build render to avoid redundant fetches)
// ---------------------------------------------------------------------------

/**
 * Returns the count of conversions for every ordered brand pair.
 * Used to build generateStaticParams and populate index page link counts.
 */
export const getBrandPairCounts = cache(async (): Promise<BrandPairCount[]> => {
  if (!isPublicSupabaseConfigured()) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (publicClient as any).rpc("brand_pair_conversion_counts");
  if (error)
    throw new Error(`brand_pair_conversion_counts: ${(error as { message: string }).message}`);
  // The RPC returns { brand_a, brand_b, n } where n is a bigint — Supabase
  // converts it to a JS number when it fits safely, but coerce to be safe.
  return ((data as { brand_a: string; brand_b: string; n: number | string }[]) ?? []).map(
    (row) => ({ brand_a: row.brand_a, brand_b: row.brand_b, n: Number(row.n) }),
  );
});

/**
 * Fetch all conversions where paint_a is from `fromBrand` and paint_b is
 * from `toBrand`, ordered by confidence (desc) then verified_count (desc).
 */
export async function getConversionsForPair(
  fromBrand: string,
  toBrand: string,
): Promise<PublicConversion[]> {
  if (!isPublicSupabaseConfigured()) return [];
  const { data, error } = await publicClient
    .from("conversions")
    .select(
      "id, confidence, source_type, source_url, notes, verified_count, disputed_count, paint_a:paints!paint_a_id!inner(brand, name, hex, range), paint_b:paints!paint_b_id!inner(brand, name, hex, range)",
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("paint_a.brand" as any, fromBrand)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("paint_b.brand" as any, toBrand);

  if (error) throw new Error(`getConversionsForPair: ${error.message}`);
  const rows = (data ?? []) as unknown as PublicConversion[];
  return sortConversions(rows);
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested, no DB dependency)
// ---------------------------------------------------------------------------

/**
 * Sort conversions by confidence descending, then verified_count descending.
 * Returns a new array without mutating the input.
 */
export function sortConversions(rows: PublicConversion[]): PublicConversion[] {
  return [...rows].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.verified_count - a.verified_count;
  });
}

/**
 * Generate FAQ items for a brand-pair conversion page.
 * These are used both for the rendered FAQ section and for FAQPage JSON-LD.
 */
export function buildFaqItems(from: string, to: string, rows: PublicConversion[]): FaqItem[] {
  const count = rows.length;
  const officialCount = rows.filter((r) => r.source_type === "official_chart").length;
  const topMatch = rows[0];
  const avgConfidence = count > 0 ? (rows.reduce((s, r) => s + r.confidence, 0) / count) * 100 : 0;

  const items: FaqItem[] = [
    {
      question: `How many ${from} paints have a ${to} equivalent?`,
      answer: `This chart lists ${count} ${from} paint${count === 1 ? "" : "s"} with a known ${to} substitute. ${
        officialCount > 0
          ? `${officialCount} of these ${officialCount === 1 ? "match comes" : "matches come"} from an official conversion chart.`
          : "All matches are community-sourced or color-derived."
      }`,
    },
    {
      question: `How accurate are the ${from} to ${to} conversions?`,
      answer: `Accuracy is rated by confidence score. The matches shown here average ${avgConfidence.toFixed(0)}% confidence. ${
        officialCount > 0
          ? "Official chart matches are the most reliable. Community and color-derived matches may require a test swatch before committing to a whole model."
          : "These matches are community-sourced or computed from color distance — always test on a spare before painting a whole model."
      }`,
    },
    {
      question: `Can I use ${to} paints as a direct substitute for ${from}?`,
      answer: `In most cases yes — ${to} and ${from} paints are broadly compatible and can be swapped for base coats and layering. However, paint consistency, pigment density, and finish (matte/satin/gloss) may differ slightly between brands. Always do a test swatch first when precision matters.`,
    },
  ];

  if (topMatch) {
    items.push({
      question: `What is the best ${to} alternative to ${topMatch.paint_a.name}?`,
      answer: `The closest match is ${topMatch.paint_b.name} (${topMatch.paint_b.range ?? to}), with ${(topMatch.confidence * 100).toFixed(0)}% confidence${topMatch.source_type === "official_chart" ? " according to an official conversion chart" : ""}.`,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// JSON-LD builders (pure, no DB)
// ---------------------------------------------------------------------------

export function buildItemListJsonLd(
  from: string,
  to: string,
  rows: PublicConversion[],
  baseUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${from} to ${to} Paint Conversions`,
    description: `${rows.length} ${from} paints with their ${to} equivalents`,
    url: `${baseUrl}/convert/${encodeURIComponent(from.toLowerCase())}/${encodeURIComponent(to.toLowerCase())}`,
    numberOfItems: rows.length,
    itemListElement: rows.map((row, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${row.paint_a.name} → ${row.paint_b.name}`,
      description: `${from} ${row.paint_a.name} (${row.paint_a.range ?? from}) → ${to} ${row.paint_b.name} (${row.paint_b.range ?? to}), ${(row.confidence * 100).toFixed(0)}% confidence`,
    })),
  };
}

export function buildFaqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@id": crumb.url,
        name: crumb.name,
      },
    })),
  };
}
