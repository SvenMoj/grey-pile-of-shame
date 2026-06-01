"use client";

import { parseEditItem } from "@/lib/pile/parse-edit-item";
import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS } from "@/lib/pile/display";
import type { EditPileItem, PileItem } from "@/lib/pile/types";
import { Field } from "./Field";

export function EditItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: PileItem;
  onSave: (patch: EditPileItem) => Promise<unknown>;
  onCancel: () => void;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = parseEditItem(new FormData(e.currentTarget));
    if ("errors" in result) return; // validation failed — stay open
    await onSave(result.data);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="p-3 space-y-3 bg-gray-50 border-t">
      <Field label="Name" name="display_name" required defaultValue={item.display_name} />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Game"
          name="game"
          placeholder="e.g. Warhammer 40k"
          defaultValue={item.game ?? ""}
        />
        <Field
          label="Faction"
          name="faction"
          placeholder="e.g. Ultramarines"
          defaultValue={item.faction ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Unit size"
          name="unit_size"
          type="number"
          min={1}
          defaultValue={item.unit_size}
        />
        <Field
          label="Points"
          name="point_value"
          type="number"
          min={0}
          defaultValue={item.point_value ?? ""}
        />

        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select
            name="state"
            defaultValue={item.state}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {PILE_STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="bg-gray-900 text-white rounded px-3 py-1.5 text-xs">
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
