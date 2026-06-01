import { createPileItem, type FactoryDeps } from "./factory";
import { advanceItem } from "./states";
import { PILE_STORAGE_KEY, parsePile, serializePile } from "./serialize";
import type { NewPileItem, PileItem, PileState, PileStore } from "./types";

function getDefaultStorage(): Storage | null {
  if (typeof window === "undefined") return null; // SSR guard
  try {
    return window.localStorage;
  } catch {
    return null; // privacy mode / storage disabled
  }
}

/**
 * Create a localStorage-backed PileStore.
 *
 * @param storage   Inject a custom Storage for testing or SSR. Pass null to
 *                  get a no-op store (reads return [], writes are silent).
 * @param deps      Inject id/now for deterministic tests.
 */
export function createLocalPileStore(
  storage: Storage | null = getDefaultStorage(),
  deps: FactoryDeps = {},
): PileStore {
  function readAll(): PileItem[] {
    if (!storage) return [];
    try {
      return parsePile(storage.getItem(PILE_STORAGE_KEY));
    } catch {
      return [];
    }
  }

  function writeAll(items: PileItem[]): void {
    if (!storage) return;
    try {
      storage.setItem(PILE_STORAGE_KEY, serializePile(items));
    } catch {
      // quota exceeded or storage unavailable — fail silently
    }
  }

  return {
    async list(): Promise<PileItem[]> {
      return readAll();
    },

    async add(input: NewPileItem): Promise<PileItem> {
      const items = readAll();
      const created = createPileItem(input, deps);
      items.push(created);
      writeAll(items);
      return created;
    },

    async addMany(inputs: NewPileItem[]): Promise<PileItem[]> {
      const items = readAll();
      const created = inputs.map((input) => createPileItem(input, deps));
      items.push(...created);
      writeAll(items);
      return created;
    },

    async advanceState(id: string, to?: PileState): Promise<PileItem | null> {
      const items = readAll();
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      const updated = advanceItem(items[idx], to, deps.now);
      items[idx] = updated;
      writeAll(items);
      return updated;
    },

    async remove(id: string): Promise<void> {
      writeAll(readAll().filter((item) => item.id !== id));
    },
  };
}

/** Singleton for app use — reads from the real window.localStorage at runtime. */
export const localPileStore = createLocalPileStore();
