"use client";

import { useRef } from "react";
import { parseQuickAdd } from "@/lib/pile/parse-quick-add";
import { PILE_STATES } from "@/lib/pile/states";
import type { NewPileItem } from "@/lib/pile/types";
import { Field } from "./Field";

const STATE_LABELS: Record<(typeof PILE_STATES)[number], string> = {
  unbuilt: "Unbuilt",
  built: "Built",
  primed: "Primed",
  in_progress: "In progress",
  painted: "Painted",
};

export function QuickAddForm({
  onAdd,
  onAddMany,
}: {
  onAdd: (item: NewPileItem) => Promise<unknown>;
  onAddMany: (items: NewPileItem[]) => Promise<unknown>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = parseQuickAdd(new FormData(e.currentTarget));
    if ("errors" in result) return; // TODO: surface field-level errors
    if (result.data.length === 1) {
      await onAdd(result.data[0]);
    } else {
      await onAddMany(result.data);
    }
    formRef.current?.reset();
  }

  return (
    <details className="border rounded">
      <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none">
        + Add a model
      </summary>
      <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} className="p-4 space-y-3 border-t">
        <Field label="Name" name="display_name" required placeholder="e.g. Space Marine Sergeant" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Game" name="game" placeholder="e.g. Warhammer 40k" />
          <Field label="Faction" name="faction" placeholder="e.g. Ultramarines" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Points" name="point_value" type="number" min={0} />
          <Field label="Qty" name="unit_size" type="number" defaultValue={1} min={1} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select name="state" defaultValue="unbuilt" className="border rounded px-3 py-2 text-sm">
            {PILE_STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2 text-sm">
          Add to pile
        </button>
      </form>
    </details>
  );
}
