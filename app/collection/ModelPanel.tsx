"use client";

import { useState } from "react";
import { ArrowLeftRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  unit: Unit | null;
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
          className="space-y-3 rounded-lg border bg-muted/50 p-3"
        >
          <Field label="Name" name="display_name" required />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Add model
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="h-auto w-full justify-start border-dashed px-4 py-2 text-sm font-normal text-muted-foreground"
          onClick={() => setAddOpen(true)}
        >
          <Plus />
          Add model{unit ? ` to ${unit.name}` : ""}
        </Button>
      )}

      {unitItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No models here yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {unitItems.map((item) => (
            <li key={item.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.unit_size > 1 && (
                      <span className="mr-1 text-muted-foreground">{item.unit_size}×</span>
                    )}
                    {item.display_name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <StatePill state={item.state} />
                    {(item.game ?? item.faction ?? item.point_value) !== null && (
                      <p className="truncate text-xs text-muted-foreground">
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

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {item.state !== "painted" && (
                    <StageStepper
                      state={item.state}
                      onAdvance={(to: PileState) => void collection.advanceModel(item.id, to)}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditingId((cur) => (cur === item.id ? null : item.id))}
                  >
                    <Pencil />
                    {editingId === item.id ? "Close" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setAssigningId((cur) => (cur === item.id ? null : item.id))}
                  >
                    <ArrowLeftRight />
                    Move
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void collection.removeModel(item.id)}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>

              {assigningId === item.id && (
                <div className="flex items-center gap-2 border-t bg-muted/50 px-4 py-2">
                  <Label className="shrink-0 text-xs">Move to unit:</Label>
                  <select
                    className="h-7 flex-1 rounded-lg border border-input bg-transparent px-2 text-xs"
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
                  <Button variant="ghost" size="xs" onClick={() => setAssigningId(null)}>
                    Cancel
                  </Button>
                </div>
              )}

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
