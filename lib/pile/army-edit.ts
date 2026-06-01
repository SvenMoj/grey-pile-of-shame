import type { Army, EditArmy } from "./types";

/**
 * Pure, immutable army edit application.
 * Only keys present in `patch` are merged; absent keys leave the field unchanged.
 * Always returns a new object (never mutates input). Inject `now` for deterministic tests.
 */
export function applyArmyEdit(
  army: Army,
  patch: EditArmy,
  now: () => string = () => new Date().toISOString(),
): Army {
  return {
    ...army,
    name: "name" in patch ? (patch.name ?? army.name) : army.name,
    game: "game" in patch ? (patch.game ?? null) : army.game,
    updated_at: now(),
  };
}
