import { describe, expect, it } from "vitest";
import { parsePile, serializePile, PILE_STORAGE_KEY } from "./serialize";
import type { PileItem } from "./types";

function makeItem(overrides: Partial<PileItem> = {}): PileItem {
  return {
    id: "item-1",
    kit_id: null,
    display_name: "Sergeant",
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: null,
    state: "unbuilt",
    point_value: null,
    image_url: null,
    visibility: "private" as const,
    created_at: "2026-06-01T00:00:00.000Z",
    painted_at: null,
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PILE_STORAGE_KEY", () => {
  it("is the expected versioned key", () => {
    expect(PILE_STORAGE_KEY).toBe("gpos.pile.v1");
  });
});

describe("round-trip", () => {
  it("serializes and parses back to the same items", () => {
    const items = [makeItem(), makeItem({ id: "item-2", state: "primed" })];
    expect(parsePile(serializePile(items))).toEqual(items);
  });

  it("round-trips an empty array", () => {
    expect(parsePile(serializePile([]))).toEqual([]);
  });

  it("round-trips every state", () => {
    const items = (["unbuilt", "built", "primed", "in_progress", "painted"] as const).map(
      (state, i) =>
        makeItem({
          id: `item-${i}`,
          state,
          painted_at: state === "painted" ? "2026-06-01T00:00:00.000Z" : null,
        }),
    );
    expect(parsePile(serializePile(items))).toEqual(items);
  });
});

describe("parsePile — graceful fallback to []", () => {
  it("returns [] for null", () => {
    expect(parsePile(null)).toEqual([]);
  });

  it("returns [] for undefined", () => {
    expect(parsePile(undefined)).toEqual([]);
  });

  it("returns [] for empty string", () => {
    expect(parsePile("")).toEqual([]);
  });

  it("returns [] for malformed JSON", () => {
    expect(parsePile("{not json")).toEqual([]);
  });

  it("returns [] for non-object JSON (string)", () => {
    expect(parsePile('"just a string"')).toEqual([]);
  });

  it("returns [] for non-object JSON (number)", () => {
    expect(parsePile("42")).toEqual([]);
  });

  it("returns [] for JSON null", () => {
    expect(parsePile("null")).toEqual([]);
  });

  it("returns [] for a JSON array (not the envelope object)", () => {
    expect(parsePile("[]")).toEqual([]);
  });

  it("returns [] when version is wrong", () => {
    expect(parsePile(JSON.stringify({ version: 2, items: [] }))).toEqual([]);
  });

  it("returns [] when version is missing", () => {
    expect(parsePile(JSON.stringify({ items: [] }))).toEqual([]);
  });

  it("returns [] when items is missing", () => {
    expect(parsePile(JSON.stringify({ version: 1 }))).toEqual([]);
  });

  it("returns [] when items is not an array", () => {
    expect(parsePile(JSON.stringify({ version: 1, items: "oops" }))).toEqual([]);
  });
});

describe("parsePile — partial corruption recovery", () => {
  it("keeps valid items and discards ones missing id", () => {
    const good = makeItem({ id: "good" });
    const bad = { ...makeItem(), id: "" }; // empty string id = invalid
    const raw = JSON.stringify({ version: 1, items: [good, bad] });
    expect(parsePile(raw)).toEqual([good]);
  });

  it("keeps valid items and discards ones missing display_name", () => {
    const good = makeItem({ id: "ok" });
    const bad = { ...makeItem({ id: "bad" }), display_name: "" };
    const raw = JSON.stringify({ version: 1, items: [good, bad] });
    expect(parsePile(raw)).toEqual([good]);
  });

  it("keeps valid items and discards ones with an invalid state", () => {
    const good = makeItem({ id: "good" });
    const bad = { ...makeItem({ id: "bad" }), state: "flying" };
    const raw = JSON.stringify({ version: 1, items: [good, bad] });
    expect(parsePile(raw)).toEqual([good]);
  });

  it("keeps valid items and discards non-object entries", () => {
    const good = makeItem({ id: "good" });
    const raw = JSON.stringify({ version: 1, items: [good, 42, null, "string"] });
    expect(parsePile(raw)).toEqual([good]);
  });
});
