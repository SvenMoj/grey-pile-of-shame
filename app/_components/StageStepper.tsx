"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

/**
 * Compact segmented stage stepper — renders all 5 painting stages as clickable
 * segments. Stages up to and including the current state are filled with their
 * stage colour; stages beyond it are muted and clickable to advance forward.
 */
export function StageStepper({
  state,
  onAdvance,
}: {
  state: PileState;
  onAdvance: (to: PileState) => void;
}) {
  const currentIdx = PILE_STATES.indexOf(state);

  return (
    <div
      className="flex w-fit overflow-hidden rounded-lg border border-border"
      role="group"
      aria-label="Painting stage"
    >
      {PILE_STATES.map((s, idx) => {
        const isCurrent = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <Button
            key={s}
            type="button"
            variant="ghost"
            size="xs"
            disabled={!isFuture}
            onClick={() => isFuture && onAdvance(s)}
            className={cn(
              "h-auto rounded-none px-2 py-1 text-xs font-medium",
              idx > 0 && "border-l border-border",
              isCurrent &&
                cn(STATE_STYLES[s].pill, "cursor-default font-semibold hover:bg-transparent"),
              isPast && cn(STATE_STYLES[s].pill, "cursor-default opacity-60 hover:bg-transparent"),
              isFuture && "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={isCurrent ? "true" : undefined}
            title={isFuture ? `Advance to ${STATE_LABELS[s]}` : STATE_LABELS[s]}
          >
            {STATE_LABELS[s]}
          </Button>
        );
      })}
    </div>
  );
}
