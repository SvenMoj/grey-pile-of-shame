"use client";

import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

/**
 * Compact segmented stage stepper — renders all 5 painting stages as clickable
 * segments. Stages up to and including the current state are filled with their
 * stage colour; stages beyond it are muted and clickable to advance forward.
 *
 * The underlying advanceState() ratchet means clicking the current stage or any
 * earlier stage is safely ignored.
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
    <div className="flex rounded overflow-hidden border border-gray-200 w-fit" role="group" aria-label="Painting stage">
      {PILE_STATES.map((s, idx) => {
        const isCurrent = idx === currentIdx;
        const isPast = idx < currentIdx;
        const isFuture = idx > currentIdx;

        let className =
          "px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-400";

        if (isCurrent) {
          className += ` ${STATE_STYLES[s].pill} cursor-default font-semibold`;
        } else if (isPast) {
          className += ` ${STATE_STYLES[s].pill} opacity-60 cursor-default`;
        } else {
          // future stage — clickable to jump forward
          className +=
            " bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer";
        }

        // Add separator
        if (idx > 0) {
          className += " border-l border-gray-200";
        }

        return (
          <button
            key={s}
            type="button"
            disabled={!isFuture}
            onClick={() => isFuture && onAdvance(s)}
            className={className}
            aria-current={isCurrent ? "true" : undefined}
            title={isFuture ? `Advance to ${STATE_LABELS[s]}` : STATE_LABELS[s]}
          >
            {STATE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
