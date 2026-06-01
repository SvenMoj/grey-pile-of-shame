import { PILE_STATES } from "./states";
import type { EditPileItem, PileState } from "./types";

type ParseSuccess = { data: EditPileItem };
type ParseErrors = { errors: Record<string, string> };
export type ParseEditItemResult = ParseSuccess | ParseErrors;

/**
 * Parse an edit-item form submission into an EditPileItem patch.
 *
 * Single-item sibling of parseQuickAdd — no batch, no unit_size.
 * Returns `{ data }` on success or `{ errors }` on validation failure.
 */
export function parseEditItem(formData: FormData): ParseEditItemResult {
  const errors: Record<string, string> = {};

  // --- display_name (required) ---
  const displayName = ((formData.get("display_name") as string | null) ?? "").trim();
  if (!displayName) {
    errors.display_name = "Name is required";
  }

  // --- game & faction (optional → null) ---
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

  // --- state (required, must be a valid PileState) ---
  const rawState = ((formData.get("state") as string | null) ?? "").trim();
  if (!rawState || !PILE_STATES.includes(rawState as PileState)) {
    errors.state = "A valid state is required";
  }
  const state = rawState as PileState;

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      display_name: displayName,
      game,
      faction,
      point_value,
      state,
    },
  };
}
