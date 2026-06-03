import { describe, expect, it } from "vitest";
import { TRANSITIVE_DISCOUNT, deriveTransitiveConversions } from "./derive-conversions";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
//
// Graph:          Hub H (Citadel, hub)
//                /               \
//           AP-1 (Army Painter)  VA-1 (Vallejo)
//                        |
//                     AP-2 (Army Painter)   ← same brand as AP-1, no cross-brand bridge
//
// Plus a chain:  AP-2 → GW-1 (a separate Citadel paint that is NOT a hub above)
//
// Expected transitive bridges (cross-brand only):
//   AP-1 ↔ VA-1  (via H)            conf = 0.9 * 0.9 * DISCOUNT ≈ 0.66
//
// Expected NOT emitted:
//   AP-1 ↔ AP-2  (same brand)
//   AP-2 ↔ VA-1  (no path of length 2 between them — AP-2 only connects to AP-1 and GW-1,
//                  VA-1 only connects to H; the path AP-2→AP-1→H→VA-1 is length 3, not 2)

const PAINTS = [
  { id: "citadel-base-mephiston-red", brand: "Citadel", name: "Mephiston Red" },
  { id: "army-painter-warpaint-angel-green", brand: "Army Painter", name: "Angel Green" },
  { id: "army-painter-warpaint-dragon-red", brand: "Army Painter", name: "Dragon Red" },
  { id: "vallejo-game-colour-gory-red", brand: "Vallejo", name: "Gory Red" },
  { id: "citadel-base-abaddon-black", brand: "Citadel", name: "Abaddon Black" },
];

// Official chart rows (simplified, no id / timestamps / verified_count etc.)
const OFFICIAL = [
  // AP-1 → H  and  H → AP-1  (bidirectional official pair)
  {
    paint_a_id: "army-painter-warpaint-angel-green",
    paint_b_id: "citadel-base-mephiston-red",
    confidence: "0.9",
    source_type: "official_chart",
  },
  {
    paint_a_id: "citadel-base-mephiston-red",
    paint_b_id: "army-painter-warpaint-angel-green",
    confidence: "0.9",
    source_type: "official_chart",
  },
  // VA-1 → H  and  H → VA-1  (bidirectional official pair)
  {
    paint_a_id: "vallejo-game-colour-gory-red",
    paint_b_id: "citadel-base-mephiston-red",
    confidence: "0.9",
    source_type: "official_chart",
  },
  {
    paint_a_id: "citadel-base-mephiston-red",
    paint_b_id: "vallejo-game-colour-gory-red",
    confidence: "0.9",
    source_type: "official_chart",
  },
  // AP-1 → AP-2  (same-brand, should produce no cross-brand bridge)
  {
    paint_a_id: "army-painter-warpaint-angel-green",
    paint_b_id: "army-painter-warpaint-dragon-red",
    confidence: "0.9",
    source_type: "official_chart",
  },
  {
    paint_a_id: "army-painter-warpaint-dragon-red",
    paint_b_id: "army-painter-warpaint-angel-green",
    confidence: "0.9",
    source_type: "official_chart",
  },
  // AP-2 → GW-2 (chain test: AP-2 connects to a second Citadel paint)
  {
    paint_a_id: "army-painter-warpaint-dragon-red",
    paint_b_id: "citadel-base-abaddon-black",
    confidence: "0.9",
    source_type: "official_chart",
  },
  {
    paint_a_id: "citadel-base-abaddon-black",
    paint_b_id: "army-painter-warpaint-dragon-red",
    confidence: "0.9",
    source_type: "official_chart",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findPair(rows: ReturnType<typeof deriveTransitiveConversions>, a: string, b: string) {
  return rows.find((r) => r.paint_a_id === a && r.paint_b_id === b);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deriveTransitiveConversions", () => {
  it("emits cross-brand bridges for co-citation via shared hub", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);

    // AP-1 and VA-1 share hub H → both directions should appear
    expect(
      findPair(rows, "army-painter-warpaint-angel-green", "vallejo-game-colour-gory-red"),
    ).toBeDefined();
    expect(
      findPair(rows, "vallejo-game-colour-gory-red", "army-painter-warpaint-angel-green"),
    ).toBeDefined();
  });

  it("computes confidence correctly (c1 * c2 * DISCOUNT rounded to 2 dp)", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    const bridge = findPair(
      rows,
      "army-painter-warpaint-angel-green",
      "vallejo-game-colour-gory-red",
    );
    const expected = Math.round(0.9 * 0.9 * TRANSITIVE_DISCOUNT * 100) / 100;
    expect(bridge?.confidence).toBe(expected);
  });

  it("sets source_type to 'transitive'", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    for (const r of rows) {
      expect(r.source_type).toBe("transitive");
    }
  });

  it("sets source_url to null", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    for (const r of rows) {
      expect(r.source_url).toBeNull();
    }
  });

  it("includes hub brand + name in the notes", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    const bridge = findPair(
      rows,
      "army-painter-warpaint-angel-green",
      "vallejo-game-colour-gory-red",
    );
    expect(bridge?.notes).toContain("Citadel");
    expect(bridge?.notes).toContain("Mephiston Red");
  });

  it("does NOT emit same-brand bridges", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    // AP-1 and AP-2 are both Army Painter — no bridge should appear
    expect(
      findPair(rows, "army-painter-warpaint-angel-green", "army-painter-warpaint-dragon-red"),
    ).toBeUndefined();
    expect(
      findPair(rows, "army-painter-warpaint-dragon-red", "army-painter-warpaint-angel-green"),
    ).toBeUndefined();
  });

  it("does NOT emit bridges that already exist as official rows", () => {
    // AP-1 → H is already official; it should not be re-emitted as transitive
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    const transitiveOverlap = rows.filter(
      (r) =>
        r.paint_a_id === "army-painter-warpaint-angel-green" &&
        r.paint_b_id === "citadel-base-mephiston-red",
    );
    expect(transitiveOverlap).toHaveLength(0);
  });

  it("does NOT produce self-loops", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS);
    for (const r of rows) {
      expect(r.paint_a_id).not.toBe(r.paint_b_id);
    }
  });

  it("deduplicates: keeps only the highest-confidence bridge for each ordered pair", () => {
    // If two hubs connect the same pair, the best-confidence result wins.
    const twoHubs = [
      ...OFFICIAL,
      // Add a second hub GW-2 that also connects AP-1 and VA-1 (at lower confidence)
      {
        paint_a_id: "army-painter-warpaint-angel-green",
        paint_b_id: "citadel-base-abaddon-black",
        confidence: "0.7",
        source_type: "official_chart",
      },
      {
        paint_a_id: "citadel-base-abaddon-black",
        paint_b_id: "army-painter-warpaint-angel-green",
        confidence: "0.7",
        source_type: "official_chart",
      },
      {
        paint_a_id: "vallejo-game-colour-gory-red",
        paint_b_id: "citadel-base-abaddon-black",
        confidence: "0.7",
        source_type: "official_chart",
      },
      {
        paint_a_id: "citadel-base-abaddon-black",
        paint_b_id: "vallejo-game-colour-gory-red",
        confidence: "0.7",
        source_type: "official_chart",
      },
    ];

    const rows = deriveTransitiveConversions(twoHubs, PAINTS);

    // Only one row per ordered pair
    const ap1ToVa1 = rows.filter(
      (r) =>
        r.paint_a_id === "army-painter-warpaint-angel-green" &&
        r.paint_b_id === "vallejo-game-colour-gory-red",
    );
    expect(ap1ToVa1).toHaveLength(1);

    // Higher confidence (via H at 0.9) wins over lower (via GW-2 at 0.7)
    const highConf = Math.round(0.9 * 0.9 * TRANSITIVE_DISCOUNT * 100) / 100;
    expect(ap1ToVa1[0].confidence).toBe(highConf);
  });

  it("handles empty inputs without throwing", () => {
    expect(deriveTransitiveConversions([], [])).toEqual([]);
    expect(deriveTransitiveConversions(OFFICIAL, [])).toEqual([]);
    expect(deriveTransitiveConversions([], PAINTS)).toEqual([]);
  });

  it("accepts a custom discount via opts", () => {
    const rows = deriveTransitiveConversions(OFFICIAL, PAINTS, { discount: 0.5 });
    const bridge = findPair(
      rows,
      "army-painter-warpaint-angel-green",
      "vallejo-game-colour-gory-red",
    );
    const expected = Math.round(0.9 * 0.9 * 0.5 * 100) / 100;
    expect(bridge?.confidence).toBe(expected);
  });
});
