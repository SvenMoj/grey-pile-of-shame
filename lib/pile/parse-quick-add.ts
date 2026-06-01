import { PILE_STATES } from "./states";
import type { NewPileItem, PileState } from "./types";

type ParseSuccess = { data: NewPileItem[] };
type ParseErrors = { errors: Record<string, string> };
export type ParseQuickAddResult = ParseSuccess | ParseErrors;

/**
 * Parse a quick-add form submission into one or more NewPileItems.
 *
 * Returns `{ data }` on success or `{ errors }` on validation failure.
 * Mirrors the discriminated-union pattern of the admin form parsers.
 *
 * Batch semantics: when unit_size > 1, expand into that many individual items
 * each with unit_size=1, because the pile-shrink loop advances per model.
 */
export function parseQuickAdd(formData: FormData): ParseQuickAddResult {
  const errors: Record<string, string> = {};

  // --- display_name ---
  const displayName = ((formData.get("display_name") as string | null) ?? "").trim();
  if (!displayName) {
    errors.display_name = "Name is required";
  }

  // --- game & faction (optional) ---
  const game = ((formData.get("game") as string | null) ?? "").trim() || null;
  const faction = ((formData.get("faction") as string | null) ?? "").trim() || null;

  // --- point_value (optional integer) ---
  const rawPointValue = ((formData.get("point_value") as string | null) ?? "").trim();
  let point_value: number | null = null;
  if (rawPointValue !== "") {
    const n = Number(rawPointValue);
    if (isNaN(n) || !Number.isInteger(n)) {
      errors.point_value = "Point value must be a whole number";
    } else {
      point_value = n;
    }
  }

  // --- unit_size (positive integer, default 1) ---
  const rawUnitSize = ((formData.get("unit_size") as string | null) ?? "").trim();
  let unit_size = 1;
  if (rawUnitSize !== "") {
    const n = Number(rawUnitSize);
    if (isNaN(n) || !Number.isInteger(n) || n < 1) {
      errors.unit_size = "Unit size must be a positive whole number";
    } else {
      unit_size = n;
    }
  }

  // --- state (optional, default unbuilt) ---
  const rawState = ((formData.get("state") as string | null) ?? "").trim();
  let state: PileState = "unbuilt";
  if (rawState !== "" && !PILE_STATES.includes(rawState as PileState)) {
    errors.state = "Invalid state";
  } else if (rawState !== "") {
    state = rawState as PileState;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  if (unit_size === 1) {
    return {
      data: [
        {
          display_name: displayName,
          game,
          faction,
          point_value,
          state,
          unit_size: 1,
          kit_id: null,
          painted_at: null,
        },
      ],
    };
  }

  // Batch: expand into N individual single-model items (pile-shrink loop is per-model)
  const data: NewPileItem[] = Array.from({ length: unit_size }, (_, i) => ({
    display_name: `${displayName} #${i + 1}`,
    game,
    faction,
    point_value,
    state,
    unit_size: 1,
    kit_id: null,
    painted_at: null,
  }));

  return { data };
}
