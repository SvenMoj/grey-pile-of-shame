/**
 * Consistent completion badge used at every level (model, unit, army).
 * Replaces the ad-hoc ⚜️ / "✓ Done" / green pill that previously varied per site.
 */
export function CompletionBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium text-green-700 ${className}`}
      aria-label="Complete"
    >
      <span aria-hidden>✓</span>
      <span>Done</span>
    </span>
  );
}
