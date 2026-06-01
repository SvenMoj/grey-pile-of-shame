import type { NewPileItem, PileItem, PileStore } from "./types";

export const PILE_MIGRATION_KEY = "gpos.pile.migrated";

function getDefaultStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Strip generated fields to produce a NewPileItem suitable for insertion. */
function toNewPileItem(item: PileItem): NewPileItem {
  return {
    kit_id: item.kit_id,
    display_name: item.display_name,
    game: item.game,
    faction: item.faction,
    unit_size: item.unit_size,
    state: item.state,
    point_value: item.point_value,
    painted_at: item.painted_at,
  };
}

/**
 * One-time migration of local pile data into Supabase on first sign-in.
 *
 * Idempotent: guarded by a localStorage flag so re-running (e.g. on refresh)
 * never creates duplicates. Appends to any existing remote data — never
 * clobbers. Safe with null storage (SSR / privacy mode).
 */
export async function migrateLocalToSupabase(
  localStore: PileStore,
  remoteStore: PileStore,
  storage: Storage | null = getDefaultStorage(),
): Promise<void> {
  // Guard: already migrated this device
  if (storage?.getItem(PILE_MIGRATION_KEY) === "1") return;

  const localItems = await localStore.list();

  if (localItems.length === 0) {
    storage?.setItem(PILE_MIGRATION_KEY, "1");
    return;
  }

  // Push all local items to Supabase (append — remote items untouched)
  await remoteStore.addMany(localItems.map(toNewPileItem));

  // Clear local store item by item
  for (const item of localItems) {
    await localStore.remove(item.id);
  }

  storage?.setItem(PILE_MIGRATION_KEY, "1");
}
