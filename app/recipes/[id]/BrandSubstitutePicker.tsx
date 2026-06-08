"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { PaintSwatch } from "@/components/PaintSwatch";
import { selectBrandSubstitutes, type ConversionEdge } from "@/lib/recipes/cross-reference";
import type { RecipeStep } from "@/lib/recipes/types";

type Props = {
  steps: RecipeStep[];
  brands: string[];
  /** Conversion edges serialized from the server component — keyed by fromPaintId. */
  conversionEdges: [string, ConversionEdge[]][];
};

export function BrandSubstitutePicker({ steps, brands, conversionEdges }: Props) {
  const [targetBrand, setTargetBrand] = useState("");

  const conversionsByPaint = new Map(conversionEdges);

  // Collect unique catalog paint ids from all step components.
  const seenIds = new Set<string>();
  const recipePaintIds: string[] = [];
  for (const step of steps) {
    for (const comp of step.paints) {
      if (comp.paint_id && !seenIds.has(comp.paint_id)) {
        seenIds.add(comp.paint_id);
        recipePaintIds.push(comp.paint_id);
      }
    }
  }

  // Map each paint_id to the first step that uses it (for display labels).
  const paintIdToStep = new Map<string, RecipeStep>();
  for (const step of steps) {
    for (const comp of step.paints) {
      if (comp.paint_id && !paintIdToStep.has(comp.paint_id)) {
        paintIdToStep.set(comp.paint_id, step);
      }
    }
  }

  // Map each paint_id to its display name (from the first matching component).
  const paintIdToName = new Map<string, { name: string; brand: string }>();
  for (const step of steps) {
    for (const comp of step.paints) {
      if (comp.paint_id && comp.paint && !paintIdToName.has(comp.paint_id)) {
        paintIdToName.set(comp.paint_id, { name: comp.paint.name, brand: comp.paint.brand });
      }
    }
  }

  const results =
    targetBrand && recipePaintIds.length > 0
      ? selectBrandSubstitutes(recipePaintIds, targetBrand, conversionsByPaint)
      : [];

  const hasAny = results.some((r) => r.candidates.length > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="brand-picker">Show substitutes from brand</Label>
        <select
          id="brand-picker"
          value={targetBrand}
          onChange={(e) => setTargetBrand(e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Select a brand…</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {targetBrand && !hasAny && recipePaintIds.length > 0 && (
        <p className="text-sm text-muted-foreground">No conversion data found for {targetBrand}.</p>
      )}

      {targetBrand && recipePaintIds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          This recipe uses only custom colors — no substitution data available.
        </p>
      )}

      {results.length > 0 && hasAny && (
        <ul className="space-y-4">
          {results.map((result) => {
            const step = paintIdToStep.get(result.recipePaintId);
            const paintInfo = paintIdToName.get(result.recipePaintId);
            if (!step) return null;
            return (
              <li key={result.recipePaintId} className="space-y-2">
                <p className="text-sm font-medium">
                  Step {step.step_order + 1} — {paintInfo?.name ?? result.recipePaintId}
                  {paintInfo?.brand && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({paintInfo.brand})
                    </span>
                  )}
                </p>
                {result.candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4">
                    No {targetBrand} substitutes found
                  </p>
                ) : (
                  <ul className="pl-4 space-y-1.5">
                    {result.candidates.map((c) => (
                      <li key={c.paint.id} className="flex items-center gap-2 text-sm">
                        <PaintSwatch hex={c.paint.hex} size="sm" />
                        <span className="font-medium">{c.paint.name}</span>
                        {c.paint.range && (
                          <span className="text-muted-foreground text-xs">· {c.paint.range}</span>
                        )}
                        <span className="ml-auto text-muted-foreground text-xs">
                          {Math.round(c.confidence * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
