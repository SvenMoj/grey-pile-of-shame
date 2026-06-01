import { createPileItem, type FactoryDeps } from "./factory";
import { PILE_STATES } from "./states";
import type { PileItem, PileState } from "./types";

const STATE_LABELS: Record<PileState, string> = {
  unbuilt: "Unbuilt",
  built: "Built",
  primed: "Primed",
  in_progress: "In progress",
  painted: "Painted",
};

/**
 * Turn quick-count stepper values into skeletal PileItems.
 *
 * For each state in PILE_STATES order, create `count` items with a numbered
 * display_name (e.g. "Unbuilt #1"). Painted is excluded — the onboarding flow
 * never pre-imports finished models. Counts ≤ 0 are silently ignored.
 */
export function expandQuickCount(
  counts: Partial<Record<PileState, number>>,
  deps?: FactoryDeps,
): PileItem[] {
  const items: PileItem[] = [];

  for (const state of PILE_STATES) {
    if (state === "painted") continue; // never auto-create painted items

    const raw = counts[state];
    if (!raw || raw <= 0) continue;

    const count = Math.floor(raw);
    const label = STATE_LABELS[state];

    for (let i = 1; i <= count; i++) {
      items.push(
        createPileItem(
          {
            display_name: `${label} #${i}`,
            state,
          },
          deps,
        ),
      );
    }
  }

  return items;
}
