/**
 * Derive transitive conversion rows from an existing set of official conversions.
 *
 * Algorithm (depth-2 undirected bridging):
 *   For every paint M that appears as an endpoint in the official graph, collect
 *   all its neighbours (undirected).  Any two neighbours A and B from *different*
 *   brands are linked as a transitive pair, bridged via M.
 *
 *   This covers both "shared hub" co-citation (A→M + B→M ⇒ A↔B) and simple
 *   chaining (A→M→B ⇒ A→B) because the undirected view treats both shapes
 *   identically.
 *
 * Confidence formula:  c(A-M) × c(M-B) × DISCOUNT, rounded to 2 decimal places.
 * TRANSITIVE_DISCOUNT defaults to 0.9, so two 0.9-confidence hops yield ≈ 0.66 —
 * always strictly below the source official value of 0.9.
 *
 * Output rows are emitted in both directions (A→B and B→A).  Existing official
 * pairs are excluded.  For each ordered pair the highest-confidence bridge wins.
 */

export const TRANSITIVE_DISCOUNT = 0.9;

// ---------------------------------------------------------------------------
// Types (minimal — accept the CSV row shape used in the build pipeline)
// ---------------------------------------------------------------------------

export type OfficialRow = {
  paint_a_id: string;
  paint_b_id: string;
  /** Numeric or string — both forms accepted (CSV ships strings). */
  confidence: string | number;
  source_type: string;
  source_url?: string | null;
  notes?: string | null;
};

export type PaintMinimal = {
  id: string;
  brand: string;
  name: string;
};

export type DerivedRow = {
  paint_a_id: string;
  paint_b_id: string;
  confidence: number;
  source_type: "transitive";
  source_url: null;
  notes: string;
};

export type DeriveOpts = {
  /** Multiplier applied on top of the two-hop confidence product. Default: TRANSITIVE_DISCOUNT. */
  discount?: number;
};

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Round a float to at most 2 decimal places.
 * (Avoids floating-point drift like 0.72900000001.)
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Derive transitive conversion rows from `official` conversion rows.
 *
 * @param official - Rows from the official_chart CSV / DB subset.
 * @param paints   - All paint rows needed to resolve brand + name.
 * @param opts     - Optional { discount } override.
 * @returns        - Derived transitive rows, deduplicated, official pairs excluded.
 */
export function deriveTransitiveConversions(
  official: OfficialRow[],
  paints: PaintMinimal[],
  opts?: DeriveOpts,
): DerivedRow[] {
  if (official.length === 0 || paints.length === 0) return [];

  const discount = opts?.discount ?? TRANSITIVE_DISCOUNT;

  // Build paint lookup: id → { brand, name }
  const paintById = new Map<string, PaintMinimal>();
  for (const p of paints) paintById.set(p.id, p);

  // Build set of existing official pairs for exclusion check
  const officialPairs = new Set<string>();
  for (const row of official) {
    officialPairs.add(`${row.paint_a_id}|${row.paint_b_id}`);
  }

  // Build undirected adjacency: hub paint id → [{neighbor id, edge confidence}]
  // One official edge A→B contributes both A→B and B→A in the undirected view.
  type Edge = { id: string; conf: number };
  const adj = new Map<string, Edge[]>();

  const addEdge = (hub: string, neighbor: string, conf: number) => {
    let list = adj.get(hub);
    if (!list) {
      list = [];
      adj.set(hub, list);
    }
    list.push({ id: neighbor, conf });
  };

  for (const row of official) {
    const conf = typeof row.confidence === "string" ? parseFloat(row.confidence) : row.confidence;
    if (isNaN(conf)) continue;
    addEdge(row.paint_a_id, row.paint_b_id, conf);
    addEdge(row.paint_b_id, row.paint_a_id, conf);
  }

  // For each hub M, enumerate cross-brand pairs (A, B) among M's neighbours.
  // Collect best confidence per ordered pair in a Map.
  const best = new Map<string, DerivedRow>();

  for (const [hubId, neighbors] of adj) {
    const hub = paintById.get(hubId);
    if (!hub) continue;
    // Skip hubs with fewer than 2 neighbours — can't form a pair
    if (neighbors.length < 2) continue;

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = 0; j < neighbors.length; j++) {
        if (i === j) continue;

        const edgeA = neighbors[i]; // A – M edge
        const edgeB = neighbors[j]; // M – B edge

        if (edgeA.id === edgeB.id) continue; // self-loop guard

        const paintA = paintById.get(edgeA.id);
        const paintB = paintById.get(edgeB.id);
        if (!paintA || !paintB) continue;
        if (paintA.brand === paintB.brand) continue; // same-brand bridge

        const pairKey = `${edgeA.id}|${edgeB.id}`;

        // Skip if this pair already has an official conversion
        if (officialPairs.has(pairKey)) continue;

        const conf = round2(edgeA.conf * edgeB.conf * discount);
        const notes = `Bridged via ${hub.brand} ${hub.name} — both brands list it as a match.`;

        const existing = best.get(pairKey);
        if (!existing || conf > existing.confidence) {
          best.set(pairKey, {
            paint_a_id: edgeA.id,
            paint_b_id: edgeB.id,
            confidence: conf,
            source_type: "transitive",
            source_url: null,
            notes,
          });
        }
      }
    }
  }

  return [...best.values()];
}
