import { describe, expect, it } from "vitest";
import { applyUnitEdit } from "./unit-edit";
import type { Unit } from "./types";

const FIXED_TIME = "2026-06-01T12:00:00.000Z";
const now = () => FIXED_TIME;

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: "unit-1",
    army_id: null,
    name: "Tactical Squad",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("applyUnitEdit", () => {
  it("updates name", () => {
    const result = applyUnitEdit(makeUnit(), { name: "Terminator Squad" }, now);
    expect(result.name).toBe("Terminator Squad");
  });

  it("assigns army_id", () => {
    const result = applyUnitEdit(makeUnit({ army_id: null }), { army_id: "army-1" }, now);
    expect(result.army_id).toBe("army-1");
  });

  it("unassigns army_id with explicit null", () => {
    const result = applyUnitEdit(makeUnit({ army_id: "army-1" }), { army_id: null }, now);
    expect(result.army_id).toBeNull();
  });

  it("preserves name when absent from patch", () => {
    const result = applyUnitEdit(makeUnit({ name: "Tactical Squad" }), { army_id: "army-2" }, now);
    expect(result.name).toBe("Tactical Squad");
  });

  it("preserves army_id when absent from patch", () => {
    const result = applyUnitEdit(makeUnit({ army_id: "army-1" }), { name: "New Name" }, now);
    expect(result.army_id).toBe("army-1");
  });

  it("bumps updated_at", () => {
    const result = applyUnitEdit(makeUnit(), { name: "New" }, now);
    expect(result.updated_at).toBe(FIXED_TIME);
  });

  it("does not mutate the input", () => {
    const unit = makeUnit();
    applyUnitEdit(unit, { name: "Changed" }, now);
    expect(unit.name).toBe("Tactical Squad");
  });

  it("returns a new object reference", () => {
    const unit = makeUnit();
    expect(applyUnitEdit(unit, { name: "New" }, now)).not.toBe(unit);
  });
});
