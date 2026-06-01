"use client";

import { useCallback, useEffect, useState } from "react";
import { localPileStore } from "@/lib/pile/local-store";
import type { NewPileItem, PileItem, PileState } from "@/lib/pile/types";

/**
 * Reactive bridge to the local pile store.
 *
 * Initial state is [] (same as SSR render) — the real localStorage read
 * happens in useEffect post-mount, so there is no hydration mismatch.
 * `loaded` becomes true after the first read; use it to gate empty-state UI
 * so the "add your pile" CTA doesn't flash before localStorage is checked.
 *
 * The backend is always localPileStore for now. A later auth slice will
 * swap to supabasePileStore when a session is present.
 */
export function usePile() {
  // localPileStore is a module-level singleton — stable reference, no ref needed.
  const store = localPileStore;
  const [items, setItems] = useState<PileItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void store.list().then((i) => {
      setItems(i);
      setLoaded(true);
    });
  }, [store]);

  const refresh = useCallback(async () => {
    setItems(await store.list());
  }, [store]);

  const add = useCallback(
    async (input: NewPileItem): Promise<PileItem> => {
      const created = await store.add(input);
      await refresh();
      return created;
    },
    [store, refresh],
  );

  const addMany = useCallback(
    async (inputs: NewPileItem[]): Promise<PileItem[]> => {
      const created = await store.addMany(inputs);
      await refresh();
      return created;
    },
    [store, refresh],
  );

  const advance = useCallback(
    async (id: string, to?: PileState): Promise<PileItem | null> => {
      const updated = await store.advanceState(id, to);
      await refresh();
      return updated;
    },
    [store, refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await store.remove(id);
      await refresh();
    },
    [store, refresh],
  );

  return { items, loaded, add, addMany, advance, remove };
}
