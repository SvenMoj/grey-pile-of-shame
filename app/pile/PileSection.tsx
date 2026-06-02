"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isTerminal } from "@/lib/pile/states";
import type { EditPileItem, PileItem, PileState } from "@/lib/pile/types";
import { ModelItemRow } from "@/components/ModelItemRow";
import { StageStepper } from "@/components/StageStepper";
import { EditItemForm } from "./EditItemForm";

export function PileSection({
  state,
  label,
  items,
  onAdvance,
  onUpdate,
  onRemove,
}: {
  state: PileState;
  label: string;
  items: PileItem[];
  onAdvance: (id: string, to?: PileState) => Promise<unknown>;
  onUpdate: (id: string, patch: EditPileItem) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  return (
    <section>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="group mb-2 flex w-full items-center gap-1 text-left"
      >
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-150",
            collapsed && "-rotate-90",
          )}
        />
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase group-hover:text-foreground">
          {label} ({items.length})
        </h2>
      </button>
      {collapsed ? null : (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id}>
              <ModelItemRow
                item={item}
                advance={
                  !isTerminal(state) ? (
                    <StageStepper state={item.state} onAdvance={() => void onAdvance(item.id)} />
                  ) : undefined
                }
                actions={
                  <>
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
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void onRemove(item.id)}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  </>
                }
              />

              {editingId === item.id && (
                <EditItemForm
                  item={item}
                  onSave={async (patch) => {
                    await onUpdate(item.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
