import type { PileItem, PileState, Unit } from "./types";

/**
 * Weighted progress value per stage: how much a model in this stage contributes
 * toward "done". Allows the progress bar to reflect partial work, not just
 * the binary painted / total fraction.
 */
export const STAGE_WEIGHTS: Record<PileState, number> = {
  unbuilt: 0,
  built: 0.25,
  primed: 0.5,
  in_progress: 0.75,
  painted: 1,
};

export interface StageCounts {
  unbuilt: number;
  built: number;
  primed: number;
  in_progress: number;
  painted: number;
  total: number;
}

export interface ProgressSummary {
  counts: StageCounts;
  /** Percentage of models painted, rounded to one decimal. 0 when total is 0. */
  paintedPct: number;
  /**
   * Weighted progress percentage (0–100, one decimal). Each stage contributes
   * proportionally to STAGE_WEIGHTS, so intermediate states (built, primed,
   * in_progress) move the bar rather than counting as 0%.
   */
  weightedPct: number;
  /** True only when total > 0 and every model is painted. */
  isComplete: boolean;
  /** Sum of point_value for painted models (null values treated as 0). */
  pointsPainted: number;
  /** Sum of point_value for all models (null values treated as 0). */
  pointsTotal: number;
}

export function summarizeItems(items: PileItem[]): ProgressSummary {
  const counts: StageCounts = {
    unbuilt: 0,
    built: 0,
    primed: 0,
    in_progress: 0,
    painted: 0,
    total: items.length,
  };

  let pointsPainted = 0;
  let pointsTotal = 0;

  for (const item of items) {
    counts[item.state]++;
    const pts = item.point_value ?? 0;
    pointsTotal += pts;
    if (item.state === "painted") pointsPainted += pts;
  }

  const paintedPct =
    counts.total === 0 ? 0 : Math.round((counts.painted / counts.total) * 1000) / 10;

  const weightedSum = (Object.keys(counts) as Array<keyof StageCounts>)
    .filter((k): k is PileState => k !== "total")
    .reduce((sum, state) => sum + counts[state] * STAGE_WEIGHTS[state], 0);
  const weightedPct = counts.total === 0 ? 0 : Math.round((weightedSum / counts.total) * 1000) / 10;

  const isComplete = counts.total > 0 && counts.painted === counts.total;

  return { counts, paintedPct, weightedPct, isComplete, pointsPainted, pointsTotal };
}

/** Progress summary for all models belonging to a specific unit. */
export function unitProgress(unitId: string, items: PileItem[]): ProgressSummary {
  return summarizeItems(items.filter((i) => i.unit_id === unitId));
}

/** Progress summary for all models whose unit belongs to a specific army. */
export function armyProgress(armyId: string, units: Unit[], items: PileItem[]): ProgressSummary {
  const unitIds = new Set(units.filter((u) => u.army_id === armyId).map((u) => u.id));
  return summarizeItems(items.filter((i) => i.unit_id !== null && unitIds.has(i.unit_id)));
}

/** Models that belong to no unit (unit_id === null). */
export function looseItems(items: PileItem[]): PileItem[] {
  return items.filter((i) => i.unit_id === null);
}

/** Units that belong to no army (army_id === null). */
export function looseUnits(units: Unit[]): Unit[] {
  return units.filter((u) => u.army_id === null);
}
