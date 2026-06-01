import { describe, expect, it } from "vitest";
import { PILE_STATES, advanceItem, isTerminal, nextState } from "./states";
import type { PileItem } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<PileItem> = {}): PileItem {
  return {
    id: "test-id",
    kit_id: null,
    display_name: "Test Model",
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
const fixedNow = () => FIXED_TIME;

// ---------------------------------------------------------------------------
// PILE_STATES
// ---------------------------------------------------------------------------

describe("PILE_STATES", () => {
  it("has exactly 5 states in the correct order", () => {
    expect(PILE_STATES).toEqual(["unbuilt", "built", "primed", "in_progress", "painted"]);
  });
});

// ---------------------------------------------------------------------------
// isTerminal
// ---------------------------------------------------------------------------

describe("isTerminal", () => {
  it("returns true for painted", () => {
    expect(isTerminal("painted")).toBe(true);
  });

  it("returns false for every non-terminal state", () => {
    expect(isTerminal("unbuilt")).toBe(false);
    expect(isTerminal("built")).toBe(false);
    expect(isTerminal("primed")).toBe(false);
    expect(isTerminal("in_progress")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// nextState
// ---------------------------------------------------------------------------

describe("nextState", () => {
  it("advances each state one step", () => {
    expect(nextState("unbuilt")).toBe("built");
    expect(nextState("built")).toBe("primed");
    expect(nextState("primed")).toBe("in_progress");
    expect(nextState("in_progress")).toBe("painted");
  });

  it("returns null for the terminal state", () => {
    expect(nextState("painted")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// advanceItem — default (no target)
// ---------------------------------------------------------------------------

describe("advanceItem (no target)", () => {
  it("advances one step from unbuilt to built", () => {
    const item = makeItem({ state: "unbuilt" });
    expect(advanceItem(item, undefined, fixedNow).state).toBe("built");
  });

  it("advances through every intermediate state", () => {
    expect(advanceItem(makeItem({ state: "built" }), undefined, fixedNow).state).toBe("primed");
    expect(advanceItem(makeItem({ state: "primed" }), undefined, fixedNow).state).toBe(
      "in_progress",
    );
    expect(advanceItem(makeItem({ state: "in_progress" }), undefined, fixedNow).state).toBe(
      "painted",
    );
  });

  it("sets painted_at only on the hop into painted", () => {
    const item = makeItem({ state: "in_progress" });
    const result = advanceItem(item, undefined, fixedNow);
    expect(result.state).toBe("painted");
    expect(result.painted_at).toBe(FIXED_TIME);
  });

  it("does not set painted_at on intermediate hops", () => {
    const result = advanceItem(makeItem({ state: "unbuilt" }), undefined, fixedNow);
    expect(result.state).toBe("built");
    expect(result.painted_at).toBeNull();
  });

  it("is a no-op when already painted — state unchanged", () => {
    const item = makeItem({ state: "painted", painted_at: "2026-05-01T00:00:00.000Z" });
    const result = advanceItem(item, undefined, fixedNow);
    expect(result.state).toBe("painted");
    expect(result.painted_at).toBe("2026-05-01T00:00:00.000Z"); // not overwritten
  });

  it("bumps updated_at on a real change", () => {
    const item = makeItem({ state: "unbuilt", updated_at: "2026-01-01T00:00:00.000Z" });
    const result = advanceItem(item, undefined, fixedNow);
    expect(result.updated_at).toBe(FIXED_TIME);
  });
});

// ---------------------------------------------------------------------------
// advanceItem — with explicit target (skip)
// ---------------------------------------------------------------------------

describe("advanceItem (with target)", () => {
  it("jumps directly to target state", () => {
    const item = makeItem({ state: "unbuilt" });
    const result = advanceItem(item, "painted", fixedNow);
    expect(result.state).toBe("painted");
    expect(result.painted_at).toBe(FIXED_TIME);
  });

  it("skips intermediate states", () => {
    const item = makeItem({ state: "unbuilt" });
    expect(advanceItem(item, "primed", fixedNow).state).toBe("primed");
  });

  it("is a no-op for backward moves", () => {
    const item = makeItem({ state: "primed" });
    const result = advanceItem(item, "unbuilt", fixedNow);
    expect(result.state).toBe("primed");
  });

  it("is a no-op for same-state moves", () => {
    const item = makeItem({ state: "built" });
    const result = advanceItem(item, "built", fixedNow);
    expect(result.state).toBe("built");
  });

  it("does not set painted_at when target is not painted", () => {
    const item = makeItem({ state: "unbuilt" });
    const result = advanceItem(item, "primed", fixedNow);
    expect(result.painted_at).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe("advanceItem (immutability)", () => {
  it("does not mutate the input item", () => {
    const item = makeItem({ state: "unbuilt" });
    advanceItem(item, undefined, fixedNow);
    expect(item.state).toBe("unbuilt");
  });

  it("always returns a new object reference", () => {
    const item = makeItem({ state: "painted", painted_at: "2026-05-01T00:00:00.000Z" });
    const result = advanceItem(item, undefined, fixedNow); // no-op case
    expect(result).not.toBe(item);
  });
});
