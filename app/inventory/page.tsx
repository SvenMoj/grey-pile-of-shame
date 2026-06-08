"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "@/lib/hooks/use-inventory";
import {
  INVENTORY_STATE_LABELS,
  INVENTORY_STATE_STYLES,
  INVENTORY_STATES,
} from "@/lib/inventory/display";
import type { InventoryState } from "@/lib/inventory/types";
import { fuzzyFilter } from "@/lib/inventory/fuzzy";
import { PaintSearch } from "@/components/PaintSearch";
import { PaintSwatch } from "@/components/PaintSwatch";
import { rowCardClass } from "@/lib/ui/list-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type StateFilter = InventoryState | "all";

export default function InventoryPage() {
  const { items, loaded, add, setState, setQuantity, remove } = useInventory();
  const [filter, setFilter] = useState<StateFilter>("all");
  const [text, setText] = useState("");

  const filtered = useMemo(() => {
    const byState = filter === "all" ? items : items.filter((i) => i.state === filter);
    return fuzzyFilter(text, byState, (i) => [i.name, i.brand, i.range, i.type]);
  }, [items, filter, text]);

  const ownedIds = useMemo(
    () => new Set(items.map((i) => i.catalog_paint_id).filter(Boolean) as string[]),
    [items],
  );

  async function handleAdd(paintId: string) {
    await add({ catalog_paint_id: paintId });
    toast.success("Added to inventory");
  }

  async function handleSetState(id: string, state: InventoryState) {
    await setState(id, state);
  }

  async function handleRemove(id: string) {
    await remove(id);
    toast("Removed from inventory");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Paint Inventory</h1>
        {loaded && (
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} {items.length === 1 ? "paint" : "paints"} tracked
          </p>
        )}
      </div>

      <PaintSearch onAdd={handleAdd} ownedIds={ownedIds} />

      {/* Text filter over owned items */}
      <Input
        placeholder="Filter your paints…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Filter inventory by name or brand"
      />

      {/* State filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        {INVENTORY_STATES.map((state) => (
          <Button
            key={state}
            variant={filter === state ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(state)}
          >
            {INVENTORY_STATE_LABELS[state]}
            <span className="ml-1.5 text-xs opacity-70">
              {items.filter((i) => i.state === state).length}
            </span>
          </Button>
        ))}
      </div>

      {/* Inventory list */}
      {!loaded ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          {text.trim()
            ? `No paints match "${text.trim()}".`
            : filter === "all"
              ? "No paints yet. Search above to add some."
              : `No paints marked as "${INVENTORY_STATE_LABELS[filter]}".`}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} className={rowCardClass()}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-3 min-w-0 basis-full sm:basis-auto sm:flex-1">
                  <PaintSwatch hex={item.hex} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.name ?? "Unknown paint"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.brand ?? ""}
                      {item.range ? ` · ${item.range}` : ""}
                      {item.type ? ` · ${item.type}` : ""}
                    </p>
                  </div>
                </div>

                {/* State badge + select */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={INVENTORY_STATE_STYLES[item.state]} variant="outline">
                    {INVENTORY_STATE_LABELS[item.state]}
                  </Badge>
                  <select
                    value={item.state}
                    onChange={(e) => void handleSetState(item.id, e.target.value as InventoryState)}
                    className="text-xs border border-border rounded px-1.5 py-1 bg-background text-foreground"
                    aria-label="Change state"
                  >
                    {INVENTORY_STATES.map((s) => (
                      <option key={s} value={s}>
                        {INVENTORY_STATE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => void setQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => void setQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Remove */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => void handleRemove(item.id)}
                  aria-label={`Remove ${item.name ?? "paint"} from inventory`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
