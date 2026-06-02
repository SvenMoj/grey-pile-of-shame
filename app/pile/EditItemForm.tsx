"use client";

import { parseEditItem } from "@/lib/pile/parse-edit-item";
import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS } from "@/lib/pile/display";
import type { EditPileItem, PileItem } from "@/lib/pile/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { SelectField } from "@/components/SelectField";

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
    if ("errors" in result) return;
    await onSave(result.data);
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-3 rounded-lg border border-border bg-muted/50 p-3"
    >
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

        <SelectField label="State" name="state" defaultValue={item.state}>
          {PILE_STATES.map((s) => (
            <option key={s} value={s}>
              {STATE_LABELS[s]}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
