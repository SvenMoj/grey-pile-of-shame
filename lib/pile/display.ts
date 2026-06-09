import type { PileState } from "./types";

/** Human-readable label for each painting state. Single source of truth. */
export const STATE_LABELS: Record<PileState, string> = {
  unbuilt: "Unbuilt",
  built: "Built",
  primed: "Primed",
  in_progress: "In progress",
  painted: "Painted",
};

/**
 * Literal hex colours for each stage — used in Satori/next-og image generation
 * where Tailwind classes cannot be processed. Values mirror the `.bar` colours in
 * STATE_STYLES (red → orange → yellow → green).
 */
export const STATE_HEX: Record<PileState, string> = {
  unbuilt: "#7f1d1d", // red-900
  built: "#dc2626", // red-600
  primed: "#f97316", // orange-500
  in_progress: "#eab308", // yellow-500
  painted: "#16a34a", // green-600
};

/** Tailwind colour classes for each stage — red → orange → yellow → green progression. */
export const STATE_STYLES: Record<PileState, { pill: string; bar: string }> = {
  unbuilt: {
    pill: "bg-red-950/15 text-red-950 dark:bg-red-950/40 dark:text-red-200",
    bar: "bg-red-900",
  },
  built: {
    pill: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
    bar: "bg-red-600",
  },
  primed: {
    pill: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
    bar: "bg-orange-500",
  },
  in_progress: {
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200",
    bar: "bg-yellow-500",
  },
  painted: {
    pill: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-200",
    bar: "bg-green-600",
  },
};
