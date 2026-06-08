/**
 * Pure, DB-free cross-reference logic for the recipes feature.
 *
 * Given a recipe's steps, the user's owned paint ids, and the relevant rows
 * from the conversions table, these functions determine:
 *   - Per-step inventory status (owned / substitute_owned / missing / no_catalog_paint)
 *   - Brand-substitution candidates for the entire recipe
 *
 * All functions are unit-tested in cross-reference.test.ts and have no dependencies
 * on Supabase or Next.js.
 */

import type { RecipeStep, RecipeStepComponent, StepPaint } from "./types";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ConversionPaint = {
  id: string;
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

/** Raw row shape returned by the batched conversions query in queries.ts. */
export type RawConversionRow = {
  confidence: number;
  paint_a: ConversionPaint;
  paint_b: ConversionPaint;
};

/** A directed edge: "from" is a recipe paint, "to" is the substitute candidate. */
export type ConversionEdge = {
  fromPaintId: string;
  toPaint: ConversionPaint;
  confidence: number;
};

// ─── Per-component status ─────────────────────────────────────────────────────

/** Inventory status for a single catalog paint (or hex-only component). */
export type StepInventoryStatus =
  | { kind: "owned" }
  | { kind: "substitute_owned"; substitute: ConversionPaint; confidence: number }
  | { kind: "missing" }
  | { kind: "no_catalog_paint" }; // hex-only or catalog paint was deleted

/** Status of one component in a mix, bundled with its display info. */
export type StepComponentStatus = {
  component: RecipeStepComponent;
  paint: StepPaint | null;
  status: StepInventoryStatus;
};

/**
 * Rolled-up inventory status for a step with potentially many mix components.
 *
 * - no_catalog_paint: every component is hex-only (no catalog paint_ids)
 * - owned:   all catalog components are owned or have an owned substitute
 * - partial: some catalog components are covered, some are missing
 * - missing: no catalog components are covered
 */
export type StepMixStatus = {
  kind: "no_catalog_paint" | "owned" | "partial" | "missing";
  components: StepComponentStatus[];
};

// ─── indexConversionsByRecipePaint ────────────────────────────────────────────

/**
 * Build a per-recipe-paint index of conversion edges from raw DB rows.
 *
 * A conversion is bidirectional: the recipe paint may appear as paint_a OR paint_b.
 * For each end that is a recipe paint we emit a directed edge to the other end.
 * A conversion between two recipe paints yields two edges (one from each side).
 *
 * Deduplication: if (fromId, toId) appears more than once, keep the max confidence.
 * Self-edges are dropped.
 */
export function indexConversionsByRecipePaint(
  rows: RawConversionRow[],
  recipePaintIds: ReadonlySet<string>,
): Map<string, ConversionEdge[]> {
  // Keyed by `${fromId}::${toId}` → max confidence entry
  const best = new Map<string, ConversionEdge>();

  for (const row of rows) {
    const { paint_a, paint_b, confidence } = row;

    // Emit edge from paint_a → paint_b when paint_a is a recipe paint
    if (recipePaintIds.has(paint_a.id) && paint_a.id !== paint_b.id) {
      const key = `${paint_a.id}::${paint_b.id}`;
      const existing = best.get(key);
      if (!existing || confidence > existing.confidence) {
        best.set(key, { fromPaintId: paint_a.id, toPaint: paint_b, confidence });
      }
    }

    // Emit edge from paint_b → paint_a when paint_b is a recipe paint
    if (recipePaintIds.has(paint_b.id) && paint_b.id !== paint_a.id) {
      const key = `${paint_b.id}::${paint_a.id}`;
      const existing = best.get(key);
      if (!existing || confidence > existing.confidence) {
        best.set(key, { fromPaintId: paint_b.id, toPaint: paint_a, confidence });
      }
    }
  }

  // Group by fromPaintId
  const result = new Map<string, ConversionEdge[]>();
  for (const edge of best.values()) {
    const list = result.get(edge.fromPaintId);
    if (list) {
      list.push(edge);
    } else {
      result.set(edge.fromPaintId, [edge]);
    }
  }
  return result;
}

// ─── resolveStepStatus ────────────────────────────────────────────────────────

/**
 * Determine the inventory status for a single recipe step.
 *
 * Precedence:
 *   1. No catalog paint (hex-only or deleted) → no_catalog_paint
 *   2. User owns the exact paint → owned
 *   3. User owns a substitute (highest confidence; tiebreak by toPaint.id asc) → substitute_owned
 *   4. Otherwise → missing
 */
export function resolveStepStatus(
  targetPaintId: string | null,
  ownedPaintIds: ReadonlySet<string>,
  conversionsByPaint: ReadonlyMap<string, ConversionEdge[]>,
): StepInventoryStatus {
  if (targetPaintId === null) return { kind: "no_catalog_paint" };
  if (ownedPaintIds.has(targetPaintId)) return { kind: "owned" };

  const edges = conversionsByPaint.get(targetPaintId) ?? [];
  const ownedSubstitutes = edges.filter((e) => ownedPaintIds.has(e.toPaint.id));

  if (ownedSubstitutes.length === 0) return { kind: "missing" };

  // Pick highest confidence; tiebreak deterministically by toPaint.id (lexicographic asc)
  const best = ownedSubstitutes.reduce((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence > a.confidence ? b : a;
    return b.toPaint.id < a.toPaint.id ? b : a;
  });

  return { kind: "substitute_owned", substitute: best.toPaint, confidence: best.confidence };
}

// ─── resolveStepMix ──────────────────────────────────────────────────────────

/**
 * Compute the rolled-up inventory status for a single step with multiple
 * mix components. Calls resolveStepStatus for each catalog component.
 */
export function resolveStepMix(
  step: RecipeStep,
  ownedPaintIds: ReadonlySet<string>,
  conversionsByPaint: ReadonlyMap<string, ConversionEdge[]>,
): StepMixStatus {
  const components: StepComponentStatus[] = step.paints.map((c) => ({
    component: c,
    paint: c.paint,
    status: resolveStepStatus(c.paint_id, ownedPaintIds, conversionsByPaint),
  }));

  const catalogComponents = components.filter((c) => c.component.paint_id !== null);

  if (catalogComponents.length === 0) {
    return { kind: "no_catalog_paint", components };
  }

  const coveredCount = catalogComponents.filter(
    (c) => c.status.kind === "owned" || c.status.kind === "substitute_owned",
  ).length;

  let kind: StepMixStatus["kind"];
  if (coveredCount === 0) {
    kind = "missing";
  } else if (coveredCount === catalogComponents.length) {
    kind = "owned";
  } else {
    kind = "partial";
  }

  return { kind, components };
}

// ─── resolveAllSteps ─────────────────────────────────────────────────────────

/**
 * Map every recipe step to its rolled-up mix status.
 * Returns statuses in the same order as the input steps array.
 */
export function resolveAllSteps(
  steps: RecipeStep[],
  ownedPaintIds: ReadonlySet<string>,
  conversionsByPaint: ReadonlyMap<string, ConversionEdge[]>,
): StepMixStatus[] {
  return steps.map((step) => resolveStepMix(step, ownedPaintIds, conversionsByPaint));
}

// ─── selectBrandSubstitutes ───────────────────────────────────────────────────

export type BrandSubstituteResult = {
  recipePaintId: string;
  candidates: { paint: ConversionPaint; confidence: number }[];
};

/**
 * For each recipe paint, return the substitute candidates of a given target brand,
 * sorted by confidence descending. Reuses the already-built conversion index — no
 * extra DB query needed.
 */
export function selectBrandSubstitutes(
  recipePaintIds: string[],
  targetBrand: string,
  conversionsByPaint: ReadonlyMap<string, ConversionEdge[]>,
): BrandSubstituteResult[] {
  return recipePaintIds.map((paintId) => {
    const edges = conversionsByPaint.get(paintId) ?? [];
    const candidates = edges
      .filter((e) => e.toPaint.brand === targetBrand)
      .sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return a.toPaint.id < b.toPaint.id ? -1 : 1;
      })
      .map((e) => ({ paint: e.toPaint, confidence: e.confidence }));

    return { recipePaintId: paintId, candidates };
  });
}
