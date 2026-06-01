"use client";

import { useState } from "react";
import { armyProgress, looseItems, looseUnits } from "@/lib/pile/progress";
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

  function rowClass(sel: SidebarSelection): string {
    return `w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
      isSelected(sel)
        ? "bg-gray-900 text-white border-gray-900"
        : "hover:bg-gray-50 border-transparent hover:border-gray-200"
    }`;
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
      {/* Armies */}
      {armies.map((army) => {
        const summary = armyProgress(army.id, units, items);
        const sel: SidebarSelection = { type: "army", armyId: army.id };

        return (
          <div key={army.id}>
            <button
              onClick={() => onSelect(isSelected(sel) ? null : sel)}
              className={rowClass(sel)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{army.name}</span>
                {summary.isComplete && summary.counts.total > 0 && (
                  <CompletionBadge className="shrink-0" />
                )}
              </div>
              {!summary.isComplete && (
                <div className={`mt-1 ${isSelected(sel) ? "opacity-70" : ""}`}>
                  <ProgressBar summary={summary} compact />
                </div>
              )}
            </button>
            {/* Army actions */}
            <div className="flex gap-3 px-3 pb-1 text-xs text-gray-400">
              <button
                onClick={() => {
                  setEditingId(army.id);
                  setEditName(army.name);
                }}
                className="hover:text-gray-700"
              >
                Rename
              </button>
              <button
                onClick={() => void collection.deleteArmy(army.id)}
                className="hover:text-red-600"
              >
                Delete
              </button>
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
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-2 py-1 text-xs flex-1"
                  autoFocus
                />
                <button type="submit" className="text-xs text-gray-700 hover:text-gray-900">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        );
      })}

      {/* Create army form */}
      <form onSubmit={(e) => void handleCreateArmy(e)} className="flex gap-2 pt-2">
        <input
          value={newArmyName}
          onChange={(e) => setNewArmyName(e.target.value)}
          placeholder="New army…"
          className="border rounded px-3 py-1.5 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={!newArmyName.trim()}
          className="bg-gray-900 text-white rounded px-3 py-1.5 text-sm disabled:opacity-40"
        >
          + Army
        </button>
      </form>

      {/* Divider */}
      {(looseUnitCount > 0 || looseModelCount > 0) && <div className="border-t my-2" />}

      {/* Loose units bucket */}
      {looseUnitCount > 0 && (
        <button
          onClick={() =>
            onSelect(isSelected({ type: "loose-units" }) ? null : { type: "loose-units" })
          }
          className={rowClass({ type: "loose-units" })}
        >
          <span className="text-sm text-gray-600">Loose units ({looseUnitCount})</span>
        </button>
      )}

      {/* Loose models bucket */}
      {looseModelCount > 0 && (
        <button
          onClick={() =>
            onSelect(isSelected({ type: "loose-models" }) ? null : { type: "loose-models" })
          }
          className={rowClass({ type: "loose-models" })}
        >
          <span className="text-sm text-gray-600">Loose models ({looseModelCount})</span>
        </button>
      )}
    </nav>
  );
}
