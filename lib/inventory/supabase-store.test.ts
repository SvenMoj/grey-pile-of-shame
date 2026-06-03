import { describe, it, expect } from "vitest";
import { toInventoryItem } from "./supabase-store";

describe("toInventoryItem", () => {
  const baseRow = {
    id: "uuid-1",
    catalog_paint_id: "citadel-mephiston-red",
    custom_name: null,
    custom_brand: null,
    custom_hex: null,
    state: "owned",
    quantity: 2,
    added_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    user_id: "user-uuid",
    paints: {
      brand: "Citadel",
      name: "Mephiston Red",
      hex: "7C0A02",
      range: "Base",
      type: "base",
    },
  };

  it("maps all fields from a catalog-linked row", () => {
    const item = toInventoryItem(baseRow);
    expect(item).toEqual({
      id: "uuid-1",
      catalog_paint_id: "citadel-mephiston-red",
      state: "owned",
      quantity: 2,
      added_at: "2026-01-01T00:00:00Z",
      brand: "Citadel",
      name: "Mephiston Red",
      hex: "7C0A02",
      range: "Base",
      type: "base",
    });
  });

  it("handles null joined paint (catalog paint deleted)", () => {
    const row = { ...baseRow, catalog_paint_id: null, paints: null };
    const item = toInventoryItem(row);
    expect(item.brand).toBeNull();
    expect(item.name).toBeNull();
    expect(item.hex).toBeNull();
    expect(item.range).toBeNull();
    expect(item.type).toBeNull();
  });

  it("uses quantity 1 when quantity is missing (pre-migration rows)", () => {
    const row = { ...baseRow, quantity: undefined };
    const item = toInventoryItem(row);
    expect(item.quantity).toBe(1);
  });

  it("defaults state to 'owned' when missing", () => {
    const row = { ...baseRow, state: undefined };
    const item = toInventoryItem(row);
    expect(item.state).toBe("owned");
  });
});
