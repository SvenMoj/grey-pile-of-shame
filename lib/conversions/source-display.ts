/**
 * Shared display mappings for conversion source types.
 * Used by ConversionTable and the paint detail page.
 */

export const SOURCE_LABELS: Record<string, string> = {
  official_chart: "Official",
  community: "Community",
  hex_derived: "Color match",
  transitive: "Bridged",
};

export const SOURCE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  official_chart: "default",
  community: "secondary",
  hex_derived: "outline",
  transitive: "secondary",
};
