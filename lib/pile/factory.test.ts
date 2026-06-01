import { describe, expect, it } from "vitest";
import { createPileItem } from "./factory";

const FIXED_ID = "fixed-uuid";
const FIXED_TIME = "2026-06-01T12:00:00.000Z";
const deps = { id: () => FIXED_ID, now: () => FIXED_TIME };

describe("createPileItem", () => {
  describe("generated fields", () => {
    it("uses injected id and now", () => {
      const item = createPileItem({ display_name: "Sergeant" }, deps);
      expect(item.id).toBe(FIXED_ID);
      expect(item.created_at).toBe(FIXED_TIME);
      expect(item.updated_at).toBe(FIXED_TIME);
    });
  });

  describe("defaults", () => {
    it("defaults state to unbuilt", () => {
      const item = createPileItem({ display_name: "Marine" }, deps);
      expect(item.state).toBe("unbuilt");
    });

    it("defaults unit_size to 1", () => {
      const item = createPileItem({ display_name: "Marine" }, deps);
      expect(item.unit_size).toBe(1);
    });

    it("defaults nullable fields to null", () => {
      const item = createPileItem({ display_name: "Marine" }, deps);
      expect(item.kit_id).toBeNull();
      expect(item.game).toBeNull();
      expect(item.faction).toBeNull();
      expect(item.point_value).toBeNull();
      expect(item.painted_at).toBeNull();
    });
  });

  describe("explicit fields", () => {
    it("preserves all provided fields", () => {
      const item = createPileItem(
        {
          display_name: "Terminator",
          game: "Warhammer 40k",
          faction: "Ultramarines",
          unit_size: 5,
          point_value: 200,
          state: "primed",
          kit_id: "kit-001",
        },
        deps,
      );
      expect(item.display_name).toBe("Terminator");
      expect(item.game).toBe("Warhammer 40k");
      expect(item.faction).toBe("Ultramarines");
      expect(item.unit_size).toBe(5);
      expect(item.point_value).toBe(200);
      expect(item.state).toBe("primed");
      expect(item.kit_id).toBe("kit-001");
    });
  });

  describe("painted_at behaviour", () => {
    it("auto-sets painted_at when state is painted and painted_at not provided", () => {
      const item = createPileItem({ display_name: "Hero", state: "painted" }, deps);
      expect(item.painted_at).toBe(FIXED_TIME);
    });

    it("does not set painted_at for non-painted states", () => {
      const item = createPileItem({ display_name: "Hero", state: "in_progress" }, deps);
      expect(item.painted_at).toBeNull();
    });

    it("respects an explicit painted_at over the auto-set default", () => {
      const CUSTOM = "2025-12-25T00:00:00.000Z";
      const item = createPileItem(
        { display_name: "Hero", state: "painted", painted_at: CUSTOM },
        deps,
      );
      expect(item.painted_at).toBe(CUSTOM);
    });

    it("allows explicit painted_at null for a painted item", () => {
      // Unusual but valid — caller explicitly requests null (e.g. imported legacy data)
      const item = createPileItem(
        { display_name: "Hero", state: "painted", painted_at: null },
        deps,
      );
      expect(item.painted_at).toBeNull();
    });
  });
});
