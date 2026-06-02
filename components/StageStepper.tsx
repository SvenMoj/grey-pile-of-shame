"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { modelAdvanceButtonClass } from "@/components/ModelItemRow";
import { nextState } from "@/lib/pile/states";
import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

/** Single action to advance a model one painting stage forward. */
export function StageStepper({ state, onAdvance }: { state: PileState; onAdvance: () => void }) {
  const next = nextState(state);
  if (!next) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={onAdvance}
      className={cn(modelAdvanceButtonClass, STATE_STYLES[next].pill)}
      title={`Move to ${STATE_LABELS[next]}`}
    >
      <span className="truncate">Move to {STATE_LABELS[next]}</span>
      <ChevronRight className="size-3 shrink-0" />
    </Button>
  );
}
