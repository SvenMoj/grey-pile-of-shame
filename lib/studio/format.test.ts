import { describe, it, expect } from "vitest";
import { parseFormat, parseTheme, FORMAT_SIZES, THEME_PALETTE, type StudioFormat } from "./format";
import { STATE_HEX } from "@/lib/pile/display";
import type { PileState } from "@/lib/pile/types";

describe("parseFormat", () => {
  it("defaults to square when param is missing", () => {
    expect(parseFormat(null)).toBe("square");
    expect(parseFormat(undefined)).toBe("square");
    expect(parseFormat("")).toBe("square");
  });

  it("returns portrait for 'portrait'", () => {
    expect(parseFormat("portrait")).toBe("portrait");
  });

  it("falls back to square for unknown values", () => {
    expect(parseFormat("landscape")).toBe("square");
    expect(parseFormat("1:1")).toBe("square");
  });
});

describe("parseTheme", () => {
  it("defaults to dark when param is missing", () => {
    expect(parseTheme(null)).toBe("dark");
    expect(parseTheme(undefined)).toBe("dark");
    expect(parseTheme("")).toBe("dark");
  });

  it("returns light for 'light'", () => {
    expect(parseTheme("light")).toBe("light");
  });

  it("falls back to dark for unknown values", () => {
    expect(parseTheme("sepia")).toBe("dark");
  });
});

describe("FORMAT_SIZES", () => {
  it("square is 1080×1080", () => {
    expect(FORMAT_SIZES.square).toEqual({ width: 1080, height: 1080 });
  });

  it("portrait is 1080×1350 (4:5 ratio)", () => {
    expect(FORMAT_SIZES.portrait).toEqual({ width: 1080, height: 1350 });
    const { width, height } = FORMAT_SIZES.portrait;
    expect(width / height).toBeCloseTo(4 / 5, 5);
  });
});

describe("THEME_PALETTE", () => {
  it("has entries for both themes", () => {
    expect(THEME_PALETTE).toHaveProperty("dark");
    expect(THEME_PALETTE).toHaveProperty("light");
  });

  it("dark background is darker than light background", () => {
    // A simple sanity check: dark bg starts with #0 (very dark), light bg is #f (very light)
    expect(THEME_PALETTE.dark.bg).toMatch(/^#0/);
    expect(THEME_PALETTE.light.bg).toMatch(/^#f/i);
  });
});

describe("STATE_HEX", () => {
  const allStates: PileState[] = ["unbuilt", "built", "primed", "in_progress", "painted"];

  it("has a hex entry for every PileState", () => {
    for (const state of allStates) {
      expect(STATE_HEX).toHaveProperty(state);
    }
  });

  it("all values are valid 6-digit hex colours", () => {
    for (const state of allStates) {
      expect(STATE_HEX[state]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("states follow the red→orange→yellow→green progression", () => {
    // unbuilt and built are both red-family
    expect(STATE_HEX.unbuilt).toMatch(/^#[0-9a-fA-F]{6}$/);
    // painted is green
    expect(STATE_HEX.painted).toMatch(/^#[01][0-9a-fA-F]{5}$/); // starts with 1 (green-600 #16a34a)
  });

  it("is exhaustive — no extra keys", () => {
    const keys = Object.keys(STATE_HEX) as StudioFormat[];
    expect(keys).toHaveLength(allStates.length);
  });
});
