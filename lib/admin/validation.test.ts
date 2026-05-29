import { describe, expect, it } from "vitest";
import { parseConversionForm, parsePaintForm } from "./validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fd(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}

function validPaintFields(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    id: "citadel-mephiston-red",
    brand: "Citadel",
    name: "Mephiston Red",
    hex: "9B0A23",
    lab_l: "30.1",
    lab_a: "45.2",
    lab_b: "20.3",
    size_ml: "12",
    status: "active",
    version: "1",
    ...overrides,
  };
}

function validConversionFields(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    paint_a_id: "citadel-mephiston-red",
    paint_b_id: "vallejo-bloody-red",
    confidence: "0.9",
    source_type: "official_chart",
    source_url: "https://example.com",
    notes: "A note",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parsePaintForm
// ---------------------------------------------------------------------------

describe("parsePaintForm", () => {
  describe("required-field errors", () => {
    it("errors when id is missing", () => {
      const result = parsePaintForm(fd(validPaintFields({ id: "" })));
      expect(result).toMatchObject({ errors: { id: expect.any(String) } });
    });

    it("errors when brand is missing", () => {
      const result = parsePaintForm(fd(validPaintFields({ brand: "" })));
      expect(result).toMatchObject({ errors: { brand: expect.any(String) } });
    });

    it("errors when name is missing", () => {
      const result = parsePaintForm(fd(validPaintFields({ name: "" })));
      expect(result).toMatchObject({ errors: { name: expect.any(String) } });
    });
  });

  describe("id slug validation", () => {
    it("accepts lowercase letters, numbers, and hyphens", () => {
      const result = parsePaintForm(fd(validPaintFields({ id: "abc-123" })));
      expect(result).toMatchObject({ data: { id: "abc-123" } });
    });

    it("normalizes uppercase id to lowercase (does not error)", () => {
      // toLowerCase() runs before the regex, so "Citadel-Red" → "citadel-red" → valid
      const result = parsePaintForm(fd(validPaintFields({ id: "Citadel-Red" })));
      expect(result).toMatchObject({ data: { id: "citadel-red" } });
    });

    it("errors when id contains spaces (cannot be normalized away)", () => {
      const result = parsePaintForm(fd(validPaintFields({ id: "my paint" })));
      expect(result).toMatchObject({ errors: { id: expect.any(String) } });
    });

    it("lowercases the id from the raw input", () => {
      const result = parsePaintForm(fd(validPaintFields({ id: "ABC-123" })));
      expect("data" in result && result.data.id).toBe("abc-123");
    });
  });

  describe("hex normalization and validation", () => {
    it("strips a leading # and uppercases", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "#aabbcc" })));
      expect(result).toMatchObject({ data: { hex: "AABBCC" } });
    });

    it("uppercases a lowercase hex without #", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "ff0080" })));
      expect(result).toMatchObject({ data: { hex: "FF0080" } });
    });

    it("errors on a hex that is too short", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "abc" })));
      expect(result).toMatchObject({ errors: { hex: expect.any(String) } });
    });

    it("errors on a hex that is too long", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "aabbccdd" })));
      expect(result).toMatchObject({ errors: { hex: expect.any(String) } });
    });

    it("errors on a hex with invalid characters", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "GGHHII" })));
      expect(result).toMatchObject({ errors: { hex: expect.any(String) } });
    });

    it("maps an empty hex to null", () => {
      const result = parsePaintForm(fd(validPaintFields({ hex: "" })));
      expect("data" in result && result.data.hex).toBeNull();
    });
  });

  describe("numeric LAB fields", () => {
    it("errors when lab_l is not a number", () => {
      const result = parsePaintForm(fd(validPaintFields({ lab_l: "notanumber" })));
      expect(result).toMatchObject({ errors: { lab_l: expect.any(String) } });
    });

    it("errors when lab_a is not a number", () => {
      const result = parsePaintForm(fd(validPaintFields({ lab_a: "xyz" })));
      expect(result).toMatchObject({ errors: { lab_a: expect.any(String) } });
    });

    it("errors when lab_b is not a number", () => {
      const result = parsePaintForm(fd(validPaintFields({ lab_b: "!" })));
      expect(result).toMatchObject({ errors: { lab_b: expect.any(String) } });
    });

    it("parses valid float LAB values", () => {
      const result = parsePaintForm(
        fd(validPaintFields({ lab_l: "-10.5", lab_a: "0", lab_b: "99.9" })),
      );
      expect(result).toMatchObject({ data: { lab_l: -10.5, lab_a: 0, lab_b: 99.9 } });
    });

    it("maps empty LAB fields to null", () => {
      const result = parsePaintForm(fd(validPaintFields({ lab_l: "", lab_a: "", lab_b: "" })));
      expect("data" in result && result.data).toMatchObject({
        lab_l: null,
        lab_a: null,
        lab_b: null,
      });
    });
  });

  describe("size_ml", () => {
    it("errors when size_ml is not an integer", () => {
      const result = parsePaintForm(fd(validPaintFields({ size_ml: "twelve" })));
      expect(result).toMatchObject({ errors: { size_ml: expect.any(String) } });
    });

    it("parses a valid integer", () => {
      const result = parsePaintForm(fd(validPaintFields({ size_ml: "17" })));
      expect(result).toMatchObject({ data: { size_ml: 17 } });
    });

    it("maps empty size_ml to null", () => {
      const result = parsePaintForm(fd(validPaintFields({ size_ml: "" })));
      expect("data" in result && result.data.size_ml).toBeNull();
    });
  });

  describe("defaults and optional fields", () => {
    it("defaults status to 'active' when omitted", () => {
      const result = parsePaintForm(fd(validPaintFields({ status: "" })));
      expect("data" in result && result.data.status).toBe("active");
    });

    it("defaults version to 1 when omitted", () => {
      const result = parsePaintForm(fd(validPaintFields({ version: "" })));
      expect("data" in result && result.data.version).toBe(1);
    });

    it("maps empty optional strings to null", () => {
      const result = parsePaintForm(
        fd(validPaintFields({ range: "", sku_code: "", type: "", discontinued_date: "" })),
      );
      expect("data" in result && result.data).toMatchObject({
        range: null,
        sku_code: null,
        type: null,
        discontinued_date: null,
      });
    });
  });

  describe("happy path", () => {
    it("returns data on a fully valid form", () => {
      const result = parsePaintForm(fd(validPaintFields()));
      expect(result).toMatchObject({
        data: {
          id: "citadel-mephiston-red",
          brand: "Citadel",
          name: "Mephiston Red",
          hex: "9B0A23",
          lab_l: 30.1,
          lab_a: 45.2,
          lab_b: 20.3,
          size_ml: 12,
          status: "active",
          version: 1,
        },
      });
    });
  });
});

// ---------------------------------------------------------------------------
// parseConversionForm
// ---------------------------------------------------------------------------

describe("parseConversionForm", () => {
  describe("required-field errors", () => {
    it("errors when paint_a_id is missing", () => {
      const result = parseConversionForm(fd(validConversionFields({ paint_a_id: "" })));
      expect(result).toMatchObject({ errors: { paint_a_id: expect.any(String) } });
    });

    it("errors when paint_b_id is missing", () => {
      const result = parseConversionForm(fd(validConversionFields({ paint_b_id: "" })));
      expect(result).toMatchObject({ errors: { paint_b_id: expect.any(String) } });
    });

    it("errors when paint_a_id and paint_b_id are the same", () => {
      const result = parseConversionForm(
        fd(validConversionFields({ paint_a_id: "same-paint", paint_b_id: "same-paint" })),
      );
      expect(result).toMatchObject({ errors: { paint_b_id: expect.any(String) } });
    });
  });

  describe("confidence validation", () => {
    it("errors when confidence is empty", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "" })));
      expect(result).toMatchObject({ errors: { confidence: expect.any(String) } });
    });

    it("errors when confidence is not a number", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "high" })));
      expect(result).toMatchObject({ errors: { confidence: expect.any(String) } });
    });

    it("errors when confidence is below 0", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "-0.1" })));
      expect(result).toMatchObject({ errors: { confidence: expect.any(String) } });
    });

    it("errors when confidence is above 1", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "1.1" })));
      expect(result).toMatchObject({ errors: { confidence: expect.any(String) } });
    });

    it("accepts confidence at the lower boundary (0)", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "0" })));
      expect("data" in result && result.data.confidence).toBe(0);
    });

    it("accepts confidence at the upper boundary (1)", () => {
      const result = parseConversionForm(fd(validConversionFields({ confidence: "1" })));
      expect("data" in result && result.data.confidence).toBe(1);
    });
  });

  describe("source_type validation", () => {
    it("errors when source_type is missing", () => {
      const result = parseConversionForm(fd(validConversionFields({ source_type: "" })));
      expect(result).toMatchObject({ errors: { source_type: expect.any(String) } });
    });

    it("errors when source_type is an unknown value", () => {
      const result = parseConversionForm(fd(validConversionFields({ source_type: "gut_feeling" })));
      expect(result).toMatchObject({ errors: { source_type: expect.any(String) } });
    });

    it.each(["official_chart", "community", "hex_derived"] as const)(
      "accepts valid source_type '%s'",
      (source_type) => {
        const result = parseConversionForm(fd(validConversionFields({ source_type })));
        expect("data" in result && result.data.source_type).toBe(source_type);
      },
    );
  });

  describe("optional fields", () => {
    it("maps empty source_url to null", () => {
      const result = parseConversionForm(fd(validConversionFields({ source_url: "" })));
      expect("data" in result && result.data.source_url).toBeNull();
    });

    it("maps empty notes to null", () => {
      const result = parseConversionForm(fd(validConversionFields({ notes: "" })));
      expect("data" in result && result.data.notes).toBeNull();
    });
  });

  describe("happy path", () => {
    it("returns data on a fully valid form", () => {
      const result = parseConversionForm(fd(validConversionFields()));
      expect(result).toMatchObject({
        data: {
          paint_a_id: "citadel-mephiston-red",
          paint_b_id: "vallejo-bloody-red",
          confidence: 0.9,
          source_type: "official_chart",
          source_url: "https://example.com",
          notes: "A note",
        },
      });
    });
  });
});
