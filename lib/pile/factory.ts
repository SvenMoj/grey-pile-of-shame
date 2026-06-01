import type { NewPileItem, PileItem } from "./types";

export interface FactoryDeps {
  id?: () => string;
  now?: () => string;
}

/**
 * Create a fully-formed PileItem from a partial input.
 * Inject `id` and `now` for deterministic tests.
 */
export function createPileItem(input: NewPileItem, deps: FactoryDeps = {}): PileItem {
  const id = deps.id ? deps.id() : crypto.randomUUID();
  const now = deps.now ? deps.now() : new Date().toISOString();

  const state = input.state ?? "unbuilt";

  // painted_at: use the explicit value if provided (even null), otherwise auto-set
  // for "painted" state or leave null for all others.
  const painted_at =
    input.painted_at !== undefined ? input.painted_at : state === "painted" ? now : null;

  return {
    id,
    kit_id: input.kit_id ?? null,
    display_name: input.display_name,
    game: input.game ?? null,
    faction: input.faction ?? null,
    unit_size: input.unit_size ?? 1,
    unit_id: input.unit_id ?? null,
    state,
    point_value: input.point_value ?? null,
    created_at: now,
    painted_at,
    updated_at: now,
  };
}
