import type { PileState } from "./types";

/** Human-readable label for each painting state. Single source of truth. */
export const STATE_LABELS: Record<PileState, string> = {
  unbuilt: "Unbuilt",
  built: "Built",
  primed: "Primed",
  in_progress: "In progress",
  painted: "Painted",
};

/** Tailwind colour classes for each stage — pill badges and segmented bar segments. */
export const STATE_STYLES: Record<PileState, { pill: string; bar: string }> = {
  unbuilt: {
    pill: "bg-gray-100 text-gray-600",
    bar: "bg-gray-300",
  },
  built: {
    pill: "bg-amber-100 text-amber-700",
    bar: "bg-amber-400",
  },
  primed: {
    pill: "bg-sky-100 text-sky-700",
    bar: "bg-sky-400",
  },
  in_progress: {
    pill: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-500",
  },
  painted: {
    pill: "bg-green-100 text-green-700",
    bar: "bg-green-500",
  },
};
