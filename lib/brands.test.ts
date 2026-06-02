import { describe, it, expect } from "vitest";
import { slugifyBrand, resolveBrandSlug } from "./brands";

// All 10 real brand names from paints.csv
const REAL_BRANDS = [
  "Vallejo",
  "Reaper",
  "Army Painter",
  "Citadel",
  "Wargames Foundry",
  "Coat d'Arms",
  "Scale75",
  "Two Thin Coats",
  "Privateer Press",
  "Monument Hobbies",
];

describe("slugifyBrand", () => {
  it("lowercases simple single-word brands", () => {
    expect(slugifyBrand("Vallejo")).toBe("vallejo");
    expect(slugifyBrand("Reaper")).toBe("reaper");
    expect(slugifyBrand("Citadel")).toBe("citadel");
    expect(slugifyBrand("Scale75")).toBe("scale75");
  });

  it("converts spaces to hyphens", () => {
    expect(slugifyBrand("Army Painter")).toBe("army-painter");
    expect(slugifyBrand("Two Thin Coats")).toBe("two-thin-coats");
    expect(slugifyBrand("Wargames Foundry")).toBe("wargames-foundry");
    expect(slugifyBrand("Privateer Press")).toBe("privateer-press");
    expect(slugifyBrand("Monument Hobbies")).toBe("monument-hobbies");
  });

  it("converts apostrophes and other non-alphanumeric characters to hyphens", () => {
    // "Coat d'Arms" — the apostrophe should become a hyphen, then collapse
    expect(slugifyBrand("Coat d'Arms")).toBe("coat-d-arms");
  });

  it("collapses multiple consecutive hyphens to one", () => {
    expect(slugifyBrand("foo  bar")).toBe("foo-bar");
    expect(slugifyBrand("a--b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyBrand("'Arms")).toBe("arms");
    expect(slugifyBrand("Arms'")).toBe("arms");
  });

  it("all 10 real brand slugs are unique (no collisions)", () => {
    const slugs = REAL_BRANDS.map(slugifyBrand);
    const unique = new Set(slugs);
    expect(unique.size).toBe(REAL_BRANDS.length);
  });

  it("all 10 real brand slugs match expected values", () => {
    const expected: Record<string, string> = {
      Vallejo: "vallejo",
      Reaper: "reaper",
      "Army Painter": "army-painter",
      Citadel: "citadel",
      "Wargames Foundry": "wargames-foundry",
      "Coat d'Arms": "coat-d-arms",
      Scale75: "scale75",
      "Two Thin Coats": "two-thin-coats",
      "Privateer Press": "privateer-press",
      "Monument Hobbies": "monument-hobbies",
    };
    for (const brand of REAL_BRANDS) {
      expect(slugifyBrand(brand), `slug for "${brand}"`).toBe(expected[brand]);
    }
  });
});

describe("resolveBrandSlug (static overload)", () => {
  it("resolves a known slug against a given brand list", () => {
    const result = resolveBrandSlug("citadel", REAL_BRANDS);
    expect(result).toBe("Citadel");
  });

  it("resolves the apostrophe brand slug", () => {
    expect(resolveBrandSlug("coat-d-arms", REAL_BRANDS)).toBe("Coat d'Arms");
  });

  it("resolves Scale75 (no space)", () => {
    expect(resolveBrandSlug("scale75", REAL_BRANDS)).toBe("Scale75");
  });

  it("returns null for an unknown slug", () => {
    expect(resolveBrandSlug("unknown-brand", REAL_BRANDS)).toBeNull();
  });

  it("round-trips all 10 real brands (slugify then resolve)", () => {
    for (const brand of REAL_BRANDS) {
      const slug = slugifyBrand(brand);
      const resolved = resolveBrandSlug(slug, REAL_BRANDS);
      expect(resolved, `round-trip for "${brand}"`).toBe(brand);
    }
  });
});
