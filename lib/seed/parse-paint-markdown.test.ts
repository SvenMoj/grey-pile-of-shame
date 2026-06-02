import { describe, expect, it } from "vitest";
import {
  BRAND_MAP,
  dedupeById,
  hexToRgb,
  parsePaintMarkdown,
  slugify,
} from "./parse-paint-markdown";

// ─── slugify ────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases the string", () => {
    expect(slugify("Mephiston Red")).toBe("mephiston-red");
  });

  it("removes apostrophes (no hyphen gap)", () => {
    expect(slugify("Bugman's Glow")).toBe("bugmans-glow");
    expect(slugify("Emperor's Children")).toBe("emperors-children");
  });

  it("removes dots (no hyphen gap)", () => {
    expect(slugify("Model Air")).toBe("model-air");
    expect(slugify("Num. 41")).toBe("num-41");
    // trailing dot stripped then trimmed
    expect(slugify("Test.")).toBe("test");
  });

  it("collapses runs of non-alphanumeric into a single hyphen", () => {
    expect(slugify("IDF/IAF Green")).toBe("idf-iaf-green");
    expect(slugify("(Metallic)")).toBe("metallic");
    expect(slugify("Game Color  Wash")).toBe("game-color-wash");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify(" Foo ")).toBe("foo");
    expect(slugify("-foo-")).toBe("foo");
  });

  it("handles alphanumeric with numbers", () => {
    expect(slugify("Speedpaint Set 2.0")).toBe("speedpaint-set-20");
    expect(slugify("D&D Nolzur's Marvelous Pigments")).toBe("d-d-nolzurs-marvelous-pigments");
  });
});

// ─── hexToRgb ───────────────────────────────────────────────────────────────

describe("hexToRgb", () => {
  it("converts uppercase 6-char hex to {r,g,b}", () => {
    expect(hexToRgb("FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("A32F26")).toEqual({ r: 163, g: 47, b: 38 });
  });

  it("accepts lowercase hex", () => {
    expect(hexToRgb("a32f26")).toEqual({ r: 163, g: 47, b: 38 });
  });

  it("returns null for empty / null / blank string", () => {
    expect(hexToRgb("")).toBeNull();
    expect(hexToRgb("  ")).toBeNull();
  });
});

// ─── parsePaintMarkdown ─────────────────────────────────────────────────────

/** Minimal 6-column (no Code) markdown — like Citadel_Colour.md */
const CITADEL_MINI = `
# Citadel Colour
![Citadel_Colour](../logos/Citadel_Colour.png "Citadel_Colour")

|Name|Set|R|G|B|Hex|
|---|---|---|---|---|---|
|Abaddon Black|Base|0|0|0|![#000000](https://placehold.co/15x15/000000/000000.png) \`#000000\`|
|'Ardcoat|Technical|249|249|249|![#F9F9F9](https://placehold.co/15x15/F9F9F9/F9F9F9.png) \`#F9F9F9\`|
|Adeptus Battlegrey|Foundation (discontinued)|74|76|88|![#4A4C58](https://placehold.co/15x15/4A4C58/4A4C58.png) \`#4A4C58\`|

<p align="center"><img src="../logos/logo_rnd.png" height="70" /></p>
`.trim();

/** Minimal 7-column (with Code) markdown — like Vallejo.md / Army_Painter.md */
const VALLEJO_MINI = `
# Vallejo
![Vallejo](../logos/Vallejo.png "Vallejo")

|Name|Code|Set|R|G|B|Hex|
|---|---|---|---|---|---|---|
|Dead White|72.001|Game Color|255|255|255|![#FFFFFF](https://placehold.co/15x15/FFFFFF/FFFFFF.png) \`#FFFFFF\`|
|3B Russian Green|71.281|Model Air|71|73|70|![#474946](https://placehold.co/15x15/474946/474946.png) \`#474946\`|
|Null Code Paint|null|Game Color|10|20|30|![#0A141E](https://placehold.co/15x15/0A141E/0A141E.png) \`#0A141E\`|

<p align="center">footer</p>
`.trim();

describe("parsePaintMarkdown", () => {
  const CITADEL_BRAND = { brand: "Citadel", slug: "citadel" };
  const VALLEJO_BRAND = { brand: "Vallejo", slug: "vallejo" };

  it("parses 6-col rows (no Code column)", () => {
    const records = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(records).toHaveLength(3);
  });

  it("parses 7-col rows (with Code column)", () => {
    const records = parsePaintMarkdown(VALLEJO_MINI, VALLEJO_BRAND);
    expect(records).toHaveLength(3);
  });

  it("derives id as {brand-slug}-{set-slug}-{name-slug}", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.id).toBe("citadel-base-abaddon-black");
  });

  it("applies apostrophe-removal in slug for name", () => {
    const records = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    const ardcoat = records.find((r) => r.name === "'Ardcoat");
    expect(ardcoat?.id).toBe("citadel-technical-ardcoat");
  });

  it("sets status='discontinued' and strips suffix from range", () => {
    const records = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    const disc = records.find((r) => r.name === "Adeptus Battlegrey");
    expect(disc?.status).toBe("discontinued");
    expect(disc?.range).toBe("Foundation");
    expect(disc?.id).toBe("citadel-foundation-adeptus-battlegrey");
  });

  it("sets status='active' for non-discontinued rows", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.status).toBe("active");
  });

  it("extracts hex without # from the backtick token", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.hex).toBe("000000");
  });

  it("populates r,g,b from the R/G/B columns", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.r).toBe(0);
    expect(r.g).toBe(0);
    expect(r.b).toBe(0);
  });

  it("extracts sku_code from Code column (7-col)", () => {
    const records = parsePaintMarkdown(VALLEJO_MINI, VALLEJO_BRAND);
    const deadWhite = records.find((r) => r.name === "Dead White");
    expect(deadWhite?.sku_code).toBe("72.001");
  });

  it("sets sku_code=null when Code is the literal 'null'", () => {
    const records = parsePaintMarkdown(VALLEJO_MINI, VALLEJO_BRAND);
    const np = records.find((r) => r.name === "Null Code Paint");
    expect(np?.sku_code).toBeNull();
  });

  it("sets sku_code=null for 6-col brands (no Code column)", () => {
    const records = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(records[0].sku_code).toBeNull();
  });

  it("sets brand from brandInfo", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.brand).toBe("Citadel");
  });

  it("sets type to null (not in markdown)", () => {
    const [r] = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(r.type).toBeNull();
  });

  it("skips rows with an empty name cell", () => {
    // Reproduces a real case in MrHobby.md: ||UG1|Mr Color Gundam Color|241|247|250|...|
    const content = `|Name|Code|Set|R|G|B|Hex|
|---|---|---|---|---|---|---|
||UG1|Mr Color Gundam Color|241|247|250|\`#F1F7FA\`|
|Real Paint|UG2|Mr Color Gundam Color|0|0|0|\`#000000\`|`;
    const records = parsePaintMarkdown(content, { brand: "Mr. Hobby", slug: "mr-hobby" });
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Real Paint");
  });

  it("skips header, separator, image, heading, and footer lines", () => {
    // Ensure no '---' separator row or heading lines bleed into results
    const records = parsePaintMarkdown(CITADEL_MINI, CITADEL_BRAND);
    expect(records.every((r) => r.name !== "Name")).toBe(true);
    expect(records.every((r) => r.name !== "---")).toBe(true);
  });

  it("handles the full Vallejo Model Air row with non-trivial name slug", () => {
    const records = parsePaintMarkdown(VALLEJO_MINI, VALLEJO_BRAND);
    const r = records.find((r) => r.name === "3B Russian Green");
    expect(r?.id).toBe("vallejo-model-air-3b-russian-green");
    expect(r?.r).toBe(71);
    expect(r?.g).toBe(73);
    expect(r?.b).toBe(70);
    expect(r?.sku_code).toBe("71.281");
  });
});

// ─── dedupeById ─────────────────────────────────────────────────────────────

describe("dedupeById", () => {
  it("returns all records when there are no collisions", () => {
    const records = [{ id: "a", name: "A" } as never, { id: "b", name: "B" } as never];
    const { records: out, collisions } = dedupeById(records);
    expect(out).toHaveLength(2);
    expect(collisions).toHaveLength(0);
  });

  it("keeps the first row when ids collide", () => {
    const records = [{ id: "x", name: "First" } as never, { id: "x", name: "Second" } as never];
    const { records: out } = dedupeById(records);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("First");
  });

  it("reports each collision", () => {
    const records = [
      { id: "x", name: "First" } as never,
      { id: "x", name: "Second" } as never,
      { id: "x", name: "Third" } as never,
    ];
    const { collisions } = dedupeById(records);
    expect(collisions).toHaveLength(2);
    expect(collisions[0].droppedName).toBe("Second");
    expect(collisions[1].droppedName).toBe("Third");
    expect(collisions[0].keptId).toBe("x");
  });
});

// ─── BRAND_MAP ──────────────────────────────────────────────────────────────

describe("BRAND_MAP", () => {
  it("has 34 entries", () => {
    expect(Object.keys(BRAND_MAP)).toHaveLength(34);
  });

  it("maps established brands to their stable slugs", () => {
    expect(BRAND_MAP["Citadel_Colour"].slug).toBe("citadel");
    expect(BRAND_MAP["Army_Painter"].slug).toBe("army-painter");
    expect(BRAND_MAP["Vallejo"].slug).toBe("vallejo");
    expect(BRAND_MAP["Foundry"].slug).toBe("wargames-foundry");
    expect(BRAND_MAP["P3"].slug).toBe("privateer-press");
    expect(BRAND_MAP["CoatDArmes"].slug).toBe("coat-darms");
    expect(BRAND_MAP["Monument"].slug).toBe("monument-hobbies");
  });

  it("has brand+slug for every entry", () => {
    for (const [stem, info] of Object.entries(BRAND_MAP)) {
      expect(info.brand, `${stem}.brand`).toBeTruthy();
      expect(info.slug, `${stem}.slug`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
