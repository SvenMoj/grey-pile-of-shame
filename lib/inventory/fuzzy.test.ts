import { describe, it, expect } from "vitest";
import { normalize, trigramSimilarity, fuzzyFilter } from "./fuzzy";

describe("normalize", () => {
  it("lowercases", () => {
    expect(normalize("CITADEL")).toBe("citadel");
  });

  it("trims surrounding whitespace", () => {
    expect(normalize("  red  ")).toBe("red");
  });

  it("collapses internal whitespace", () => {
    expect(normalize("mephiston  red")).toBe("mephiston red");
  });

  it("strips diacritics", () => {
    // é → e, ü → u, etc.
    expect(normalize("Vallejo")).toBe("vallejo");
    expect(normalize("café")).toBe("cafe");
  });
});

describe("trigramSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(trigramSimilarity("mephiston", "mephiston")).toBe(1);
  });

  it("returns 0 for completely unrelated strings", () => {
    // "abc" and "xyz" share no trigrams
    expect(trigramSimilarity("abc", "xyz")).toBe(0);
  });

  it("returns a value between 0 and 1 for partial matches", () => {
    const score = trigramSimilarity("mephistn", "mephiston");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("scores typo higher than random string", () => {
    const typoScore = trigramSimilarity("mephistn", "mephiston");
    const randomScore = trigramSimilarity("zzzzz", "mephiston");
    expect(typoScore).toBeGreaterThan(randomScore);
  });

  it("is commutative", () => {
    expect(trigramSimilarity("red", "mephiston red")).toBeCloseTo(
      trigramSimilarity("mephiston red", "red"),
      5,
    );
  });
});

describe("fuzzyFilter", () => {
  type Paint = { name: string; brand: string };
  const paints: Paint[] = [
    { name: "Mephiston Red", brand: "Citadel" },
    { name: "Blood Red", brand: "Vallejo" },
    { name: "Abaddon Black", brand: "Citadel" },
    { name: "Nuln Oil", brand: "Citadel" },
  ];
  const getText = (p: Paint) => [p.name, p.brand];

  it("returns all items for an empty query", () => {
    expect(fuzzyFilter("", paints, getText)).toEqual(paints);
  });

  it("returns all items for a whitespace-only query", () => {
    expect(fuzzyFilter("   ", paints, getText)).toEqual(paints);
  });

  it("matches despite wrong casing (CITADEL → citadel items)", () => {
    const result = fuzzyFilter("CITADEL", paints, getText);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((p) => expect(p.brand).toBe("Citadel"));
  });

  it("matches a typo close to an existing name", () => {
    // "mephistn" is a one-char deletion from "Mephiston"
    const result = fuzzyFilter("mephistn", paints, getText);
    expect(result.some((p) => p.name === "Mephiston Red")).toBe(true);
  });

  it("matches a transposition typo (valljeo → Vallejo)", () => {
    const result = fuzzyFilter("valljeo", paints, getText);
    expect(result.some((p) => p.brand === "Vallejo")).toBe(true);
  });

  it("excludes items below threshold for unrelated query", () => {
    const result = fuzzyFilter("zzzzz", paints, getText);
    expect(result).toHaveLength(0);
  });

  it("ranks closer match first", () => {
    // "nuln" is a substring of "Nuln Oil" — closer than a typo match for another
    const result = fuzzyFilter("nuln", paints, getText);
    expect(result[0].name).toBe("Nuln Oil");
  });

  it("short query (< 3 chars) falls back to substring match", () => {
    // "bl" should match "Abaddon Black" and "Blood Red" (both contain "bl" case-insensitively)
    const result = fuzzyFilter("bl", paints, getText);
    const names = result.map((p) => p.name);
    expect(names).toContain("Abaddon Black");
    expect(names).toContain("Blood Red");
  });

  it("works with a custom threshold", () => {
    // At threshold=0.9 even the typo should be excluded
    const strict = fuzzyFilter("mephistn", paints, getText, 0.9);
    expect(strict).toHaveLength(0);
  });
});
