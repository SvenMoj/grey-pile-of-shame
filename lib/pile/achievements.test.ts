import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, computeEarned } from "./achievements";
import type { AchievementContext } from "./achievements";
import type { Army, PileItem, Unit } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function paintedItem(
  opts: { point_value?: number | null; unit_id?: string | null } = {},
): PileItem {
  return {
    id: `item-${nextId++}`,
    kit_id: null,
    display_name: "Model",
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: opts.unit_id ?? null,
    state: "painted",
    point_value: opts.point_value ?? null,
    image_url: null,
    visibility: "private" as const,
    created_at: "2026-01-01T00:00:00.000Z",
    painted_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function unpaintedItem(opts: { unit_id?: string | null } = {}): PileItem {
  return {
    id: `item-${nextId++}`,
    kit_id: null,
    display_name: "Model",
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: opts.unit_id ?? null,
    state: "unbuilt",
    point_value: null,
    image_url: null,
    visibility: "private" as const,
    created_at: "2026-01-01T00:00:00.000Z",
    painted_at: null,
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function emptyCtx(): AchievementContext {
  return { items: [], units: [], armies: [] };
}

// ---------------------------------------------------------------------------
// computeEarned — general
// ---------------------------------------------------------------------------

describe("computeEarned", () => {
  it("returns empty array for empty context", () => {
    expect(computeEarned(emptyCtx())).toEqual([]);
  });

  it("returns only earned achievement ids", () => {
    const ctx = { ...emptyCtx(), items: [paintedItem()] };
    const earned = computeEarned(ctx);
    expect(earned).toContain("first_painted");
  });
});

// ---------------------------------------------------------------------------
// first_painted
// ---------------------------------------------------------------------------

describe("first_painted", () => {
  const def = ACHIEVEMENTS.find((a) => a.id === "first_painted")!;

  it("not earned when no painted items", () => {
    expect(def.earned({ ...emptyCtx(), items: [unpaintedItem()] })).toBe(false);
  });

  it("earned when at least one item is painted", () => {
    expect(def.earned({ ...emptyCtx(), items: [paintedItem()] })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ten_painted / fifty_painted
// ---------------------------------------------------------------------------

describe("ten_painted", () => {
  const def = ACHIEVEMENTS.find((a) => a.id === "ten_painted")!;

  it("not earned at 9 painted", () => {
    const ctx = { ...emptyCtx(), items: Array.from({ length: 9 }, () => paintedItem()) };
    expect(def.earned(ctx)).toBe(false);
  });

  it("earned at exactly 10 painted", () => {
    const ctx = { ...emptyCtx(), items: Array.from({ length: 10 }, () => paintedItem()) };
    expect(def.earned(ctx)).toBe(true);
  });
});

describe("fifty_painted", () => {
  const def = ACHIEVEMENTS.find((a) => a.id === "fifty_painted")!;

  it("not earned at 49 painted", () => {
    const ctx = { ...emptyCtx(), items: Array.from({ length: 49 }, () => paintedItem()) };
    expect(def.earned(ctx)).toBe(false);
  });

  it("earned at exactly 50 painted", () => {
    const ctx = { ...emptyCtx(), items: Array.from({ length: 50 }, () => paintedItem()) };
    expect(def.earned(ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// points_100 / points_500 / points_1000
// ---------------------------------------------------------------------------

describe.each([
  { id: "points_100", threshold: 100 },
  { id: "points_500", threshold: 500 },
  { id: "points_1000", threshold: 1000 },
])("$id", ({ id, threshold }) => {
  const def = ACHIEVEMENTS.find((a) => a.id === id)!;

  it(`not earned at ${threshold - 1} painted points`, () => {
    const ctx = { ...emptyCtx(), items: [paintedItem({ point_value: threshold - 1 })] };
    expect(def.earned(ctx)).toBe(false);
  });

  it(`earned at exactly ${threshold} painted points`, () => {
    const ctx = { ...emptyCtx(), items: [paintedItem({ point_value: threshold })] };
    expect(def.earned(ctx)).toBe(true);
  });

  it("only counts points from painted items", () => {
    const ctx = {
      ...emptyCtx(),
      items: [
        paintedItem({ point_value: threshold - 10 }),
        unpaintedItem(), // has no point_value but even if it did it shouldn't count
      ],
    };
    expect(def.earned(ctx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// first_unit_complete
// ---------------------------------------------------------------------------

describe("first_unit_complete", () => {
  const def = ACHIEVEMENTS.find((a) => a.id === "first_unit_complete")!;

  it("not earned when no units exist", () => {
    expect(def.earned(emptyCtx())).toBe(false);
  });

  it("not earned when unit exists but no models", () => {
    const units: Unit[] = [
      { id: "u1", army_id: null, name: "Squad", created_at: "", updated_at: "" },
    ];
    expect(def.earned({ ...emptyCtx(), units })).toBe(false);
  });

  it("not earned when unit has models but not all painted", () => {
    const units: Unit[] = [
      { id: "u1", army_id: null, name: "Squad", created_at: "", updated_at: "" },
    ];
    const items = [paintedItem({ unit_id: "u1" }), unpaintedItem({ unit_id: "u1" })];
    expect(def.earned({ ...emptyCtx(), units, items })).toBe(false);
  });

  it("earned when all models in any unit are painted", () => {
    const units: Unit[] = [
      { id: "u1", army_id: null, name: "Squad", created_at: "", updated_at: "" },
    ];
    const items = [paintedItem({ unit_id: "u1" }), paintedItem({ unit_id: "u1" })];
    expect(def.earned({ ...emptyCtx(), units, items })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// first_army_complete
// ---------------------------------------------------------------------------

describe("first_army_complete", () => {
  const def = ACHIEVEMENTS.find((a) => a.id === "first_army_complete")!;

  it("not earned when no armies exist", () => {
    expect(def.earned(emptyCtx())).toBe(false);
  });

  it("not earned when army has no units", () => {
    const armies: Army[] = [
      { id: "a1", name: "Force", game: null, created_at: "", updated_at: "" },
    ];
    expect(def.earned({ ...emptyCtx(), armies })).toBe(false);
  });

  it("not earned when army is incomplete", () => {
    const armies: Army[] = [
      { id: "a1", name: "Force", game: null, created_at: "", updated_at: "" },
    ];
    const units: Unit[] = [
      { id: "u1", army_id: "a1", name: "Squad", created_at: "", updated_at: "" },
    ];
    const items = [paintedItem({ unit_id: "u1" }), unpaintedItem({ unit_id: "u1" })];
    expect(def.earned({ ...emptyCtx(), armies, units, items })).toBe(false);
  });

  it("earned when all models in every unit of any army are painted", () => {
    const armies: Army[] = [
      { id: "a1", name: "Force", game: null, created_at: "", updated_at: "" },
    ];
    const units: Unit[] = [
      { id: "u1", army_id: "a1", name: "Squad", created_at: "", updated_at: "" },
    ];
    const items = [paintedItem({ unit_id: "u1" }), paintedItem({ unit_id: "u1" })];
    expect(def.earned({ ...emptyCtx(), armies, units, items })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ACHIEVEMENTS catalog completeness
// ---------------------------------------------------------------------------

describe("ACHIEVEMENTS catalog", () => {
  it("contains all expected badge ids", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(ids).toContain("first_painted");
    expect(ids).toContain("ten_painted");
    expect(ids).toContain("fifty_painted");
    expect(ids).toContain("points_100");
    expect(ids).toContain("points_500");
    expect(ids).toContain("points_1000");
    expect(ids).toContain("first_unit_complete");
    expect(ids).toContain("first_army_complete");
  });

  it("every definition has a non-empty title and description", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });
});
