import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

/**
 * Coloured pill badge showing a model's current painting state.
 * Each stage has a distinct colour so intermediate progress is immediately visible.
 */
export function StatePill({ state }: { state: PileState }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATE_STYLES[state].pill}`}>
      {STATE_LABELS[state]}
    </span>
  );
}
