import { describe, expect, it } from "vitest";
import { applyEdit } from "./edit";
import type { PileItem } from "./types";

function makeItem(overrides: Partial<PileItem> = {}): PileItem {
  return {
    id: "test-id",
    kit_id: null,
    display_name: "Unbuilt #1",
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: null,
    state: "unbuilt",
    point_value: null,
    created_at: "2026-01-01T00:00:00.000Z",
    painted_at: null,
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FIXED_TIME = "2026-06-01T12:00:00.000Z";
const now = () => FIXED_TIME;

// ---------------------------------------------------------------------------
// Field updates
// ---------------------------------------------------------------------------

describe("applyEdit — field updates", () => {
  it("updates display_name", () => {
    const item = makeItem();
    const result = applyEdit(item, { display_name: "Space Marine Sergeant" }, now);
    expect(result.display_name).toBe("Space Marine Sergeant");
  });

  it("sets game from null", () => {
    const item = makeItem();
    const result = applyEdit(item, { game: "Warhammer 40k" }, now);
    expect(result.game).toBe("Warhammer 40k");
  });

  it("sets faction from null", () => {
    const item = makeItem();
    const result = applyEdit(item, { faction: "Ultramarines" }, now);
    expect(result.faction).toBe("Ultramarines");
  });

  it("sets point_value", () => {
    const item = makeItem();
    const result = applyEdit(item, { point_value: 95 }, now);
    expect(result.point_value).toBe(95);
  });

  it("clears game with explicit null", () => {
    const item = makeItem({ game: "Warhammer 40k" });
    const result = applyEdit(item, { game: null }, now);
    expect(result.game).toBeNull();
  });

  it("clears faction with explicit null", () => {
    const item = makeItem({ faction: "Ultramarines" });
    const result = applyEdit(item, { faction: null }, now);
    expect(result.faction).toBeNull();
  });

  it("clears point_value with explicit null", () => {
    const item = makeItem({ point_value: 100 });
    const result = applyEdit(item, { point_value: null }, now);
    expect(result.point_value).toBeNull();
  });

  it("bumps updated_at on any edit", () => {
    const item = makeItem({ updated_at: "2026-01-01T00:00:00.000Z" });
    const result = applyEdit(item, { display_name: "Hero" }, now);
    expect(result.updated_at).toBe(FIXED_TIME);
  });
});

// ---------------------------------------------------------------------------
// Partial patch — absent keys leave fields unchanged
// ---------------------------------------------------------------------------

describe("applyEdit — partial patch", () => {
  it("leaves unchanged fields untouched", () => {
    const item = makeItem({
      display_name: "Captain",
      game: "40k",
      faction: "Iron Hands",
      point_value: 120,
    });
    const result = applyEdit(item, { display_name: "Updated Captain" }, now);
    expect(result.game).toBe("40k");
    expect(result.faction).toBe("Iron Hands");
    expect(result.point_value).toBe(120);
  });

  it("does not touch kit_id or created_at when absent from patch", () => {
    const item = makeItem({
      kit_id: "kit-1",
      created_at: "2025-01-01T00:00:00.000Z",
    });
    const result = applyEdit(item, { display_name: "New name" }, now);
    expect(result.kit_id).toBe("kit-1");
    expect(result.created_at).toBe("2025-01-01T00:00:00.000Z");
  });

  it("preserves unit_size when absent from patch", () => {
    const item = makeItem({ unit_size: 5 });
    const result = applyEdit(item, { display_name: "New name" }, now);
    expect(result.unit_size).toBe(5);
  });

  it("updates unit_size when present in patch", () => {
    const item = makeItem({ unit_size: 1 });
    const result = applyEdit(item, { unit_size: 10 }, now);
    expect(result.unit_size).toBe(10);
  });

  it("assigns unit_id when present in patch", () => {
    const item = makeItem({ unit_id: null });
    const result = applyEdit(item, { unit_id: "unit-abc" }, now);
    expect(result.unit_id).toBe("unit-abc");
  });

  it("clears unit_id with explicit null", () => {
    const item = makeItem({ unit_id: "unit-abc" });
    const result = applyEdit(item, { unit_id: null }, now);
    expect(result.unit_id).toBeNull();
  });

  it("preserves unit_id when absent from patch", () => {
    const item = makeItem({ unit_id: "unit-abc" });
    const result = applyEdit(item, { display_name: "New name" }, now);
    expect(result.unit_id).toBe("unit-abc");
  });
});

// ---------------------------------------------------------------------------
// State changes and painted_at
// ---------------------------------------------------------------------------

describe("applyEdit — state changes", () => {
  it("allows backward state moves (primed → built)", () => {
    const item = makeItem({ state: "primed" });
    const result = applyEdit(item, { state: "built" }, now);
    expect(result.state).toBe("built");
  });

  it("sets painted_at when state changes to painted", () => {
    const item = makeItem({ state: "in_progress", painted_at: null });
    const result = applyEdit(item, { state: "painted" }, now);
    expect(result.state).toBe("painted");
    expect(result.painted_at).toBe(FIXED_TIME);
  });

  it("clears painted_at when state moves off painted", () => {
    const item = makeItem({ state: "painted", painted_at: "2026-05-01T00:00:00.000Z" });
    const result = applyEdit(item, { state: "in_progress" }, now);
    expect(result.state).toBe("in_progress");
    expect(result.painted_at).toBeNull();
  });

  it("does not overwrite painted_at when already painted and state stays painted", () => {
    const item = makeItem({ state: "painted", painted_at: "2026-05-01T00:00:00.000Z" });
    const result = applyEdit(item, { state: "painted" }, now);
    expect(result.painted_at).toBe("2026-05-01T00:00:00.000Z");
  });

  it("does not touch painted_at when state is absent from patch", () => {
    const item = makeItem({ state: "painted", painted_at: "2026-05-01T00:00:00.000Z" });
    const result = applyEdit(item, { display_name: "Hero" }, now);
    expect(result.painted_at).toBe("2026-05-01T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe("applyEdit — immutability", () => {
  it("does not mutate the input item", () => {
    const item = makeItem({ display_name: "Original" });
    applyEdit(item, { display_name: "Changed" }, now);
    expect(item.display_name).toBe("Original");
  });

  it("always returns a new object reference", () => {
    const item = makeItem();
    const result = applyEdit(item, { display_name: "Same name" }, now);
    expect(result).not.toBe(item);
  });
});
