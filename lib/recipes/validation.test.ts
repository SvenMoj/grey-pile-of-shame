import { describe, expect, it } from "vitest";
import { validateRecipeForm, parseStepsPayload, planStepSync } from "./validation";
import type { ParsedStep, ParsedComponent } from "./validation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

function makeComponent(overrides: Partial<ParsedComponent> = {}): ParsedComponent {
  return {
    paint_id: "some-paint-id",
    hex: null,
    ratio: 1,
    ...overrides,
  };
}

function makeStep(id: string, overrides: Partial<ParsedStep> = {}): ParsedStep {
  return {
    id,
    role: "basecoat",
    paints: [makeComponent()],
    technique_note: null,
    area_note: null,
    ...overrides,
  };
}

// ─── validateRecipeForm ───────────────────────────────────────────────────────

describe("validateRecipeForm", () => {
  it("returns errors when title is blank", () => {
    const result = validateRecipeForm(makeFormData({ title: "" }));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.title).toBeTruthy();
  });

  it("returns errors when title is only whitespace", () => {
    const result = validateRecipeForm(makeFormData({ title: "   " }));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.title).toBeTruthy();
  });

  it("trims the title", () => {
    const result = validateRecipeForm(makeFormData({ title: "  Ultramarines  " }));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data.title).toBe("Ultramarines");
  });

  it("returns errors when title exceeds 200 chars", () => {
    const result = validateRecipeForm(makeFormData({ title: "a".repeat(201) }));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.title).toBeTruthy();
  });

  it("allows a title of exactly 200 chars", () => {
    const result = validateRecipeForm(makeFormData({ title: "a".repeat(200) }));
    expect("data" in result).toBe(true);
  });

  it("maps empty description to null", () => {
    const result = validateRecipeForm(makeFormData({ title: "T", description: "" }));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data.description).toBeNull();
  });

  it("maps empty source_url to null", () => {
    const result = validateRecipeForm(makeFormData({ title: "T", source_url: "  " }));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data.source_url).toBeNull();
  });

  it("defaults visibility to 'private' when absent", () => {
    const result = validateRecipeForm(makeFormData({ title: "T" }));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data.visibility).toBe("private");
  });

  it("accepts 'public' visibility", () => {
    const result = validateRecipeForm(makeFormData({ title: "T", visibility: "public" }));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data.visibility).toBe("public");
  });

  it("rejects an invalid visibility value", () => {
    const result = validateRecipeForm(makeFormData({ title: "T", visibility: "friends" }));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.visibility).toBeTruthy();
  });
});

// ─── parseStepsPayload ────────────────────────────────────────────────────────

describe("parseStepsPayload", () => {
  it("returns error on non-JSON input", () => {
    const result = parseStepsPayload("not-json");
    expect("errors" in result).toBe(true);
  });

  it("returns error when input is not an array", () => {
    const result = parseStepsPayload(JSON.stringify({ role: "basecoat" }));
    expect("errors" in result).toBe(true);
  });

  it("returns error when step role is invalid", () => {
    const step = makeStep("s1", { role: "spray-coat" as never });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("returns error when paints array is empty", () => {
    const step = makeStep("s1", { paints: [] });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors._).toMatch(/at least one paint/i);
  });

  it("returns error when paints field is missing", () => {
    const raw = JSON.stringify([{ id: "s1", role: "basecoat" }]);
    const result = parseStepsPayload(raw);
    expect("errors" in result).toBe(true);
  });

  it("returns error when component has no paint_id and no hex", () => {
    const step = makeStep("s1", {
      paints: [makeComponent({ paint_id: null, hex: null })],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors._).toMatch(/catalog paint or a hex/i);
  });

  it("accepts a hex-only component", () => {
    const step = makeStep("s1", {
      paints: [makeComponent({ paint_id: null, hex: "FF4500" })],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("data" in result).toBe(true);
  });

  it("returns error when hex has wrong format (with #)", () => {
    const step = makeStep("s1", {
      paints: [makeComponent({ paint_id: null, hex: "#FF4500" })],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("returns error when hex is too short", () => {
    const step = makeStep("s1", {
      paints: [makeComponent({ paint_id: null, hex: "FF450" })],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("returns error when ratio is 0", () => {
    const step = makeStep("s1", { paints: [makeComponent({ ratio: 0 })] });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors._).toMatch(/positive integer/i);
  });

  it("returns error when ratio is negative", () => {
    const step = makeStep("s1", { paints: [makeComponent({ ratio: -1 })] });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("returns error when ratio is non-integer (float)", () => {
    const step = makeStep("s1", { paints: [makeComponent({ ratio: 2.5 as never })] });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("returns error when ratio is a non-numeric string", () => {
    const step = makeStep("s1", { paints: [makeComponent({ ratio: "abc" as never })] });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("errors" in result).toBe(true);
  });

  it("defaults ratio to 1 when omitted", () => {
    const raw = JSON.stringify([
      { id: "s1", role: "basecoat", paints: [{ paint_id: "some-paint" }] },
    ]);
    const result = parseStepsPayload(raw);
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data[0].paints[0].ratio).toBe(1);
  });

  it("accepts a multi-component mix", () => {
    const step = makeStep("s1", {
      paints: [makeComponent({ ratio: 2 }), makeComponent({ paint_id: "other-id", ratio: 1 })],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data[0].paints).toHaveLength(2);
      expect(result.data[0].paints[0].ratio).toBe(2);
      expect(result.data[0].paints[1].ratio).toBe(1);
    }
  });

  it("preserves component order", () => {
    const step = makeStep("s1", {
      paints: [
        makeComponent({ paint_id: "first", ratio: 3 }),
        makeComponent({ paint_id: "second", ratio: 1 }),
        makeComponent({ paint_id: null, hex: "AABBCC", ratio: 2 }),
      ],
    });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("data" in result).toBe(true);
    if ("data" in result) {
      const ps = result.data[0].paints;
      expect(ps[0].paint_id).toBe("first");
      expect(ps[1].paint_id).toBe("second");
      expect(ps[2].hex).toBe("AABBCC");
    }
  });

  it("normalises empty technique_note to null", () => {
    const step = makeStep("s1", { technique_note: "" });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data[0].technique_note).toBeNull();
  });

  it("normalises whitespace-only area_note to null", () => {
    const step = makeStep("s1", { area_note: "  " });
    const result = parseStepsPayload(JSON.stringify([step]));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data[0].area_note).toBeNull();
  });

  it("returns data for an empty step array", () => {
    const result = parseStepsPayload(JSON.stringify([]));
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data).toHaveLength(0);
  });

  it("returns error on null input", () => {
    const result = parseStepsPayload(null);
    expect("errors" in result).toBe(true);
  });
});

// ─── planStepSync ─────────────────────────────────────────────────────────────

describe("planStepSync", () => {
  // ── BUG #1 regression: newly-added step must appear in finalOrderIds ─────
  it("includes a newly-added step interspersed between existing steps in finalOrderIds (bug #1 guard)", () => {
    // Server knows A and B. User adds NEW between them: [A, NEW, B].
    // OLD code: finalIds = steps.filter(s => existingIds.has(s.id)) => [A, B] — NEW excluded!
    const serverSteps = [{ id: "A" }, { id: "B" }];
    const localSteps = [makeStep("A"), makeStep("new-temp-uuid"), makeStep("B")];
    const result = planStepSync(serverSteps, localSteps);
    expect(result.finalOrderIds).toEqual(["A", "new-temp-uuid", "B"]);
    expect(result.toRemove).toEqual([]);
  });

  it("marks server steps absent from local as toRemove", () => {
    const serverSteps = [{ id: "A" }, { id: "B" }];
    const localSteps = [makeStep("A")];
    const result = planStepSync(serverSteps, localSteps);
    expect(result.toRemove).toContain("B");
    expect(result.finalOrderIds).toEqual(["A"]);
  });

  it("reorder-only: finalOrderIds reflects the new on-screen order", () => {
    const serverSteps = [{ id: "A" }, { id: "B" }, { id: "C" }];
    const localSteps = [makeStep("C"), makeStep("A"), makeStep("B")];
    const result = planStepSync(serverSteps, localSteps);
    expect(result.finalOrderIds).toEqual(["C", "A", "B"]);
    expect(result.toRemove).toEqual([]);
  });

  it("all new steps: toRemove is empty, finalOrderIds is the full local list", () => {
    const serverSteps: { id: string }[] = [];
    const localSteps = [makeStep("new1"), makeStep("new2")];
    const result = planStepSync(serverSteps, localSteps);
    expect(result.toRemove).toEqual([]);
    expect(result.finalOrderIds).toEqual(["new1", "new2"]);
    expect(result.toUpsert).toHaveLength(2);
  });

  it("empty local steps: all server steps go to toRemove", () => {
    const serverSteps = [{ id: "A" }, { id: "B" }];
    const localSteps: ParsedStep[] = [];
    const result = planStepSync(serverSteps, localSteps);
    expect(result.toRemove).toEqual(["A", "B"]);
    expect(result.finalOrderIds).toEqual([]);
    expect(result.toUpsert).toEqual([]);
  });
});
