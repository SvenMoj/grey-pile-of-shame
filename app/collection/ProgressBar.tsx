import type { ProgressSummary } from "@/lib/pile/progress";

export function ProgressBar({
  summary,
  compact = false,
}: {
  summary: ProgressSummary;
  compact?: boolean;
}) {
  const { paintedPct, counts, isComplete } = summary;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {/* Track */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-accent" : "bg-gray-900"}`}
          style={{ width: `${paintedPct}%` }}
        />
      </div>
      {/* Label */}
      <p className="text-xs text-gray-500">
        {counts.painted}/{counts.total} painted
        {!compact && paintedPct > 0 && ` · ${paintedPct}%`}
      </p>
    </div>
  );
}
