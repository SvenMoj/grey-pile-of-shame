import { PILE_STATES } from "@/lib/pile/states";
import { STATE_LABELS, STATE_STYLES } from "@/lib/pile/display";
import { cn } from "@/lib/utils";

/** Color key for the red → green painting-stage scale. */
export function StateLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-wrap gap-x-4 gap-y-1.5", className)}
      role="list"
      aria-label="Painting stage colors"
    >
      {PILE_STATES.map((state) => (
        <div
          key={state}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          role="listitem"
        >
          <span
            className={cn("size-2.5 shrink-0 rounded-full", STATE_STYLES[state].bar)}
            aria-hidden
          />
          {STATE_LABELS[state]}
        </div>
      ))}
    </div>
  );
}
