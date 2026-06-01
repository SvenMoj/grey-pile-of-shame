"use client";

import { useState } from "react";
import { unitProgress } from "@/lib/pile/progress";
import type { Army, PileItem, Unit } from "@/lib/pile/types";
import type { useCollection } from "@/lib/hooks/use-collection";
import { ProgressBar } from "./ProgressBar";
import { CompletionBadge } from "@/app/_components/CompletionBadge";

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
  army: Army | null; // null = "Loose units" view
  units: Unit[]; // units to show (already filtered by army or loose)
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

      {units.length === 0 && <p className="text-sm text-gray-500 italic">No units yet.</p>}

      <ul className="space-y-1">
        {units.map((unit) => {
          const summary = unitProgress(unit.id, items);
          const isSelected = selectedUnitId === unit.id;

          return (
            <li key={unit.id}>
              <button
                onClick={() => onSelectUnit(isSelected ? null : unit.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900"
                    : "hover:bg-gray-50 border-transparent hover:border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{unit.name}</span>
                  {summary.isComplete && <CompletionBadge className="shrink-0" />}
                </div>
                {!summary.isComplete && (
                  <div className={`mt-1 ${isSelected ? "opacity-70" : ""}`}>
                    <ProgressBar summary={summary} compact />
                  </div>
                )}
              </button>

              {/* Inline actions */}
              <div className="flex gap-3 px-3 pb-1 text-xs text-gray-400">
                <button
                  onClick={() => {
                    setEditingId(unit.id);
                    setEditName(unit.name);
                  }}
                  className="hover:text-gray-700"
                >
                  Rename
                </button>
                <button onClick={() => setAssigningId(unit.id)} className="hover:text-gray-700">
                  Move to army
                </button>
                <button
                  onClick={() => void collection.deleteUnit(unit.id)}
                  className="hover:text-red-600"
                >
                  Delete
                </button>
              </div>

              {/* Inline rename */}
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

              {/* Inline assign to army */}
              {assigningId === unit.id && (
                <div className="flex items-center gap-2 px-3 pb-2">
                  <label className="text-xs text-gray-600 shrink-0">Army:</label>
                  <select
                    className="border rounded px-2 py-1 text-xs flex-1"
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
                  <button
                    onClick={() => setAssigningId(null)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Create unit form */}
      <form onSubmit={(e) => void handleCreateUnit(e)} className="flex gap-2 pt-1">
        <input
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          placeholder="New unit name…"
          className="border rounded px-3 py-1.5 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={!newUnitName.trim()}
          className="bg-gray-900 text-white rounded px-3 py-1.5 text-sm disabled:opacity-40"
        >
          + Unit
        </button>
      </form>
    </div>
  );
}
