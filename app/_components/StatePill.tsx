import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

/**
 * Coloured pill badge showing a model's current painting state.
 * Each stage has a distinct colour so intermediate progress is immediately visible.
 */
export function StatePill({ state }: { state: PileState }) {
  return (
    <Badge variant="secondary" className={cn("text-xs", STATE_STYLES[state].pill)}>
      {STATE_LABELS[state]}
    </Badge>
  );
}
