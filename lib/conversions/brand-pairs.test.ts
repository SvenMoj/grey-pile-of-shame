import { describe, it, expect } from "vitest";
import {
  sortConversions,
  buildFaqItems,
  buildItemListJsonLd,
  buildFaqPageJsonLd,
  buildBreadcrumbJsonLd,
  groupConversionsByBrand,
} from "./brand-pairs";
import type { PublicConversion } from "./brand-pairs";

// Minimal stub rows for testing pure helpers (no DB needed)
const makeRow = (overrides: Partial<PublicConversion> = {}): PublicConversion => ({
  id: "test-uuid",
  confidence: 0.9,
  source_type: "official_chart",
  source_url: null,
  notes: null,
  verified_count: 0,
  disputed_count: 0,
  paint_a: {
    id: "citadel-mephiston-red",
    brand: "Citadel",
    name: "Mephiston Red",
    hex: "7C0A02",
    range: "Base",
  },
  paint_b: {
    id: "vallejo-bloody-red",
    brand: "Vallejo",
    name: "Bloody Red",
    hex: "9C1308",
    range: "Game Color",
  },
  ...overrides,
});

const highConf = makeRow({ confidence: 0.95, verified_count: 10 });
const midConf = makeRow({ id: "b", confidence: 0.8, verified_count: 5 });
const lowConf = makeRow({ id: "c", confidence: 0.7, verified_count: 20 });
const midConfHighVotes = makeRow({ id: "d", confidence: 0.8, verified_count: 15 });

describe("sortConversions", () => {
  it("sorts by confidence descending", () => {
    const sorted = sortConversions([midConf, highConf, lowConf]);
    expect(sorted[0].confidence).toBe(0.95);
    expect(sorted[1].confidence).toBe(0.8);
    expect(sorted[2].confidence).toBe(0.7);
  });

  it("breaks ties by verified_count descending", () => {
    const sorted = sortConversions([midConf, midConfHighVotes]);
    expect(sorted[0].id).toBe("d"); // same confidence, higher votes first
    expect(sorted[1].id).toBe("b");
  });

  it("does not mutate the input array", () => {
    const input = [lowConf, highConf, midConf];
    const original = [...input];
    sortConversions(input);
    expect(input).toEqual(original);
  });

  it("returns empty array for empty input", () => {
    expect(sortConversions([])).toEqual([]);
  });
});

describe("buildFaqItems", () => {
  const rows = [highConf, midConf, lowConf];

  it("returns an array with at least 3 FAQ items", () => {
    const items = buildFaqItems("Citadel", "Vallejo", rows);
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("every item has a non-empty question and answer string", () => {
    const items = buildFaqItems("Citadel", "Vallejo", rows);
    for (const item of items) {
      expect(typeof item.question).toBe("string");
      expect(item.question.length).toBeGreaterThan(0);
      expect(typeof item.answer).toBe("string");
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });

  it("mentions both brand names in the questions", () => {
    const items = buildFaqItems("Citadel", "Vallejo", rows);
    const allText = items.map((i) => i.question + i.answer).join(" ");
    expect(allText).toContain("Citadel");
    expect(allText).toContain("Vallejo");
  });

  it("includes the row count in the content", () => {
    const items = buildFaqItems("Citadel", "Vallejo", rows);
    const allText = items.map((i) => i.question + i.answer).join(" ");
    expect(allText).toContain("3");
  });
});

describe("buildItemListJsonLd", () => {
  it("returns an object with @context and @type of ItemList", () => {
    const ld = buildItemListJsonLd("Citadel", "Vallejo", [highConf], "https://example.com");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("ItemList");
  });

  it("itemListElement length matches the input rows", () => {
    const ld = buildItemListJsonLd(
      "Citadel",
      "Vallejo",
      [highConf, midConf],
      "https://example.com",
    );
    expect(ld.itemListElement).toHaveLength(2);
  });

  it("each element has position, name, and description", () => {
    const ld = buildItemListJsonLd("Citadel", "Vallejo", [highConf], "https://example.com");
    const elem = ld.itemListElement[0];
    expect(elem.position).toBe(1);
    expect(typeof elem.name).toBe("string");
    expect(elem.name.length).toBeGreaterThan(0);
  });

  it("returns empty itemListElement for empty rows", () => {
    const ld = buildItemListJsonLd("Citadel", "Vallejo", [], "https://example.com");
    expect(ld.itemListElement).toHaveLength(0);
  });
});

describe("buildFaqPageJsonLd", () => {
  it("returns an object with @type of FAQPage", () => {
    const items = [{ question: "Q?", answer: "A." }];
    const ld = buildFaqPageJsonLd(items);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
  });

  it("mainEntity length matches FAQ items", () => {
    const items = [
      { question: "Q1?", answer: "A1." },
      { question: "Q2?", answer: "A2." },
    ];
    const ld = buildFaqPageJsonLd(items);
    expect(ld.mainEntity).toHaveLength(2);
  });

  it("each mainEntity item has acceptedAnswer with text", () => {
    const items = [{ question: "What?", answer: "This." }];
    const ld = buildFaqPageJsonLd(items);
    expect(ld.mainEntity[0]["@type"]).toBe("Question");
    expect(ld.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe("This.");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns @type BreadcrumbList", () => {
    const ld = buildBreadcrumbJsonLd([{ name: "Home", url: "https://example.com" }]);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("BreadcrumbList");
  });

  it("itemListElement matches input items", () => {
    const crumbs = [
      { name: "Home", url: "https://example.com" },
      { name: "Convert", url: "https://example.com/convert" },
    ];
    const ld = buildBreadcrumbJsonLd(crumbs);
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[0].item["@id"]).toBe("https://example.com");
    expect(ld.itemListElement[1].item.name).toBe("Convert");
  });
});

describe("groupConversionsByBrand", () => {
  const makeTarget = (
    id: string,
    brand: string,
    name: string,
    confidence: number,
  ): PublicConversion =>
    makeRow({
      id,
      confidence,
      paint_b: { id, brand, name, hex: null, range: null },
    });

  it("returns empty array for empty input", () => {
    expect(groupConversionsByBrand([])).toEqual([]);
  });

  it("groups rows by paint_b.brand", () => {
    const row1 = makeTarget("v-1", "Vallejo", "Bloody Red", 0.9);
    const row2 = makeTarget("ap-1", "Army Painter", "Pure Red", 0.85);
    const row3 = makeTarget("v-2", "Vallejo", "Gory Red", 0.7);

    const groups = groupConversionsByBrand(sortConversions([row1, row2, row3]));
    const brands = groups.map((g) => g.brand);
    expect(brands).toContain("Vallejo");
    expect(brands).toContain("Army Painter");
    expect(groups).toHaveLength(2);

    const vallejo = groups.find((g) => g.brand === "Vallejo")!;
    expect(vallejo.conversions).toHaveLength(2);
  });

  it("orders brands by their best match (highest confidence first)", () => {
    const ap = makeTarget("ap-1", "Army Painter", "Pure Red", 0.95);
    const v1 = makeTarget("v-1", "Vallejo", "Bloody Red", 0.8);
    const v2 = makeTarget("v-2", "Vallejo", "Gory Red", 0.6);

    const groups = groupConversionsByBrand(sortConversions([v1, ap, v2]));
    expect(groups[0].brand).toBe("Army Painter"); // 0.95 > 0.8
    expect(groups[1].brand).toBe("Vallejo");
  });

  it("preserves confidence-sorted order within each brand group", () => {
    const v1 = makeTarget("v-1", "Vallejo", "Bloody Red", 0.9);
    const v2 = makeTarget("v-2", "Vallejo", "Gory Red", 0.6);
    const v3 = makeTarget("v-3", "Vallejo", "Mid Red", 0.75);

    const groups = groupConversionsByBrand(sortConversions([v2, v1, v3]));
    const names = groups[0].conversions.map((c) => c.paint_b.name);
    expect(names).toEqual(["Bloody Red", "Mid Red", "Gory Red"]);
  });

  it("does not mutate the input array", () => {
    const row1 = makeTarget("v-1", "Vallejo", "Bloody Red", 0.9);
    const row2 = makeTarget("ap-1", "Army Painter", "Pure Red", 0.85);
    const input = [row1, row2];
    const copy = [...input];
    groupConversionsByBrand(input);
    expect(input).toEqual(copy);
  });
});
