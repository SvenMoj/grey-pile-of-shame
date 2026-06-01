import { armyProgress, unitProgress } from "./progress";
import type { Army, PileItem, Unit } from "./types";

export interface AchievementContext {
  items: PileItem[];
  units: Unit[];
  armies: Army[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  earned(ctx: AchievementContext): boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paintedCount(items: PileItem[]): number {
  return items.filter((i) => i.state === "painted").length;
}

function paintedPoints(items: PileItem[]): number {
  return items
    .filter((i) => i.state === "painted")
    .reduce((sum, i) => sum + (i.point_value ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_painted",
    title: "First Blood",
    description: "Paint your very first model.",
    icon: "🎨",
    earned: ({ items }) => paintedCount(items) >= 1,
  },
  {
    id: "ten_painted",
    title: "Brush Warrior",
    description: "Paint 10 models.",
    icon: "⚔️",
    earned: ({ items }) => paintedCount(items) >= 10,
  },
  {
    id: "fifty_painted",
    title: "Veteran Painter",
    description: "Paint 50 models.",
    icon: "🏆",
    earned: ({ items }) => paintedCount(items) >= 50,
  },
  {
    id: "points_100",
    title: "Century",
    description: "Accumulate 100 painted points.",
    icon: "💯",
    earned: ({ items }) => paintedPoints(items) >= 100,
  },
  {
    id: "points_500",
    title: "Half a Grand",
    description: "Accumulate 500 painted points.",
    icon: "💎",
    earned: ({ items }) => paintedPoints(items) >= 500,
  },
  {
    id: "points_1000",
    title: "Grand Master",
    description: "Accumulate 1,000 painted points.",
    icon: "👑",
    earned: ({ items }) => paintedPoints(items) >= 1000,
  },
  {
    id: "first_unit_complete",
    title: "Fully Operational",
    description: "Paint every model in a unit.",
    icon: "🛡️",
    earned: ({ items, units }) => units.some((u) => unitProgress(u.id, items).isComplete),
  },
  {
    id: "first_army_complete",
    title: "The Emperor's Will",
    description: "Paint every model in an entire army.",
    icon: "⚜️",
    earned: ({ items, units, armies }) =>
      armies.some((a) => armyProgress(a.id, units, items).isComplete),
  },
];

/**
 * Returns the ids of all achievements currently earned by the given context.
 * Pure: same input → same output. The "fire once" concern lives in the store.
 */
export function computeEarned(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(ctx)).map((a) => a.id);
}
