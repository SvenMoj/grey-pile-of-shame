"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
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
import { PaintSearch, type CatalogPaint } from "@/components/PaintSearch";
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

/** One paint component in a step's mix (client-side working type). */
type LocalComponent = {
  id: string; // temp UUID for UI keying
  paint_id: string | null;
  hex: string | null;
  ratio: number;
  paint: RecipeStep["paints"][number]["paint"];
};

type LocalStep = {
  id: string; // temp UUID for new unsaved steps, real UUID once saved
  role: RecipeStepRole;
  technique_note: string;
  area_note: string;
  paints: LocalComponent[];
};

type Props = {
  steps: LocalStep[];
  onChange: (steps: LocalStep[]) => void;
};

export type { LocalStep };

// ─── StepEditor ──────────────────────────────────────────────────────────────

export function StepEditor({ steps, onChange }: Props) {
  // Keyed by component id → whether the user is in custom hex entry mode.
  const [customHexMode, setCustomHexMode] = useState<Record<string, boolean>>({});

  function moveStep(index: number, direction: -1 | 1) {
    const next = [...steps];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  }

  function updateStep(index: number, patch: Partial<Omit<LocalStep, "paints">>) {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function addStep() {
    const newId = crypto.randomUUID();
    const componentId = crypto.randomUUID();
    onChange([
      ...steps,
      {
        id: newId,
        role: "basecoat",
        technique_note: "",
        area_note: "",
        paints: [{ id: componentId, paint_id: null, hex: null, ratio: 1, paint: null }],
      },
    ]);
  }

  function updatePaints(stepIndex: number, paints: LocalComponent[]) {
    onChange(steps.map((s, i) => (i === stepIndex ? { ...s, paints } : s)));
  }

  function addComponent(stepIndex: number) {
    const newId = crypto.randomUUID();
    const step = steps[stepIndex];
    updatePaints(stepIndex, [
      ...step.paints,
      { id: newId, paint_id: null, hex: null, ratio: 1, paint: null },
    ]);
  }

  function removeComponent(stepIndex: number, compIndex: number) {
    const step = steps[stepIndex];
    if (step.paints.length <= 1) return; // minimum one component
    updatePaints(
      stepIndex,
      step.paints.filter((_, i) => i !== compIndex),
    );
  }

  function moveComponent(stepIndex: number, compIndex: number, direction: -1 | 1) {
    const step = steps[stepIndex];
    const next = [...step.paints];
    const swap = compIndex + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[compIndex], next[swap]] = [next[swap], next[compIndex]];
    updatePaints(stepIndex, next);
  }

  function updateComponent(stepIndex: number, compIndex: number, patch: Partial<LocalComponent>) {
    const step = steps[stepIndex];
    updatePaints(
      stepIndex,
      step.paints.map((c, i) => (i === compIndex ? { ...c, ...patch } : c)),
    );
  }

  function handlePaintAdd(
    stepIndex: number,
    compIndex: number,
    paintId: string,
    catalogPaint: CatalogPaint,
  ) {
    updateComponent(stepIndex, compIndex, {
      paint_id: paintId,
      hex: null,
      paint: catalogPaint,
    });
  }

  return (
    <div className="space-y-3">
      {steps.map((step, stepIndex) => (
        <div key={step.id} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          {/* Row 1: move buttons + role + delete */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveStep(stepIndex, -1)}
                disabled={stepIndex === 0}
                aria-label="Move step up"
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveStep(stepIndex, 1)}
                disabled={stepIndex === steps.length - 1}
                aria-label="Move step down"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>

            <span className="text-sm text-muted-foreground w-5 text-center">{stepIndex + 1}.</span>

            {/* Role selector */}
            <div className="flex-1">
              <Label htmlFor={`role-${step.id}`} className="sr-only">
                Role
              </Label>
              <Select
                value={step.role}
                onValueChange={(v) => updateStep(stepIndex, { role: v as RecipeStepRole })}
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => removeStep(stepIndex)}
              aria-label="Remove step"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Row 2: paint components (mix) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {step.paints.length === 1 ? "Paint" : "Mix"}
            </Label>

            <div className="space-y-2">
              {step.paints.map((comp, compIndex) => (
                <ComponentRow
                  key={comp.id}
                  comp={comp}
                  compIndex={compIndex}
                  totalComponents={step.paints.length}
                  stepId={step.id}
                  isHexMode={customHexMode[comp.id] ?? false}
                  onSetHexMode={(on) => setCustomHexMode((m) => ({ ...m, [comp.id]: on }))}
                  onUpdate={(patch) => updateComponent(stepIndex, compIndex, patch)}
                  onRemove={() => removeComponent(stepIndex, compIndex)}
                  onMove={(dir) => moveComponent(stepIndex, compIndex, dir)}
                  onPaintAdd={(paintId, paint) =>
                    handlePaintAdd(stepIndex, compIndex, paintId, paint)
                  }
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => addComponent(stepIndex)}
            >
              <Plus className="size-3" />
              Add paint to mix
            </Button>
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
                onChange={(e) => updateStep(stepIndex, { technique_note: e.target.value })}
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
                onChange={(e) => updateStep(stepIndex, { area_note: e.target.value })}
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

// ─── ComponentRow ─────────────────────────────────────────────────────────────

type ComponentRowProps = {
  comp: LocalComponent;
  compIndex: number;
  totalComponents: number;
  stepId: string;
  isHexMode: boolean;
  onSetHexMode: (on: boolean) => void;
  onUpdate: (patch: Partial<LocalComponent>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onPaintAdd: (paintId: string, paint: CatalogPaint) => void;
};

function ComponentRow({
  comp,
  compIndex,
  totalComponents,
  stepId,
  isHexMode,
  onSetHexMode,
  onUpdate,
  onRemove,
  onMove,
  onPaintAdd,
}: ComponentRowProps) {
  const showMixControls = totalComponents > 1;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/50 p-2">
      <div className="flex items-center gap-2">
        {/* Ratio input */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            step={1}
            value={comp.ratio}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) onUpdate({ ratio: v });
            }}
            className="h-7 w-14 text-center text-sm font-mono"
            aria-label="Parts in mix"
          />
          <span className="text-xs text-muted-foreground">×</span>
        </div>

        {/* Current paint display */}
        {comp.paint && (
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <PaintSwatch hex={comp.paint.hex} size="sm" />
            <span className="text-sm font-medium truncate">{comp.paint.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">{comp.paint.brand}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs ml-auto shrink-0"
              onClick={() => onUpdate({ paint_id: null, paint: null })}
            >
              Change
            </Button>
          </div>
        )}

        {comp.hex && !comp.paint && (
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <PaintSwatch hex={comp.hex} size="sm" />
            <span className="text-sm text-muted-foreground font-mono">#{comp.hex}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs ml-auto shrink-0"
              onClick={() => {
                onSetHexMode(false);
                onUpdate({ hex: null });
              }}
            >
              Change
            </Button>
          </div>
        )}

        {/* Reorder within mix + remove */}
        {showMixControls && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMove(-1)}
              disabled={compIndex === 0}
              aria-label="Move paint up in mix"
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMove(1)}
              disabled={compIndex === totalComponents - 1}
              aria-label="Move paint down in mix"
            >
              <ChevronDown className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={onRemove}
              aria-label="Remove paint from mix"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Paint search / hex input (only when no paint selected yet) */}
      {!comp.paint && !comp.hex && (
        <div className="space-y-1.5">
          {isHexMode ? (
            <div className="flex gap-2">
              <Input
                id={`hex-${stepId}-${comp.id}`}
                placeholder="e.g. FF4500"
                maxLength={6}
                value={comp.hex ?? ""}
                onChange={(e) =>
                  onUpdate({ hex: e.target.value || null, paint_id: null, paint: null })
                }
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onSetHexMode(false);
                  onUpdate({ hex: null });
                }}
              >
                Use catalog paint
              </Button>
            </div>
          ) : (
            <>
              <PaintSearch onAdd={(paintId, catalogPaint) => onPaintAdd(paintId, catalogPaint)} />
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={() => onSetHexMode(true)}
              >
                Use a custom color instead
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
