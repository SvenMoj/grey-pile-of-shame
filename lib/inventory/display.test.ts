import { describe, it, expect } from "vitest";
import { INVENTORY_STATE_LABELS, INVENTORY_STATE_STYLES, INVENTORY_STATES } from "./display";

describe("INVENTORY_STATES", () => {
  it("lists the three schema states in order", () => {
    expect(INVENTORY_STATES).toEqual(["owned", "wishlist", "running_low"]);
  });
});

describe("INVENTORY_STATE_LABELS", () => {
  it("has a label for every state", () => {
    for (const state of INVENTORY_STATES) {
      expect(INVENTORY_STATE_LABELS[state]).toBeTruthy();
    }
  });

  it("returns human-readable strings", () => {
    expect(INVENTORY_STATE_LABELS.owned).toBe("Owned");
    expect(INVENTORY_STATE_LABELS.wishlist).toBe("Wishlist");
    expect(INVENTORY_STATE_LABELS.running_low).toBe("Running Low");
  });
});

describe("INVENTORY_STATE_STYLES", () => {
  it("has a badge class for every state", () => {
    for (const state of INVENTORY_STATES) {
      expect(INVENTORY_STATE_STYLES[state]).toBeTruthy();
    }
  });

  it("each style is a non-empty string", () => {
    for (const state of INVENTORY_STATES) {
      expect(typeof INVENTORY_STATE_STYLES[state]).toBe("string");
      expect(INVENTORY_STATE_STYLES[state].length).toBeGreaterThan(0);
    }
  });
});
