import type { EditPileItem, PileItem } from "./types";

/**
 * Pure, immutable edit application.
 *
 * Only keys present in `patch` are merged — an absent key leaves the field
 * unchanged, while an explicit `null` clears game / faction / point_value.
 *
 * painted_at rules:
 *  - state enters "painted" (and wasn't already) → set to now()
 *  - state moves off "painted" → cleared to null
 *  - state absent from patch, or "painted"→"painted" → keep existing painted_at
 *
 * Always returns a new object (never mutates input).
 * Inject `now` for deterministic tests.
 */
export function applyEdit(
  item: PileItem,
  patch: EditPileItem,
  now: () => string = () => new Date().toISOString(),
): PileItem {
  const newState = "state" in patch ? (patch.state ?? item.state) : item.state;

  let painted_at = item.painted_at;
  if ("state" in patch) {
    if (newState === "painted" && item.state !== "painted") {
      painted_at = now(); // entering painted
    } else if (newState !== "painted") {
      painted_at = null; // leaving painted
    }
    // else: painted → painted — keep existing painted_at
  }

  return {
    ...item,
    display_name:
      "display_name" in patch ? (patch.display_name ?? item.display_name) : item.display_name,
    game: "game" in patch ? (patch.game ?? null) : item.game,
    faction: "faction" in patch ? (patch.faction ?? null) : item.faction,
    unit_size: "unit_size" in patch ? (patch.unit_size ?? item.unit_size) : item.unit_size,
    unit_id: "unit_id" in patch ? (patch.unit_id ?? null) : item.unit_id,
    point_value: "point_value" in patch ? (patch.point_value ?? null) : item.point_value,
    state: newState,
    painted_at,
    updated_at: now(),
  };
}
