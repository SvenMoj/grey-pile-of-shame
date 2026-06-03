"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseInventoryStore } from "@/lib/inventory/supabase-store";
import type { InventoryItem, InventoryState, NewInventoryItem } from "@/lib/inventory/types";

/**
 * Reactive bridge to the inventory store.
 *
 * Logged-in only — no localStorage fallback (unlike usePile).
 * If the user is not authed, `items` stays empty and `loaded` is true.
 *
 * storeRef is accessed only inside callbacks/effects (never during render)
 * to satisfy the react-hooks/refs ESLint rule.
 */
export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await createSupabaseInventoryStore(createClient()).list();
        setItems(data);
      } catch {
        // Not authed or network error — stay empty.
        setItems([]);
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await createSupabaseInventoryStore(createClient()).list();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, []);

  const add = useCallback(
    async (input: NewInventoryItem): Promise<InventoryItem> => {
      const created = await createSupabaseInventoryStore(createClient()).add(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const setState = useCallback(
    async (id: string, state: InventoryState): Promise<InventoryItem | null> => {
      const updated = await createSupabaseInventoryStore(createClient()).setState(id, state);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const setQuantity = useCallback(
    async (id: string, quantity: number): Promise<InventoryItem | null> => {
      const updated = await createSupabaseInventoryStore(createClient()).setQuantity(id, quantity);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await createSupabaseInventoryStore(createClient()).remove(id);
      await refresh();
    },
    [refresh],
  );

  return { items, loaded, add, setState, setQuantity, remove };
}
