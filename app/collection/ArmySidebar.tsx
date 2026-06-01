"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { armyProgress, looseItems, looseUnits } from "@/lib/pile/progress";
import { listRowClass } from "@/lib/ui/list-row";
import type { Army, PileItem, Unit } from "@/lib/pile/types";
import type { useCollection } from "@/lib/hooks/use-collection";
import { ProgressBar } from "./ProgressBar";
import { CompletionBadge } from "@/app/_components/CompletionBadge";

type Collection = ReturnType<typeof useCollection>;

export type SidebarSelection =
  | { type: "army"; armyId: string }
  | { type: "loose-units" }
  | { type: "loose-models" }
  | null;

export function ArmySidebar({
  armies,
  units,
  items,
  selection,
  onSelect,
  collection,
}: {
  armies: Army[];
  units: Unit[];
  items: PileItem[];
  selection: SidebarSelection;
  onSelect: (s: SidebarSelection) => void;
  collection: Collection;
}) {
  const [newArmyName, setNewArmyName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const looseUnitCount = looseUnits(units).length;
  const looseModelCount = looseItems(items).length;

  function isSelected(s: SidebarSelection): boolean {
    if (!selection || !s) return false;
    if (selection.type !== s.type) return false;
    if (selection.type === "army" && s.type === "army") return selection.armyId === s.armyId;
    return true;
  }

  async function handleCreateArmy(e: React.FormEvent) {
    e.preventDefault();
    const name = newArmyName.trim();
    if (!name) return;
    const army = await collection.createArmy({ name });
    setNewArmyName("");
    onSelect({ type: "army", armyId: army.id });
  }

  return (
    <nav className="space-y-1">
      {armies.map((army) => {
        const summary = armyProgress(army.id, units, items);
        const sel: SidebarSelection = { type: "army", armyId: army.id };
        const selected = isSelected(sel);

        return (
          <div key={army.id}>
            <button
              onClick={() => onSelect(selected ? null : sel)}
              className={listRowClass(selected)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{army.name}</span>
                {summary.isComplete && summary.counts.total > 0 && (
                  <CompletionBadge className="shrink-0" />
                )}
              </div>
              {!summary.isComplete && (
                <div className={`mt-1 ${selected ? "opacity-70" : ""}`}>
                  <ProgressBar summary={summary} compact />
                </div>
              )}
            </button>
            <div className="flex gap-1 px-3 pb-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingId(army.id);
                  setEditName(army.name);
                }}
              >
                Rename
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => void collection.deleteArmy(army.id)}
              >
                Delete
              </Button>
            </div>
            {editingId === army.id && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = editName.trim();
                  if (name) await collection.renameArmy(army.id, name);
                  setEditingId(null);
                }}
                className="flex gap-2 px-3 pb-2"
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 flex-1 text-xs"
                  autoFocus
                />
                <Button type="submit" variant="ghost" size="xs">
                  Save
                </Button>
                <Button type="button" variant="ghost" size="xs" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </form>
            )}
          </div>
        );
      })}

      <form onSubmit={(e) => void handleCreateArmy(e)} className="flex gap-2 pt-2">
        <Input
          value={newArmyName}
          onChange={(e) => setNewArmyName(e.target.value)}
          placeholder="New army…"
          className="flex-1"
        />
        <Button type="submit" disabled={!newArmyName.trim()} size="sm">
          + Army
        </Button>
      </form>

      {(looseUnitCount > 0 || looseModelCount > 0) && <Separator className="my-2" />}

      {looseUnitCount > 0 && (
        <button
          onClick={() =>
            onSelect(isSelected({ type: "loose-units" }) ? null : { type: "loose-units" })
          }
          className={listRowClass(isSelected({ type: "loose-units" }))}
        >
          <span className="text-sm">Loose units ({looseUnitCount})</span>
        </button>
      )}

      {looseModelCount > 0 && (
        <button
          onClick={() =>
            onSelect(isSelected({ type: "loose-models" }) ? null : { type: "loose-models" })
          }
          className={listRowClass(isSelected({ type: "loose-models" }))}
        >
          <span className="text-sm">Loose models ({looseModelCount})</span>
        </button>
      )}
    </nav>
  );
}
