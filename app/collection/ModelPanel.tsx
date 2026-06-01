"use client";

import { useState } from "react";
import { unitProgress } from "@/lib/pile/progress";
import type { PileItem, PileState, Unit } from "@/lib/pile/types";
import type { useCollection } from "@/lib/hooks/use-collection";
import { ProgressBar } from "./ProgressBar";
import { StatePill } from "@/app/_components/StatePill";
import { StageStepper } from "@/app/_components/StageStepper";
import { CompletionBadge } from "@/app/_components/CompletionBadge";
import { EditItemForm } from "@/app/pile/EditItemForm";
import { Field } from "@/app/pile/Field";

type Collection = ReturnType<typeof useCollection>;

export function ModelPanel({
  unit,
  items,
  allUnits,
  collection,
}: {
  unit: Unit | null; // null = "Loose models" bucket
  items: PileItem[];
  allUnits: Unit[];
  collection: Collection;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const title = unit ? unit.name : "Loose models";
  const summary = unit ? unitProgress(unit.id, items) : null;

  const unitItems = unit
    ? items.filter((i) => i.unit_id === unit.id)
    : items.filter((i) => i.unit_id === null);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {summary?.isComplete && <CompletionBadge />}
        </div>
        {summary && !summary.isComplete && (
          <div className="mt-1">
            <ProgressBar summary={summary} />
          </div>
        )}
      </div>

      {/* Add model form */}
      {addOpen ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = (fd.get("display_name") as string).trim();
            if (!name) return;
            await collection.addModel({
              display_name: name,
              unit_id: unit?.id ?? null,
            });
            (e.target as HTMLFormElement).reset();
            setAddOpen(false);
          }}
          className="border rounded p-3 space-y-3 bg-gray-50"
        >
          <Field label="Name" name="display_name" required />
          <div className="flex gap-2">
            <button type="submit" className="bg-gray-900 text-white rounded px-3 py-1.5 text-xs">
              Add model
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAddOpen(true)}
          className="text-sm text-gray-500 hover:text-gray-800 border border-dashed rounded px-4 py-2 w-full text-left"
        >
          + Add model{unit ? ` to ${unit.name}` : ""}
        </button>
      )}

      {unitItems.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No models here yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {unitItems.map((item) => (
            <li key={item.id}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.unit_size > 1 && (
                      <span className="text-gray-400 mr-1">{item.unit_size}×</span>
                    )}
                    {item.display_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <StatePill state={item.state} />
                    {(item.game ?? item.faction ?? item.point_value) !== null && (
                      <p className="text-xs text-gray-500 truncate">
                        {[
                          item.game,
                          item.faction,
                          item.point_value !== null ? `${item.point_value}pts` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {item.state !== "painted" && (
                    <StageStepper
                      state={item.state}
                      onAdvance={(to: PileState) => void collection.advanceModel(item.id, to)}
                    />
                  )}
                  <button
                    onClick={() => setEditingId((cur) => (cur === item.id ? null : item.id))}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    {editingId === item.id ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => setAssigningId((cur) => (cur === item.id ? null : item.id))}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    Move
                  </button>
                  <button
                    onClick={() => void collection.removeModel(item.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Inline assign-to-unit dropdown */}
              {assigningId === item.id && (
                <div className="px-4 py-2 bg-gray-50 border-t flex items-center gap-2">
                  <label className="text-xs text-gray-600 shrink-0">Move to unit:</label>
                  <select
                    className="border rounded px-2 py-1 text-xs flex-1"
                    defaultValue={item.unit_id ?? ""}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      await collection.assignModelToUnit(item.id, val);
                      setAssigningId(null);
                    }}
                  >
                    <option value="">— Loose (no unit) —</option>
                    {allUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
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

              {/* Inline edit form */}
              {editingId === item.id && (
                <EditItemForm
                  item={item}
                  onSave={async (patch) => {
                    await collection.editModel(item.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
