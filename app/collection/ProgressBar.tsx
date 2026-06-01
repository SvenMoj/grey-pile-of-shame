import { PILE_STATES } from "@/lib/pile/states";
import { STATE_STYLES } from "@/lib/pile/display";
import type { ProgressSummary } from "@/lib/pile/progress";

export function ProgressBar({
  summary,
  compact = false,
}: {
  summary: ProgressSummary;
  compact?: boolean;
}) {
  const { counts, weightedPct, paintedPct, isComplete } = summary;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {/* Segmented track */}
      <div
        className={`flex overflow-hidden rounded-full bg-gray-200 ${compact ? "h-1.5" : "h-2"}`}
      >
        {PILE_STATES.map((state) => {
          const count = counts[state];
          if (count === 0 || counts.total === 0) return null;
          const widthPct = (count / counts.total) * 100;
          return (
            <div
              key={state}
              className={`h-full transition-all duration-300 ${STATE_STYLES[state].bar}`}
              style={{ width: `${widthPct}%` }}
            />
          );
        })}
      </div>

      {/* Label */}
      <p className="text-xs text-gray-500">
        {isComplete ? (
          "Complete"
        ) : (
          <>
            {counts.painted}/{counts.total} painted
            {!compact && weightedPct > 0 && ` · ${weightedPct}% done`}
            {compact && paintedPct > 0 && ` · ${paintedPct}%`}
          </>
        )}
      </p>
    </div>
  );
}
