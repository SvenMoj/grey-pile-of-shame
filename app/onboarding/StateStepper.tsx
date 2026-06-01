"use client";

export function StateStepper({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 border rounded px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 rounded border text-sm font-medium disabled:text-gray-300 disabled:border-gray-200"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 rounded border text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}
