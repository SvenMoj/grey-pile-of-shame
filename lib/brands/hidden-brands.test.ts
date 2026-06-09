import { describe, expect, it } from "vitest";
import { normalizeHiddenBrands } from "./hidden-brands";

const KNOWN = ["Citadel", "Vallejo", "Army Painter", "Scale75", "Reaper"];

describe("normalizeHiddenBrands", () => {
  it("returns empty array when no brands submitted", () => {
    expect(normalizeHiddenBrands([], KNOWN)).toEqual([]);
  });

  it("returns empty array when submitted brands are unknown", () => {
    expect(normalizeHiddenBrands(["FakeBrand", "NonExistent"], KNOWN)).toEqual([]);
  });

  it("keeps brands that exist in the known list", () => {
    expect(normalizeHiddenBrands(["Citadel", "Vallejo"], KNOWN)).toEqual(["Citadel", "Vallejo"]);
  });

  it("drops unknown brands while keeping valid ones", () => {
    expect(normalizeHiddenBrands(["Citadel", "FakeBrand", "Vallejo"], KNOWN)).toEqual([
      "Citadel",
      "Vallejo",
    ]);
  });

  it("deduplicates repeated brands", () => {
    expect(normalizeHiddenBrands(["Citadel", "Citadel", "Vallejo"], KNOWN)).toEqual([
      "Citadel",
      "Vallejo",
    ]);
  });

  it("returns a stable sort (alphabetical)", () => {
    expect(normalizeHiddenBrands(["Vallejo", "Citadel", "Reaper"], KNOWN)).toEqual([
      "Citadel",
      "Reaper",
      "Vallejo",
    ]);
  });

  it("handles hiding all known brands", () => {
    expect(normalizeHiddenBrands(KNOWN, KNOWN)).toEqual([...KNOWN].sort());
  });

  it("returns empty array when known list is empty", () => {
    expect(normalizeHiddenBrands(["Citadel"], [])).toEqual([]);
  });
});
