import { describe, it, expect } from "vitest";
import { listRowClass, rowCardClass } from "./list-row";

describe("listRowClass", () => {
  it("selected: contains border-primary and ring-primary", () => {
    const cls = listRowClass(true);
    expect(cls).toContain("border-primary");
    expect(cls).toContain("ring-primary");
  });

  it("selected: does NOT have bg-primary text-primary-foreground full-fill (old style)", () => {
    const cls = listRowClass(true);
    // The old selected style used a full primary fill — now it uses a subtle tint
    expect(cls).not.toMatch(/\bbg-primary\b(?!\s*\/)/);
    expect(cls).not.toContain("text-primary-foreground");
  });

  it("default: has a visible border (not border-transparent)", () => {
    const cls = listRowClass(false);
    expect(cls).not.toContain("border-transparent");
    expect(cls).toContain("border-border");
  });
});

describe("rowCardClass", () => {
  it("returns a string with rounded-lg and border", () => {
    const cls = rowCardClass();
    expect(typeof cls).toBe("string");
    expect(cls).toContain("rounded-lg");
    expect(cls).toContain("border");
  });

  it("includes bg-muted/40 for the card fill", () => {
    const cls = rowCardClass();
    expect(cls).toContain("bg-muted/40");
  });
});
