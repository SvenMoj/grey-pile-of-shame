"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unitProgress } from "@/lib/pile/progress";
import { listRowClass } from "@/lib/ui/list-row";
import type { Army, PileItem, Unit } from "@/lib/pile/types";
import type { useCollection } from "@/lib/hooks/use-collection";
import { ProgressBar } from "@/components/ProgressBar";
import { CompletionBadge } from "@/components/CompletionBadge";

type Collection = ReturnType<typeof useCollection>;

export function UnitList({
  army,
  units,
  items,
  allArmies,
  selectedUnitId,
  onSelectUnit,
  collection,
}: {
  army: Army | null;
  units: Unit[];
  items: PileItem[];
  allArmies: Army[];
  selectedUnitId: string | null;
  onSelectUnit: (id: string | null) => void;
  collection: Collection;
}) {
  const [newUnitName, setNewUnitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    const name = newUnitName.trim();
    if (!name) return;
    const unit = await collection.createUnit({ name, army_id: army?.id ?? null });
    setNewUnitName("");
    onSelectUnit(unit.id);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{army ? army.name : "Loose units"}</h2>

      {units.length === 0 && <p className="text-sm text-muted-foreground italic">No units yet.</p>}

      <ul className="space-y-1">
        {units.map((unit) => {
          const summary = unitProgress(unit.id, items);
          const isSelected = selectedUnitId === unit.id;

          return (
            <li key={unit.id}>
              <button
                onClick={() => onSelectUnit(isSelected ? null : unit.id)}
                className={listRowClass(isSelected)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{unit.name}</span>
                  {summary.isComplete && <CompletionBadge className="shrink-0" />}
                </div>
                {!summary.isComplete && (
                  <div className={`mt-1 ${isSelected ? "opacity-70" : ""}`}>
                    <ProgressBar summary={summary} compact />
                  </div>
                )}
              </button>

              <div className="flex gap-1 px-3 pb-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEditingId(unit.id);
                    setEditName(unit.name);
                  }}
                >
                  Rename
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setAssigningId(unit.id)}>
                  Move to army
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => void collection.deleteUnit(unit.id)}
                >
                  Delete
                </Button>
              </div>

              {editingId === unit.id && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = editName.trim();
                    if (name) await collection.renameUnit(unit.id, name);
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </form>
              )}

              {assigningId === unit.id && (
                <div className="flex items-center gap-2 px-3 pb-2">
                  <Label className="shrink-0 text-xs">Army:</Label>
                  <select
                    className="h-7 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs"
                    defaultValue={unit.army_id ?? ""}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      await collection.assignUnitToArmy(unit.id, val);
                      setAssigningId(null);
                    }}
                  >
                    <option value="">— Loose (no army) —</option>
                    {allArmies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" size="xs" onClick={() => setAssigningId(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={(e) => void handleCreateUnit(e)} className="flex gap-2 pt-1">
        <Input
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          placeholder="New unit name…"
          className="flex-1"
        />
        <Button type="submit" disabled={!newUnitName.trim()} size="sm">
          + Unit
        </Button>
      </form>
    </div>
  );
}
