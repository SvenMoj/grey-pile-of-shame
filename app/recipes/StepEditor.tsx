"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaintSearch } from "@/components/PaintSearch";
import { PaintSwatch } from "@/components/PaintSwatch";
import type { RecipeStep, RecipeStepRole } from "@/lib/recipes/types";

const STEP_ROLE_LABELS: Record<RecipeStepRole, string> = {
  basecoat: "Basecoat",
  layer: "Layer",
  highlight: "Highlight",
  edge_highlight: "Edge highlight",
  shade: "Shade",
  drybrush: "Drybrush",
  glaze: "Glaze",
  wash: "Wash",
  other: "Other",
};

type LocalStep = {
  id: string; // temp UUID for new unsaved steps, real UUID once saved
  role: RecipeStepRole;
  target_paint_id: string | null;
  target_hex: string | null;
  technique_note: string;
  area_note: string;
  paint: RecipeStep["paint"];
};

type Props = {
  steps: LocalStep[];
  onChange: (steps: LocalStep[]) => void;
  ownedIds?: Set<string>;
};

export type { LocalStep };

export function StepEditor({ steps, onChange, ownedIds }: Props) {
  const [customHexMode, setCustomHexMode] = useState<Record<string, boolean>>({});

  function move(index: number, direction: -1 | 1) {
    const next = [...steps];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  }

  function update(index: number, patch: Partial<LocalStep>) {
    const next = steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  }

  function remove(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function addStep() {
    const newId = crypto.randomUUID();
    onChange([
      ...steps,
      {
        id: newId,
        role: "basecoat",
        target_paint_id: null,
        target_hex: null,
        technique_note: "",
        area_note: "",
        paint: null,
      },
    ]);
  }

  function handlePaintAdd(index: number, paintId: string, paint: RecipeStep["paint"]) {
    update(index, { target_paint_id: paintId, target_hex: null, paint });
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          {/* Row 1: move buttons + role + paint swatch */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move step up"
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => move(index, 1)}
                disabled={index === steps.length - 1}
                aria-label="Move step down"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            <span className="text-sm text-muted-foreground w-5 text-center">{index + 1}.</span>

            {/* Role selector — uses shadcn Select for controlled state */}
            <div className="flex-1">
              <Label htmlFor={`role-${step.id}`} className="sr-only">
                Role
              </Label>
              <Select
                value={step.role}
                onValueChange={(v) => update(index, { role: v as RecipeStepRole })}
              >
                <SelectTrigger id={`role-${step.id}`} size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STEP_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {step.paint && <PaintSwatch hex={step.paint.hex} name={step.paint.name} size="sm" />}
            {step.target_hex && !step.paint && <PaintSwatch hex={step.target_hex} size="sm" />}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => remove(index)}
              aria-label="Remove step"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Row 2: paint selection */}
          <div className="space-y-2">
            {customHexMode[step.id] ? (
              <div className="space-y-1.5">
                <Label htmlFor={`hex-${step.id}`} className="text-xs text-muted-foreground">
                  Custom hex color (no catalog paint)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`hex-${step.id}`}
                    placeholder="e.g. FF4500"
                    maxLength={6}
                    value={step.target_hex ?? ""}
                    onChange={(e) =>
                      update(index, {
                        target_hex: e.target.value || null,
                        target_paint_id: null,
                        paint: null,
                      })
                    }
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomHexMode((m) => ({ ...m, [step.id]: false }));
                      update(index, { target_hex: null });
                    }}
                  >
                    Use catalog paint
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Paint</Label>
                {step.paint ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <span className="font-medium">{step.paint.name}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{step.paint.brand}</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => update(index, { target_paint_id: null, paint: null })}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <PaintSearchWithCallback
                      onAdd={(paintId, paint) => handlePaintAdd(index, paintId, paint)}
                      ownedIds={ownedIds}
                    />
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={() => setCustomHexMode((m) => ({ ...m, [step.id]: true }))}
                    >
                      Use a custom color instead
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Row 3: technique + area notes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`tech-${step.id}`} className="text-xs text-muted-foreground">
                Technique note
              </Label>
              <Input
                id={`tech-${step.id}`}
                placeholder="e.g. thin 1:2"
                value={step.technique_note}
                onChange={(e) => update(index, { technique_note: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`area-${step.id}`} className="text-xs text-muted-foreground">
                Area note
              </Label>
              <Input
                id={`area-${step.id}`}
                placeholder="e.g. skin only"
                value={step.area_note}
                onChange={(e) => update(index, { area_note: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addStep}>
        + Add step
      </Button>
    </div>
  );
}

// Thin wrapper that also fetches the paint metadata for the parent to store
function PaintSearchWithCallback({
  onAdd,
  ownedIds,
}: {
  onAdd: (paintId: string, paint: RecipeStep["paint"]) => void;
  ownedIds?: Set<string>;
}) {
  return (
    <PaintSearch
      onAdd={(paintId) => {
        onAdd(paintId, null);
      }}
      ownedIds={ownedIds}
    />
  );
}
