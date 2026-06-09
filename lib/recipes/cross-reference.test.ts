import { describe, expect, it } from "vitest";
import { indexConversionsByRecipePaint, selectBrandSubstitutes } from "./cross-reference";
import type { RawConversionRow } from "./cross-reference";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePaint(id: string, brand = "Citadel", name = id, hex: string | null = null) {
  return { id, brand, name, hex, range: null };
}

function makeConversion(
  paintAId: string,
  paintBId: string,
  confidence: number,
  aBrand = "Citadel",
  bBrand = "Vallejo",
): RawConversionRow {
  return {
    confidence,
    paint_a: makePaint(paintAId, aBrand),
    paint_b: makePaint(paintBId, bBrand),
  };
}

// ─── indexConversionsByRecipePaint ───────────────────────────────────────────

describe("indexConversionsByRecipePaint", () => {
  it("returns an empty map for empty inputs", () => {
    const map = indexConversionsByRecipePaint([], new Set());
    expect(map.size).toBe(0);
  });

  it("indexes a simple A→B conversion where A is a recipe paint", () => {
    const rows = [makeConversion("red", "alt-red", 0.9)];
    const map = indexConversionsByRecipePaint(rows, new Set(["red"]));

    expect(map.has("red")).toBe(true);
    const edges = map.get("red")!;
    expect(edges).toHaveLength(1);
    expect(edges[0].fromPaintId).toBe("red");
    expect(edges[0].toPaint.id).toBe("alt-red");
    expect(edges[0].confidence).toBe(0.9);
  });

  it("indexes a B→A conversion where B is a recipe paint (bidirectional)", () => {
    // The recipe uses 'alt-red'; the conversion row has alt-red as paint_b
    const rows = [makeConversion("red", "alt-red", 0.85)];
    const map = indexConversionsByRecipePaint(rows, new Set(["alt-red"]));

    expect(map.has("alt-red")).toBe(true);
    const edges = map.get("alt-red")!;
    expect(edges).toHaveLength(1);
    expect(edges[0].fromPaintId).toBe("alt-red");
    expect(edges[0].toPaint.id).toBe("red");
  });

  it("emits edges for both ends when both paints are recipe paints", () => {
    const rows = [makeConversion("red", "blue", 0.7)];
    const map = indexConversionsByRecipePaint(rows, new Set(["red", "blue"]));

    expect(map.get("red")![0].toPaint.id).toBe("blue");
    expect(map.get("blue")![0].toPaint.id).toBe("red");
  });

  it("drops self-edges", () => {
    const row: RawConversionRow = {
      confidence: 1,
      paint_a: makePaint("red"),
      paint_b: makePaint("red"),
    };
    const map = indexConversionsByRecipePaint([row], new Set(["red"]));
    expect(map.get("red") ?? []).toHaveLength(0);
  });

  it("keeps the highest confidence on duplicate (fromId, toId) pairs", () => {
    const rows = [makeConversion("red", "alt", 0.5), makeConversion("red", "alt", 0.9)];
    const map = indexConversionsByRecipePaint(rows, new Set(["red"]));
    const edges = map.get("red")!;
    expect(edges).toHaveLength(1);
    expect(edges[0].confidence).toBe(0.9);
  });

  it("ignores conversions that do not involve any recipe paint", () => {
    const rows = [makeConversion("unrelated-a", "unrelated-b", 0.8)];
    const map = indexConversionsByRecipePaint(rows, new Set(["red"]));
    expect(map.size).toBe(0);
  });
});

// ─── selectBrandSubstitutes ──────────────────────────────────────────────────

describe("selectBrandSubstitutes", () => {
  it("returns empty candidates for unrecognized brand", () => {
    const results = selectBrandSubstitutes(["red"], "UnknownBrand", new Map());
    expect(results).toHaveLength(1);
    expect(results[0].candidates).toHaveLength(0);
  });

  it("filters edges to the target brand and sorts by confidence desc", () => {
    const edges = [
      { fromPaintId: "red", toPaint: makePaint("v-red", "Vallejo"), confidence: 0.7 },
      { fromPaintId: "red", toPaint: makePaint("v-red2", "Vallejo"), confidence: 0.95 },
      { fromPaintId: "red", toPaint: makePaint("citadel-red", "Citadel"), confidence: 1.0 },
    ];
    const map = new Map([["red", edges]]);
    const results = selectBrandSubstitutes(["red"], "Vallejo", map);

    expect(results).toHaveLength(1);
    expect(results[0].recipePaintId).toBe("red");
    expect(results[0].candidates).toHaveLength(2);
    expect(results[0].candidates[0].paint.id).toBe("v-red2");
    expect(results[0].candidates[1].paint.id).toBe("v-red");
  });

  it("handles a recipe paint with no conversions", () => {
    const results = selectBrandSubstitutes(["red"], "Vallejo", new Map());
    expect(results[0].candidates).toHaveLength(0);
  });

  it("returns a result entry for each recipe paint", () => {
    const results = selectBrandSubstitutes(["red", "blue", "green"], "Vallejo", new Map());
    expect(results.map((r) => r.recipePaintId)).toEqual(["red", "blue", "green"]);
  });
});
