"use client";

import { useCollection } from "@/lib/hooks/use-collection";
import { StateLegend } from "@/components/StateLegend";
import { CollectionShell } from "./CollectionShell";
import { TrophyShelf } from "./TrophyShelf";
import { Celebration } from "./Celebration";
import { summarizeItems } from "@/lib/pile/progress";

export default function CollectionPage() {
  const collection = useCollection();
  const { items, armies, units, unlocked, loaded, newlyUnlocked, clearNewlyUnlocked } = collection;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-muted-foreground">Loading your collection…</p>
      </div>
    );
  }

  const overallSummary = summarizeItems(items);

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">My Collection</h1>
        {items.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {overallSummary.counts.painted} painted ·{" "}
              {overallSummary.counts.total - overallSummary.counts.painted} to go
              {overallSummary.pointsPainted > 0 && ` · ${overallSummary.pointsPainted} pts painted`}
            </p>
            <StateLegend />
          </>
        )}
      </div>

      {/* Hierarchy browser */}
      <CollectionShell items={items} armies={armies} units={units} collection={collection} />

      {/* Trophy shelf */}
      <TrophyShelf unlocked={unlocked} />

      {/* Celebration overlay */}
      <Celebration newlyUnlocked={newlyUnlocked} onDismiss={clearNewlyUnlocked} />
    </div>
  );
}
