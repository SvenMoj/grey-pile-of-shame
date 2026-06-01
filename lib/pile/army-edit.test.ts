import { describe, expect, it } from "vitest";
import { applyArmyEdit } from "./army-edit";
import type { Army } from "./types";

const FIXED_TIME = "2026-06-01T12:00:00.000Z";
const now = () => FIXED_TIME;

function makeArmy(overrides: Partial<Army> = {}): Army {
  return {
    id: "army-1",
    name: "Ultramarines",
    game: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("applyArmyEdit", () => {
  it("updates name", () => {
    const result = applyArmyEdit(makeArmy(), { name: "Iron Hands" }, now);
    expect(result.name).toBe("Iron Hands");
  });

  it("sets game from null", () => {
    const result = applyArmyEdit(makeArmy(), { game: "Warhammer 40k" }, now);
    expect(result.game).toBe("Warhammer 40k");
  });

  it("clears game with explicit null", () => {
    const result = applyArmyEdit(makeArmy({ game: "Warhammer 40k" }), { game: null }, now);
    expect(result.game).toBeNull();
  });

  it("preserves name when absent from patch", () => {
    const result = applyArmyEdit(makeArmy({ name: "Ultramarines" }), { game: "AoS" }, now);
    expect(result.name).toBe("Ultramarines");
  });

  it("preserves game when absent from patch", () => {
    const result = applyArmyEdit(makeArmy({ game: "40k" }), { name: "Raven Guard" }, now);
    expect(result.game).toBe("40k");
  });

  it("bumps updated_at", () => {
    const result = applyArmyEdit(makeArmy(), { name: "New" }, now);
    expect(result.updated_at).toBe(FIXED_TIME);
  });

  it("does not mutate the input", () => {
    const army = makeArmy();
    applyArmyEdit(army, { name: "Changed" }, now);
    expect(army.name).toBe("Ultramarines");
  });

  it("returns a new object reference", () => {
    const army = makeArmy();
    expect(applyArmyEdit(army, { name: "New" }, now)).not.toBe(army);
  });
});
