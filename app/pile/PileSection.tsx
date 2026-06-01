"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isTerminal } from "@/lib/pile/states";
import type { EditPileItem, PileItem, PileState } from "@/lib/pile/types";
import { StageStepper } from "@/app/_components/StageStepper";
import { StatePill } from "@/app/_components/StatePill";
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
                  {!isTerminal(state) && (
                    <StageStepper
                      state={item.state}
                      onAdvance={(to: PileState) => void onAdvance(item.id, to)}
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
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void onRemove(item.id)}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>

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
