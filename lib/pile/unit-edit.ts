import type { EditUnit, Unit } from "./types";

/**
 * Pure, immutable unit edit application.
 * Only keys present in `patch` are merged; absent keys leave the field unchanged.
 * Setting army_id to null makes the unit "loose" (no army).
 * Always returns a new object (never mutates input). Inject `now` for deterministic tests.
 */
export function applyUnitEdit(
  unit: Unit,
  patch: EditUnit,
  now: () => string = () => new Date().toISOString(),
): Unit {
  return {
    ...unit,
    name: "name" in patch ? (patch.name ?? unit.name) : unit.name,
    army_id: "army_id" in patch ? (patch.army_id ?? null) : unit.army_id,
    updated_at: now(),
  };
}
