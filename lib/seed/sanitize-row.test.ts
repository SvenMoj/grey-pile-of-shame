import { describe, expect, it } from "vitest";
import { sanitizeRow } from "./sanitize-row";

describe("sanitizeRow", () => {
  it("converts empty strings to null", () => {
    const result = sanitizeRow({ name: "", sku: "" });
    expect(result).toEqual({ name: null, sku: null });
  });

  it("passes through non-empty string values unchanged", () => {
    const result = sanitizeRow({ brand: "Citadel", name: "Mephiston Red" });
    expect(result).toEqual({ brand: "Citadel", name: "Mephiston Red" });
  });

  it("parses integer keys as integers", () => {
    const result = sanitizeRow({ size_ml: "12" }, [], ["size_ml"]);
    expect(result).toEqual({ size_ml: 12 });
    expect(typeof result.size_ml).toBe("number");
  });

  it("parses numeric keys as floats", () => {
    const result = sanitizeRow({ lab_l: "30.15" }, ["lab_l"]);
    expect(result).toEqual({ lab_l: 30.15 });
    expect(typeof result.lab_l).toBe("number");
  });

  it("handles negative floats", () => {
    const result = sanitizeRow({ lab_a: "-12.5" }, ["lab_a"]);
    expect(result).toEqual({ lab_a: -12.5 });
  });

  it("defaults both numericKeys and integerKeys to empty arrays", () => {
    // Should work with only the first arg
    const result = sanitizeRow({ x: "1", y: "" });
    expect(result).toEqual({ x: "1", y: null });
  });

  it("treats a key in integerKeys before numericKeys (branch order: integers win)", () => {
    // If a key appears in both lists, the integerKeys check runs first
    // and truncates the decimal — pin this behaviour.
    const result = sanitizeRow({ val: "3.7" }, ["val"], ["val"]);
    expect(result).toEqual({ val: 3 }); // parseInt wins
  });

  it("handles a mixed row with multiple transform types", () => {
    const row = {
      id: "citadel-red",
      lab_l: "30.1",
      lab_a: "-5.2",
      lab_b: "0",
      size_ml: "12",
      range: "",
    };
    const result = sanitizeRow(row, ["lab_l", "lab_a", "lab_b"], ["size_ml"]);
    expect(result).toEqual({
      id: "citadel-red",
      lab_l: 30.1,
      lab_a: -5.2,
      lab_b: 0,
      size_ml: 12,
      range: null,
    });
  });

  it("preserves keys not in either transform list as strings", () => {
    const result = sanitizeRow({ status: "active" }, ["lab_l"], ["size_ml"]);
    expect(result.status).toBe("active");
  });
});
