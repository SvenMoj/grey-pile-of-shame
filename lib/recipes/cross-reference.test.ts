import { describe, expect, it } from "vitest";
import {
  indexConversionsByRecipePaint,
  resolveStepStatus,
  resolveStepMix,
  resolveAllSteps,
  selectBrandSubstitutes,
} from "./cross-reference";
import type { RawConversionRow } from "./cross-reference";
import type { RecipeStep, RecipeStepComponent } from "./types";

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

function makeComponent(
  paintId: string | null,
  hex: string | null = null,
  ratio = 1,
): RecipeStepComponent {
  return {
    id: crypto.randomUUID(),
    position: 0,
    paint_id: paintId,
    hex,
    ratio,
    paint: paintId ? makePaint(paintId) : null,
  };
}

function makeStep(id: string, components: RecipeStepComponent[]): RecipeStep {
  return {
    id,
    step_order: 0,
    role: "basecoat",
    technique_note: null,
    area_note: null,
    paints: components.map((c, i) => ({ ...c, position: i })),
  };
}

/** Convenience: single-paint step */
function makeSinglePaintStep(id: string, paintId: string | null, hex: string | null = null) {
  return makeStep(id, [makeComponent(paintId, hex)]);
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

// ─── resolveStepStatus ───────────────────────────────────────────────────────

describe("resolveStepStatus", () => {
  it("returns no_catalog_paint when targetPaintId is null", () => {
    const status = resolveStepStatus(null, new Set(), new Map());
    expect(status.kind).toBe("no_catalog_paint");
  });

  it("returns owned when the paint is in the owned set", () => {
    const status = resolveStepStatus("red", new Set(["red"]), new Map());
    expect(status.kind).toBe("owned");
  });

  it("returns missing when no conversions exist and paint is not owned", () => {
    const status = resolveStepStatus("red", new Set(), new Map());
    expect(status.kind).toBe("missing");
  });

  it("returns substitute_owned when a conversion target is owned", () => {
    const edges = [{ fromPaintId: "red", toPaint: makePaint("alt-red"), confidence: 0.8 }];
    const map = new Map([["red", edges]]);
    const status = resolveStepStatus("red", new Set(["alt-red"]), map);

    expect(status.kind).toBe("substitute_owned");
    if (status.kind === "substitute_owned") {
      expect(status.substitute.id).toBe("alt-red");
      expect(status.confidence).toBe(0.8);
    }
  });

  it("returns owned (not substitute) when the exact paint is owned even if a substitute is too", () => {
    const edges = [{ fromPaintId: "red", toPaint: makePaint("alt-red"), confidence: 0.9 }];
    const map = new Map([["red", edges]]);
    const status = resolveStepStatus("red", new Set(["red", "alt-red"]), map);
    expect(status.kind).toBe("owned");
  });

  it("picks the highest-confidence substitute when multiple are owned", () => {
    const edges = [
      { fromPaintId: "red", toPaint: makePaint("alt-low"), confidence: 0.5 },
      { fromPaintId: "red", toPaint: makePaint("alt-high"), confidence: 0.95 },
    ];
    const map = new Map([["red", edges]]);
    const status = resolveStepStatus("red", new Set(["alt-low", "alt-high"]), map);

    expect(status.kind).toBe("substitute_owned");
    if (status.kind === "substitute_owned") {
      expect(status.substitute.id).toBe("alt-high");
      expect(status.confidence).toBe(0.95);
    }
  });

  it("is deterministic on tied confidence (sorts by toPaint.id)", () => {
    const edges = [
      { fromPaintId: "red", toPaint: makePaint("zzz"), confidence: 0.8 },
      { fromPaintId: "red", toPaint: makePaint("aaa"), confidence: 0.8 },
    ];
    const map = new Map([["red", edges]]);
    const status = resolveStepStatus("red", new Set(["zzz", "aaa"]), map);

    expect(status.kind).toBe("substitute_owned");
    if (status.kind === "substitute_owned") {
      expect(status.substitute.id).toBe("aaa"); // lexicographically first
    }
  });

  it("returns missing when substitutes exist but none are owned", () => {
    const edges = [{ fromPaintId: "red", toPaint: makePaint("alt-red"), confidence: 0.8 }];
    const map = new Map([["red", edges]]);
    const status = resolveStepStatus("red", new Set(["other-paint"]), map);
    expect(status.kind).toBe("missing");
  });
});

// ─── resolveStepMix ──────────────────────────────────────────────────────────

describe("resolveStepMix", () => {
  it("returns no_catalog_paint when all components are hex-only", () => {
    const step = makeStep("s1", [makeComponent(null, "FF0000"), makeComponent(null, "0000FF")]);
    const result = resolveStepMix(step, new Set(), new Map());
    expect(result.kind).toBe("no_catalog_paint");
    expect(result.components).toHaveLength(2);
  });

  it("returns owned when single component is owned", () => {
    const step = makeSinglePaintStep("s1", "red");
    const result = resolveStepMix(step, new Set(["red"]), new Map());
    expect(result.kind).toBe("owned");
    expect(result.components[0].status.kind).toBe("owned");
  });

  it("returns owned when all catalog components are owned", () => {
    const step = makeStep("s1", [makeComponent("red"), makeComponent("blue")]);
    const result = resolveStepMix(step, new Set(["red", "blue"]), new Map());
    expect(result.kind).toBe("owned");
  });

  it("returns owned when all catalog components are owned via substitute", () => {
    const edges = [{ fromPaintId: "red", toPaint: makePaint("alt-red"), confidence: 0.9 }];
    const map = new Map([["red", edges]]);
    const step = makeSinglePaintStep("s1", "red");
    const result = resolveStepMix(step, new Set(["alt-red"]), map);
    expect(result.kind).toBe("owned");
    expect(result.components[0].status.kind).toBe("substitute_owned");
  });

  it("returns missing when single catalog component is not owned", () => {
    const step = makeSinglePaintStep("s1", "red");
    const result = resolveStepMix(step, new Set(), new Map());
    expect(result.kind).toBe("missing");
  });

  it("returns missing when no catalog components are covered in a multi-paint step", () => {
    const step = makeStep("s1", [makeComponent("red"), makeComponent("blue")]);
    const result = resolveStepMix(step, new Set(), new Map());
    expect(result.kind).toBe("missing");
  });

  it("returns partial when only some components are owned in a multi-paint step", () => {
    const step = makeStep("s1", [makeComponent("red"), makeComponent("blue")]);
    const result = resolveStepMix(step, new Set(["red"]), new Map());
    expect(result.kind).toBe("partial");
    expect(result.components[0].status.kind).toBe("owned");
    expect(result.components[1].status.kind).toBe("missing");
  });

  it("treats hex components as no_catalog_paint in a mixed catalog+hex step (still owned if catalog covered)", () => {
    // Step has a catalog paint (owned) + a hex component — should be 'owned' since
    // only catalog components are checked in the rollup.
    const step = makeStep("s1", [makeComponent("red"), makeComponent(null, "FF0000")]);
    const result = resolveStepMix(step, new Set(["red"]), new Map());
    expect(result.kind).toBe("owned");
    expect(result.components[1].status.kind).toBe("no_catalog_paint");
  });

  it("returns component statuses in input order", () => {
    const step = makeStep("s1", [makeComponent("red"), makeComponent("blue")]);
    const result = resolveStepMix(step, new Set(["blue"]), new Map());
    expect(result.components[0].status.kind).toBe("missing");
    expect(result.components[1].status.kind).toBe("owned");
  });
});

// ─── resolveAllSteps ─────────────────────────────────────────────────────────

describe("resolveAllSteps", () => {
  it("maps each step to a mix status", () => {
    const steps: RecipeStep[] = [
      makeSinglePaintStep("s1", "red"),
      makeSinglePaintStep("s2", null, "FF0000"),
      makeSinglePaintStep("s3", "blue"),
    ];
    const edges = [{ fromPaintId: "red", toPaint: makePaint("alt-red"), confidence: 0.9 }];
    const map = new Map([["red", edges]]);
    const results = resolveAllSteps(steps, new Set(["red"]), map);

    expect(results).toHaveLength(3);
    expect(results[0].kind).toBe("owned");
    expect(results[1].kind).toBe("no_catalog_paint");
    expect(results[2].kind).toBe("missing");
  });

  it("returns partial for a multi-paint step where only one is owned", () => {
    const steps: RecipeStep[] = [makeStep("s1", [makeComponent("red"), makeComponent("blue")])];
    const results = resolveAllSteps(steps, new Set(["red"]), new Map());
    expect(results[0].kind).toBe("partial");
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
