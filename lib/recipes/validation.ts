/**
 * Pure validation helpers for the recipe domain.
 * No Supabase imports — safe to import in tests and server actions alike.
 */

import type { RecipeStepRole, RecipeVisibility } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecipeErrors = Partial<Record<"title" | "visibility" | "_", string>>;

export type ParsedRecipe = {
  title: string;
  description: string | null;
  visibility: RecipeVisibility;
  source_url: string | null;
};

export type ParsedComponent = {
  paint_id: string | null;
  hex: string | null;
  ratio: number;
};

export type ParsedStep = {
  id: string;
  role: RecipeStepRole;
  paints: ParsedComponent[];
  technique_note: string | null;
  area_note: string | null;
};

export type StepSyncPlan = {
  toRemove: string[];
  toUpsert: ParsedStep[];
  finalOrderIds: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_ROLES: RecipeStepRole[] = [
  "basecoat",
  "layer",
  "highlight",
  "edge_highlight",
  "shade",
  "drybrush",
  "glaze",
  "wash",
  "other",
];

const VALID_VISIBILITIES: RecipeVisibility[] = ["private", "public"];

// ─── validateRecipeForm ───────────────────────────────────────────────────────

/**
 * Parses and validates the recipe metadata fields from a FormData submission.
 * Returns { data } on success or { errors } on failure.
 */
export function validateRecipeForm(
  formData: FormData,
): { data: ParsedRecipe } | { errors: RecipeErrors } {
  const rawTitle = ((formData.get("title") as string) ?? "").trim();
  const rawDescription = ((formData.get("description") as string) ?? "").trim() || null;
  const rawVisibility = ((formData.get("visibility") as string) ?? "").trim();
  const rawSourceUrl = ((formData.get("source_url") as string) ?? "").trim() || null;

  const errors: RecipeErrors = {};

  if (!rawTitle) {
    errors.title = "Title is required.";
  } else if (rawTitle.length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  const visibility: RecipeVisibility = VALID_VISIBILITIES.includes(
    rawVisibility as RecipeVisibility,
  )
    ? (rawVisibility as RecipeVisibility)
    : rawVisibility === ""
      ? "private"
      : null!;

  if (!VALID_VISIBILITIES.includes(visibility) && rawVisibility !== "") {
    errors.visibility = "Invalid visibility value.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      title: rawTitle,
      description: rawDescription,
      visibility: visibility ?? "private",
      source_url: rawSourceUrl,
    },
  };
}

// ─── parseStepsPayload ────────────────────────────────────────────────────────

/**
 * Parses and validates the JSON steps payload from a hidden form field.
 * Mirrors the DB constraints:
 *   - role enum
 *   - paints array must have at least one component
 *   - each component: paint_id | hex required, hex format /^[0-9A-Fa-f]{6}$/, ratio >= 1 integer
 */
export function parseStepsPayload(
  raw: string | null | undefined,
): { data: ParsedStep[] } | { errors: { _: string } } {
  if (raw == null || raw === "") return { errors: { _: "Steps payload is missing." } };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { errors: { _: "Steps payload is not valid JSON." } };
  }

  if (!Array.isArray(parsed)) {
    return { errors: { _: "Steps payload must be an array." } };
  }

  const steps: ParsedStep[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i] as Record<string, unknown>;

    if (!VALID_ROLES.includes(s.role as RecipeStepRole)) {
      return { errors: { _: `Step ${i + 1}: invalid role "${String(s.role)}".` } };
    }

    const rawPaints = s.paints;
    if (!Array.isArray(rawPaints) || rawPaints.length === 0) {
      return { errors: { _: `Step ${i + 1}: must have at least one paint component.` } };
    }

    const paints: ParsedComponent[] = [];

    for (let j = 0; j < rawPaints.length; j++) {
      const c = rawPaints[j] as Record<string, unknown>;
      const paintId = ((c.paint_id as string | null | undefined) ?? null) || null;
      const rawHex = ((c.hex as string | null | undefined) ?? null) || null;

      if (paintId == null && rawHex == null) {
        return {
          errors: {
            _: `Step ${i + 1}, paint ${j + 1}: must specify either a catalog paint or a hex color.`,
          },
        };
      }

      if (rawHex != null && !/^[0-9A-Fa-f]{6}$/.test(rawHex)) {
        return {
          errors: {
            _: `Step ${i + 1}, paint ${j + 1}: hex must be exactly 6 hex characters without #.`,
          },
        };
      }

      const rawRatio = c.ratio;
      const ratio =
        rawRatio === undefined || rawRatio === null
          ? 1
          : typeof rawRatio === "number"
            ? rawRatio
            : Number(rawRatio);

      if (!Number.isInteger(ratio) || ratio < 1) {
        return {
          errors: {
            _: `Step ${i + 1}, paint ${j + 1}: ratio must be a positive integer (got "${String(rawRatio)}").`,
          },
        };
      }

      paints.push({ paint_id: paintId, hex: rawHex, ratio });
    }

    const techniqueNote = ((s.technique_note as string) ?? "").trim() || null;
    const areaNoteVal = ((s.area_note as string) ?? "").trim() || null;

    steps.push({
      id: String(s.id ?? ""),
      role: s.role as RecipeStepRole,
      paints,
      technique_note: techniqueNote,
      area_note: areaNoteVal,
    });
  }

  return { data: steps };
}

// ─── planStepSync ─────────────────────────────────────────────────────────────

/**
 * Computes the diff between server-persisted steps and the local (on-screen) steps.
 *
 * KEY CONTRACT: finalOrderIds includes EVERY local step in on-screen order, including
 * newly-added steps that the server has never seen. This is the regression guard for
 * the bug where newly-added interspersed steps were excluded from the reorder call.
 *
 * Note: the actual saveRecipeAction uses delete-all-then-reinsert (atomic via RPC),
 * so it doesn't call planStepSync at runtime — this function documents the intended
 * behaviour and provides the test anchor for bug #1.
 */
export function planStepSync(
  serverSteps: { id: string }[],
  localSteps: ParsedStep[],
): StepSyncPlan {
  const serverIds = new Set(serverSteps.map((s) => s.id));
  const localIds = new Set(localSteps.map((s) => s.id));

  const toRemove = serverSteps.filter((s) => !localIds.has(s.id)).map((s) => s.id);

  // toUpsert: all local steps (update existing, insert new)
  const toUpsert = localSteps;

  // finalOrderIds: ALL local steps in on-screen order — never filtered to existing ids.
  // This is the fix for bug #1: the old code used
  //   steps.filter(s => existingIds.has(s.id)).map(s => s.id)
  // which excluded newly-added steps from the reorder call.
  void serverIds; // intentionally not used to filter finalOrderIds
  const finalOrderIds = localSteps.map((s) => s.id);

  return { toRemove, toUpsert, finalOrderIds };
}
