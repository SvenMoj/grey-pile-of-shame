"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSupabasePileStore } from "@/lib/pile/supabase-store";
import { createSupabaseArmyStore, type ArmyStore } from "@/lib/pile/army-store";
import { createSupabaseUnitStore, type UnitStore } from "@/lib/pile/unit-store";
import {
  createSupabaseAchievementStore,
  type AchievementStore,
} from "@/lib/pile/achievement-store";
import { computeEarned } from "@/lib/pile/achievements";
import { armyProgress, unitProgress } from "@/lib/pile/progress";
import type {
  Army,
  EditPileItem,
  NewArmy,
  NewPileItem,
  NewUnit,
  PileItem,
  PileState,
  Unit,
} from "@/lib/pile/types";
import type { PileStore } from "@/lib/pile/types";

export interface NewlyUnlocked {
  achievementIds: string[];
  modelCompleted: boolean;
  unitCompletedIds: string[];
  armyCompletedIds: string[];
}

/**
 * Loads and manages the full Army → Unit → Model hierarchy for logged-in users.
 * This hook assumes it is mounted inside an auth-gated route (layout calls
 * getUserOrRedirect). It does NOT support anonymous / localStorage use.
 *
 * Every mutation does a full re-list (no optimistic UI), consistent with usePile.
 */
export function useCollection() {
  const [items, setItems] = useState<PileItem[]>([]);
  const [armies, setArmies] = useState<Army[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Callback fired when something worth celebrating just happened.
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlocked | null>(null);

  const itemStoreRef = useRef<PileStore | null>(null);
  const armyStoreRef = useRef<ArmyStore | null>(null);
  const unitStoreRef = useRef<UnitStore | null>(null);
  const achStoreRef = useRef<AchievementStore | null>(null);

  useEffect(() => {
    const supabase = createClient();
    itemStoreRef.current = createSupabasePileStore(supabase);
    armyStoreRef.current = createSupabaseArmyStore(supabase);
    unitStoreRef.current = createSupabaseUnitStore(supabase);
    achStoreRef.current = createSupabaseAchievementStore(supabase);

    async function init() {
      try {
        const [loadedItems, loadedArmies, loadedUnits, loadedUnlocked] = await Promise.all([
          itemStoreRef.current!.list(),
          armyStoreRef.current!.list(),
          unitStoreRef.current!.list(),
          achStoreRef.current!.list(),
        ]);
        setItems(loadedItems);
        setArmies(loadedArmies);
        setUnits(loadedUnits);
        setUnlocked(loadedUnlocked);
      } finally {
        setLoaded(true);
      }
    }

    void init();
  }, []);

  // -------------------------------------------------------------------------
  // Refresh helpers
  // -------------------------------------------------------------------------

  const refreshItems = useCallback(async () => {
    const fresh = await itemStoreRef.current!.list();
    setItems(fresh);
    return fresh;
  }, []);

  const refreshAll = useCallback(async () => {
    const [freshItems, freshArmies, freshUnits] = await Promise.all([
      itemStoreRef.current!.list(),
      armyStoreRef.current!.list(),
      unitStoreRef.current!.list(),
    ]);
    setItems(freshItems);
    setArmies(freshArmies);
    setUnits(freshUnits);
    return { items: freshItems, armies: freshArmies, units: freshUnits };
  }, []);

  // -------------------------------------------------------------------------
  // Gamification: detect new completions and unlock achievements.
  // Call BEFORE the mutation to snapshot prev state.
  // Call AFTER with the fresh data to detect changes.
  // -------------------------------------------------------------------------

  const checkCelebrations = useCallback(
    async (
      prevItems: PileItem[],
      freshItems: PileItem[],
      freshUnits: Unit[],
      freshArmies: Army[],
      prevUnlocked: string[],
    ): Promise<void> => {
      // Detect model→painted sparkle (at least one model newly hit "painted")
      const prevPaintedIds = new Set(
        prevItems.filter((i) => i.state === "painted").map((i) => i.id),
      );
      const modelCompleted = freshItems.some(
        (i) => i.state === "painted" && !prevPaintedIds.has(i.id),
      );

      // Detect unit completions: units that flipped isComplete false→true
      const prevUnitComplete = new Set(
        freshUnits.filter((u) => unitProgress(u.id, prevItems).isComplete).map((u) => u.id),
      );
      const unitCompletedIds = freshUnits
        .filter((u) => unitProgress(u.id, freshItems).isComplete && !prevUnitComplete.has(u.id))
        .map((u) => u.id);

      // Detect army completions
      const prevArmyComplete = new Set(
        freshArmies
          .filter((a) => armyProgress(a.id, freshUnits, prevItems).isComplete)
          .map((a) => a.id),
      );
      const armyCompletedIds = freshArmies
        .filter(
          (a) =>
            armyProgress(a.id, freshUnits, freshItems).isComplete && !prevArmyComplete.has(a.id),
        )
        .map((a) => a.id);

      // Achievement unlocks (DB-gated "fire once" check)
      const earned = computeEarned({ items: freshItems, units: freshUnits, armies: freshArmies });
      const newlyEarned = earned.filter((id) => !prevUnlocked.includes(id));
      let newAchievementIds: string[] = [];
      if (newlyEarned.length > 0) {
        newAchievementIds = await achStoreRef.current!.unlock(newlyEarned);
        if (newAchievementIds.length > 0) {
          setUnlocked((prev) => [...new Set([...prev, ...newAchievementIds])]);
        }
      }

      if (
        modelCompleted ||
        unitCompletedIds.length > 0 ||
        armyCompletedIds.length > 0 ||
        newAchievementIds.length > 0
      ) {
        setNewlyUnlocked({
          achievementIds: newAchievementIds,
          modelCompleted,
          unitCompletedIds,
          armyCompletedIds,
        });
      }
    },
    [],
  );

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), []);

  // -------------------------------------------------------------------------
  // Model mutations
  // -------------------------------------------------------------------------

  const addModel = useCallback(
    async (input: NewPileItem): Promise<PileItem> => {
      const created = await itemStoreRef.current!.add(input);
      await refreshItems();
      return created;
    },
    [refreshItems],
  );

  const addManyModels = useCallback(
    async (inputs: NewPileItem[]): Promise<PileItem[]> => {
      const created = await itemStoreRef.current!.addMany(inputs);
      await refreshItems();
      return created;
    },
    [refreshItems],
  );

  const advanceModel = useCallback(
    async (id: string, to?: PileState): Promise<PileItem | null> => {
      const prevItems = items;
      const updated = await itemStoreRef.current!.advanceState(id, to);
      const freshItems = await refreshItems();
      await checkCelebrations(prevItems, freshItems, units, armies, unlocked);
      return updated;
    },
    [items, units, armies, unlocked, refreshItems, checkCelebrations],
  );

  const editModel = useCallback(
    async (id: string, patch: EditPileItem): Promise<PileItem | null> => {
      const prevItems = items;
      const updated = await itemStoreRef.current!.update(id, patch);
      const freshItems = await refreshItems();
      // Only check celebrations if state may have changed to "painted"
      if ("state" in patch) {
        await checkCelebrations(prevItems, freshItems, units, armies, unlocked);
      }
      return updated;
    },
    [items, units, armies, unlocked, refreshItems, checkCelebrations],
  );

  const removeModel = useCallback(
    async (id: string): Promise<void> => {
      await itemStoreRef.current!.remove(id);
      await refreshItems();
    },
    [refreshItems],
  );

  const assignModelToUnit = useCallback(
    async (modelId: string, unitId: string | null): Promise<PileItem | null> => {
      return editModel(modelId, { unit_id: unitId });
    },
    [editModel],
  );

  // -------------------------------------------------------------------------
  // Unit mutations
  // -------------------------------------------------------------------------

  const createUnit = useCallback(
    async (input: NewUnit): Promise<Unit> => {
      const created = await unitStoreRef.current!.add(input);
      const { units: freshUnits } = await refreshAll();
      setUnits(freshUnits);
      return created;
    },
    [refreshAll],
  );

  const renameUnit = useCallback(async (id: string, name: string): Promise<Unit | null> => {
    return unitStoreRef.current!.update(id, { name });
  }, []);

  const assignUnitToArmy = useCallback(
    async (unitId: string, armyId: string | null): Promise<Unit | null> => {
      const updated = await unitStoreRef.current!.update(unitId, { army_id: armyId });
      const fresh = await unitStoreRef.current!.list();
      setUnits(fresh);
      return updated;
    },
    [],
  );

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    await unitStoreRef.current!.remove(id);
    // DB on delete set null: models become loose; re-list both
    const [freshItems, freshUnits] = await Promise.all([
      itemStoreRef.current!.list(),
      unitStoreRef.current!.list(),
    ]);
    setItems(freshItems);
    setUnits(freshUnits);
  }, []);

  // -------------------------------------------------------------------------
  // Army mutations
  // -------------------------------------------------------------------------

  const createArmy = useCallback(async (input: NewArmy): Promise<Army> => {
    const created = await armyStoreRef.current!.add(input);
    const fresh = await armyStoreRef.current!.list();
    setArmies(fresh);
    return created;
  }, []);

  const renameArmy = useCallback(async (id: string, name: string): Promise<Army | null> => {
    return armyStoreRef.current!.update(id, { name });
  }, []);

  const deleteArmy = useCallback(async (id: string): Promise<void> => {
    await armyStoreRef.current!.remove(id);
    // DB on delete set null: units become loose; re-list both
    const [freshArmies, freshUnits] = await Promise.all([
      armyStoreRef.current!.list(),
      unitStoreRef.current!.list(),
    ]);
    setArmies(freshArmies);
    setUnits(freshUnits);
  }, []);

  return {
    // State
    items,
    armies,
    units,
    unlocked,
    loaded,
    newlyUnlocked,
    clearNewlyUnlocked,
    // Model
    addModel,
    addManyModels,
    advanceModel,
    editModel,
    removeModel,
    assignModelToUnit,
    // Unit
    createUnit,
    renameUnit,
    assignUnitToArmy,
    deleteUnit,
    // Army
    createArmy,
    renameArmy,
    deleteArmy,
  };
}
