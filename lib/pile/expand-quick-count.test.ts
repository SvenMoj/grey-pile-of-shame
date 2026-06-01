import { describe, expect, it } from "vitest";
import { expandQuickCount } from "./expand-quick-count";

let counter = 0;
function deps() {
  return { id: () => `id-${++counter}`, now: () => "2026-06-01T12:00:00.000Z" };
}

describe("expandQuickCount", () => {
  describe("basic expansion", () => {
    it("creates the correct number of items", () => {
      const items = expandQuickCount({ unbuilt: 3 }, deps());
      expect(items).toHaveLength(3);
    });

    it("assigns the correct state to all items", () => {
      const items = expandQuickCount({ built: 2 }, deps());
      expect(items.every((i) => i.state === "built")).toBe(true);
    });

    it("numbers display names starting at 1", () => {
      const items = expandQuickCount({ primed: 2 }, deps());
      expect(items[0].display_name).toBe("Primed #1");
      expect(items[1].display_name).toBe("Primed #2");
    });

    it("uses friendly labels for each state", () => {
      const stateLabels: Record<string, string> = {
        unbuilt: "Unbuilt",
        built: "Built",
        primed: "Primed",
        in_progress: "In progress",
      };
      for (const [state, label] of Object.entries(stateLabels)) {
        const items = expandQuickCount({ [state]: 1 } as Record<string, number>, deps());
        expect(items[0].display_name).toBe(`${label} #1`);
      }
    });
  });

  describe("ordering", () => {
    it("emits items in PILE_STATES order when multiple states given", () => {
      const items = expandQuickCount({ primed: 1, unbuilt: 2 }, deps());
      // unbuilt comes before primed in PILE_STATES
      expect(items[0].state).toBe("unbuilt");
      expect(items[1].state).toBe("unbuilt");
      expect(items[2].state).toBe("primed");
    });
  });

  describe("defaults applied", () => {
    it("sets unit_size to 1 on every item", () => {
      const items = expandQuickCount({ unbuilt: 2 }, deps());
      expect(items.every((i) => i.unit_size === 1)).toBe(true);
    });

    it("sets painted_at to null on every item", () => {
      const items = expandQuickCount({ in_progress: 2 }, deps());
      expect(items.every((i) => i.painted_at === null)).toBe(true);
    });

    it("generates distinct ids for each item", () => {
      const items = expandQuickCount({ unbuilt: 3 }, deps());
      const ids = items.map((i) => i.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for an empty counts object", () => {
      expect(expandQuickCount({}, deps())).toHaveLength(0);
    });

    it("ignores counts of zero", () => {
      expect(expandQuickCount({ unbuilt: 0 }, deps())).toHaveLength(0);
    });

    it("ignores negative counts", () => {
      expect(expandQuickCount({ unbuilt: -3 }, deps())).toHaveLength(0);
    });

    it("never creates painted items", () => {
      const items = expandQuickCount({ painted: 5 } as Record<string, number>, deps());
      expect(items).toHaveLength(0);
    });

    it("floors non-integer counts", () => {
      const items = expandQuickCount({ built: 2.9 }, deps());
      expect(items).toHaveLength(2);
    });
  });

  describe("mixed states", () => {
    it("handles all four onboarding states at once", () => {
      const items = expandQuickCount({ unbuilt: 5, built: 2, primed: 1, in_progress: 1 }, deps());
      expect(items).toHaveLength(9);
      const states = items.map((i) => i.state);
      // verify ordering: all unbuilt before all built (PILE_STATES order)
      const lastUnbuilt = states.lastIndexOf("unbuilt");
      const firstBuilt = states.indexOf("built");
      expect(lastUnbuilt).toBeLessThan(firstBuilt);
    });
  });
});
