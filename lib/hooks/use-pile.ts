"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { localPileStore } from "@/lib/pile/local-store";
import { createSupabasePileStore } from "@/lib/pile/supabase-store";
import { migrateLocalToSupabase } from "@/lib/pile/migrate";
import type { EditPileItem, NewPileItem, PileItem, PileState, PileStore } from "@/lib/pile/types";

/**
 * Reactive bridge to the pile store.
 *
 * Backend selection:
 *  - No session → localPileStore (SSR-safe, no hydration mismatch)
 *  - Session present → supabasePileStore (RLS-backed, multi-device sync)
 *
 * On first sign-in: migrateLocalToSupabase runs (idempotent — guarded by
 * the gpos.pile.migrated flag) to push any local items to Supabase.
 *
 * `session` is exposed so consumers can show/hide the save banner.
 *
 * storeRef is accessed only inside effects/callbacks (never during render)
 * to satisfy the react-hooks/refs ESLint rule.
 */
export function usePile() {
  const [items, setItems] = useState<PileItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Mutable backend ref — updated when auth state changes.
  const storeRef = useRef<PileStore>(localPileStore);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      try {
        // 1. Check for an existing session (e.g. returning visitor already signed in)
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();
        setSession(existingSession);
        if (existingSession) {
          storeRef.current = createSupabasePileStore(supabase);
        }
        // 2. Load the pile from whichever backend is current
        const initialItems = await storeRef.current.list();
        setItems(initialItems);
      } catch {
        // Supabase unavailable or session invalid — fall back to local store so
        // the user is never permanently stuck on the loading screen.
        storeRef.current = localPileStore;
        setSession(null);
        try {
          setItems(await localPileStore.list());
        } catch {
          setItems([]);
        }
      } finally {
        // Always unblock the UI, regardless of what happened above.
        setLoaded(true);
      }
    }

    void init();

    // 3. Listen for sign-in / sign-out events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);

        if (newSession) {
          const newStore = createSupabasePileStore(supabase);
          // Run migration before switching — idempotent, safe to call on every sign-in
          await migrateLocalToSupabase(localPileStore, newStore);
          storeRef.current = newStore;
        } else {
          storeRef.current = localPileStore;
        }

        const refreshed = await storeRef.current.list();
        setItems(refreshed);
      } catch {
        // Auth state change failed — fall back to local store
        storeRef.current = localPileStore;
        setSession(null);
        setItems(await localPileStore.list());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    setItems(await storeRef.current.list());
  }, []);

  const add = useCallback(
    async (input: NewPileItem): Promise<PileItem> => {
      const created = await storeRef.current.add(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const addMany = useCallback(
    async (inputs: NewPileItem[]): Promise<PileItem[]> => {
      const created = await storeRef.current.addMany(inputs);
      await refresh();
      return created;
    },
    [refresh],
  );

  const advance = useCallback(
    async (id: string, to?: PileState): Promise<PileItem | null> => {
      const updated = await storeRef.current.advanceState(id, to);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: EditPileItem): Promise<PileItem | null> => {
      const updated = await storeRef.current.update(id, patch);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await storeRef.current.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { items, loaded, session, add, addMany, advance, update, remove };
}
