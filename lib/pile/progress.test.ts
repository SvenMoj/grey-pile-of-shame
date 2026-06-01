import { describe, expect, it } from "vitest";
import { summarizeItems, unitProgress, armyProgress, looseItems, looseUnits } from "./progress";
import type { PileItem, Unit } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1;
function item(
  state: PileItem["state"],
  opts: { unit_id?: string | null; point_value?: number | null } = {},
): PileItem {
  return {
    id: `item-${nextId++}`,
    kit_id: null,
    display_name: "Model",
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: opts.unit_id ?? null,
    state,
    point_value: opts.point_value ?? null,
    created_at: "2026-01-01T00:00:00.000Z",
    painted_at: state === "painted" ? "2026-01-01T00:00:00.000Z" : null,
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function unit(id: string, army_id: string | null = null): Unit {
  return {
    id,
    army_id,
    name: `Unit ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// summarizeItems
// ---------------------------------------------------------------------------

describe("summarizeItems", () => {
  it("returns zeros and isComplete=false for an empty array", () => {
    const s = summarizeItems([]);
    expect(s.counts.total).toBe(0);
    expect(s.paintedPct).toBe(0);
    expect(s.isComplete).toBe(false);
    expect(s.pointsPainted).toBe(0);
    expect(s.pointsTotal).toBe(0);
  });

  it("counts each state correctly", () => {
    const items = [
      item("unbuilt"),
      item("built"),
      item("primed"),
      item("in_progress"),
      item("painted"),
    ];
    const s = summarizeItems(items);
    expect(s.counts.unbuilt).toBe(1);
    expect(s.counts.built).toBe(1);
    expect(s.counts.primed).toBe(1);
    expect(s.counts.in_progress).toBe(1);
    expect(s.counts.painted).toBe(1);
    expect(s.counts.total).toBe(5);
  });

  it("isComplete is true when all items are painted and total > 0", () => {
    const s = summarizeItems([item("painted"), item("painted")]);
    expect(s.isComplete).toBe(true);
  });

  it("isComplete is false when not all items are painted", () => {
    const s = summarizeItems([item("painted"), item("unbuilt")]);
    expect(s.isComplete).toBe(false);
  });

  it("paintedPct is 0 when no items are painted", () => {
    const s = summarizeItems([item("unbuilt"), item("built")]);
    expect(s.paintedPct).toBe(0);
  });

  it("paintedPct is 100 when all items are painted", () => {
    const s = summarizeItems([item("painted"), item("painted")]);
    expect(s.paintedPct).toBe(100);
  });

  it("paintedPct rounds to one decimal", () => {
    // 1 of 3 = 33.3%
    const s = summarizeItems([item("painted"), item("unbuilt"), item("unbuilt")]);
    expect(s.paintedPct).toBeCloseTo(33.3, 1);
  });

  it("sums point_value only for painted items", () => {
    const items = [
      item("painted", { point_value: 100 }),
      item("in_progress", { point_value: 50 }),
      item("unbuilt", { point_value: 20 }),
    ];
    const s = summarizeItems(items);
    expect(s.pointsPainted).toBe(100);
    expect(s.pointsTotal).toBe(170);
  });

  it("ignores null point_value items in totals", () => {
    const items = [item("painted", { point_value: null }), item("painted", { point_value: 75 })];
    const s = summarizeItems(items);
    expect(s.pointsPainted).toBe(75);
    expect(s.pointsTotal).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// unitProgress
// ---------------------------------------------------------------------------

describe("unitProgress", () => {
  it("returns an empty summary for a unit with no models", () => {
    const s = unitProgress("unit-1", []);
    expect(s.counts.total).toBe(0);
    expect(s.isComplete).toBe(false);
  });

  it("only counts items that belong to the specified unit", () => {
    const items = [
      item("painted", { unit_id: "unit-1" }),
      item("unbuilt", { unit_id: "unit-2" }),
      item("unbuilt", { unit_id: null }),
    ];
    const s = unitProgress("unit-1", items);
    expect(s.counts.total).toBe(1);
    expect(s.counts.painted).toBe(1);
    expect(s.isComplete).toBe(true);
  });

  it("isComplete=false when unit is non-empty but not all painted", () => {
    const items = [item("painted", { unit_id: "unit-1" }), item("unbuilt", { unit_id: "unit-1" })];
    expect(unitProgress("unit-1", items).isComplete).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// armyProgress
// ---------------------------------------------------------------------------

describe("armyProgress", () => {
  it("returns empty summary when army has no units", () => {
    const s = armyProgress("army-1", [], [item("painted")]);
    expect(s.counts.total).toBe(0);
    expect(s.isComplete).toBe(false);
  });

  it("rolls up models across all units in the army", () => {
    const units = [unit("unit-1", "army-1"), unit("unit-2", "army-1")];
    const items = [
      item("painted", { unit_id: "unit-1" }),
      item("painted", { unit_id: "unit-2" }),
      item("unbuilt", { unit_id: null }), // loose, excluded
    ];
    const s = armyProgress("army-1", units, items);
    expect(s.counts.total).toBe(2);
    expect(s.counts.painted).toBe(2);
    expect(s.isComplete).toBe(true);
  });

  it("excludes models belonging to units of other armies", () => {
    const units = [unit("unit-1", "army-1"), unit("unit-2", "army-2")];
    const items = [item("painted", { unit_id: "unit-1" }), item("unbuilt", { unit_id: "unit-2" })];
    const s = armyProgress("army-1", units, items);
    expect(s.counts.total).toBe(1);
    expect(s.counts.painted).toBe(1);
  });

  it("isComplete=false when not all army models are painted", () => {
    const units = [unit("unit-1", "army-1")];
    const items = [item("painted", { unit_id: "unit-1" }), item("unbuilt", { unit_id: "unit-1" })];
    expect(armyProgress("army-1", units, items).isComplete).toBe(false);
  });

  it("sums points correctly across multiple units", () => {
    const units = [unit("unit-1", "army-1"), unit("unit-2", "army-1")];
    const items = [
      item("painted", { unit_id: "unit-1", point_value: 100 }),
      item("painted", { unit_id: "unit-2", point_value: 200 }),
    ];
    const s = armyProgress("army-1", units, items);
    expect(s.pointsPainted).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// looseItems / looseUnits
// ---------------------------------------------------------------------------

describe("looseItems", () => {
  it("returns only items with unit_id === null", () => {
    const items = [
      item("unbuilt", { unit_id: null }),
      item("built", { unit_id: "unit-1" }),
      item("primed", { unit_id: null }),
    ];
    const loose = looseItems(items);
    expect(loose).toHaveLength(2);
    expect(loose.every((i) => i.unit_id === null)).toBe(true);
  });

  it("returns empty array when all items belong to a unit", () => {
    expect(looseItems([item("painted", { unit_id: "unit-1" })])).toHaveLength(0);
  });
});

describe("looseUnits", () => {
  it("returns only units with army_id === null", () => {
    const units = [unit("u1", null), unit("u2", "army-1"), unit("u3", null)];
    const loose = looseUnits(units);
    expect(loose).toHaveLength(2);
    expect(loose.every((u) => u.army_id === null)).toBe(true);
  });

  it("returns empty array when all units belong to an army", () => {
    expect(looseUnits([unit("u1", "army-1")])).toHaveLength(0);
  });
});
