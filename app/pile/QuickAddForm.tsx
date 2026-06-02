"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { parseQuickAdd } from "@/lib/pile/parse-quick-add";
import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS } from "@/lib/pile/display";
import type { NewPileItem } from "@/lib/pile/types";
import { Field } from "@/components/Field";
import { SelectField } from "@/components/SelectField";

export function QuickAddForm({
  onAdd,
  onAddMany,
}: {
  onAdd: (item: NewPileItem) => Promise<unknown>;
  onAddMany: (items: NewPileItem[]) => Promise<unknown>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = parseQuickAdd(new FormData(e.currentTarget));
    if ("errors" in result) return;
    if (result.data.length === 1) {
      await onAdd(result.data[0]);
    } else {
      await onAddMany(result.data);
    }
    formRef.current?.reset();
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-lg px-4 py-3 text-sm font-medium"
        >
          <Plus />
          Add a model
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <form
          ref={formRef}
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-3 border-t p-4"
        >
          <Field
            label="Name"
            name="display_name"
            required
            placeholder="e.g. Space Marine Sergeant"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Game" name="game" placeholder="e.g. Warhammer 40k" />
            <Field label="Faction" name="faction" placeholder="e.g. Ultramarines" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Points" name="point_value" type="number" min={0} />
            <Field label="Qty" name="unit_size" type="number" defaultValue={1} min={1} />
          </div>

          <SelectField label="State" name="state" defaultValue="unbuilt">
            {PILE_STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_LABELS[s]}
              </option>
            ))}
          </SelectField>

          <Button type="submit">Add to pile</Button>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}
