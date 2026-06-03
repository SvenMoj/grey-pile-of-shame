/**
 * Build data/paints.csv and data/conversions.csv from the markdown source files.
 *
 * Sources of truth:
 *   data/paints/*.md       — 34 brand files, new catalog base
 *   current production DB  — supplies retention set (Two Thin Coats, Masterclass,
 *                            official-conversion endpoints absent from markdown)
 *   data/conversions.csv   — only official_chart rows are kept
 *
 * Output:
 *   data/paints.csv        — ~11 600 paints, now with r,g,b columns
 *   data/conversions.csv   — 704 official_chart rows (both endpoints present)
 *
 * This script is READ-ONLY regarding the database. Run rebuild-catalog-prod.ts
 * afterwards to apply the CSV changes to production.
 *
 * Usage:
 *   npx tsx scripts/build-catalog-from-markdown.ts
 */

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { config } from "dotenv";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, extname, resolve } from "path";
import ws from "ws";
import {
  BRAND_MAP as BM,
  dedupeById as DD,
  hexToRgb as H2R,
  parsePaintMarkdown as PPM,
  type PaintRecord as PR,
} from "../lib/seed/parse-paint-markdown";
import { deriveTransitiveConversions, type OfficialRow } from "../lib/seed/derive-conversions";
import type { Database } from "../lib/supabase/database.types";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as WebSocketLikeConstructor },
});

const DATA_DIR = resolve(process.cwd(), "data");

/** Minimal RFC-4180 CSV serialiser (no external dep required). */
function toCsvString(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n") + "\n";
}

async function paginate<T>(table: "paints" | "conversions", select: string): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

type ProdPaint = {
  id: string;
  brand: string;
  range: string;
  name: string;
  sku_code: string | null;
  hex: string | null;
  status: string;
  type: string | null;
};

async function main(): Promise<void> {
  // ── Step 1: Parse all markdown files ────────────────────────────────────
  console.log("Parsing markdown files in data/paints/ …");
  const mdDir = resolve(DATA_DIR, "paints");
  const mdFiles = readdirSync(mdDir)
    .filter((f) => extname(f) === ".md")
    .map((f) => resolve(mdDir, f))
    .sort();
  console.log(`  Found ${mdFiles.length} files`);

  let allMdRecords: PR[] = [];
  for (const file of mdFiles.sort()) {
    const stem = basename(file, ".md");
    const brandInfo = BM[stem];
    if (!brandInfo) {
      console.warn(`  [WARN] No BRAND_MAP entry for "${stem}" — skipping`);
      continue;
    }
    const content = readFileSync(file, "utf-8");
    const records = PPM(content, brandInfo);
    allMdRecords = allMdRecords.concat(records);
  }
  console.log(`  ${allMdRecords.length} total rows parsed`);

  const { records: mdPaints, collisions } = DD(allMdRecords);
  console.log(
    `  After dedup: ${mdPaints.length} unique IDs (${collisions.length} collisions dropped)`,
  );
  if (collisions.length > 0) {
    console.log("  Collision log:");
    for (const c of collisions) {
      console.log(
        `    [${c.droppedBrand}] "${c.droppedName}" → kept first occurrence of id="${c.keptId}"`,
      );
    }
  }

  const mdIds = new Set(mdPaints.map((p) => p.id));

  // ── Step 2: Load production catalog (from backup file or live DB) ─────────
  // If the DB was mid-rebuilt we need the original pre-wipe catalog to correctly
  // determine the retention set. Pass --backup <path> to use a JSON backup file.
  const backupFlag = process.argv.indexOf("--backup");
  const backupPath = backupFlag !== -1 ? process.argv[backupFlag + 1] : null;

  let prodPaints: ProdPaint[];
  if (backupPath) {
    console.log(`\nLoading production paints from backup file: ${backupPath} …`);
    prodPaints = JSON.parse(readFileSync(backupPath, "utf-8")) as ProdPaint[];
    console.log(`  ${prodPaints.length} paints loaded from backup`);
  } else {
    console.log("\nFetching current production paints from DB …");
    prodPaints = await paginate<ProdPaint>(
      "paints",
      "id,brand,range,name,sku_code,hex,status,type",
    );
    console.log(`  ${prodPaints.length} paints in production`);
    if (prodPaints.length < 2000) {
      console.warn(
        "  [WARN] Fewer than 2000 paints in production — the DB may be mid-rebuild.\n" +
          "         Re-run with --backup data/backups/paints-<timestamp>.json for correct results.",
      );
    }
  }

  const prodById = new Map<string, ProdPaint>();
  for (const p of prodPaints) prodById.set(p.id, p);

  // ── Step 3: Fetch official conversions ───────────────────────────────────
  // Prefer the backup JSON if passed (in case conversions.csv was already filtered).
  const backupConvFlag = process.argv.indexOf("--backup-conversions");
  const backupConvPath = backupConvFlag !== -1 ? process.argv[backupConvFlag + 1] : null;

  let allConvRows: Array<Record<string, string>>;
  if (backupConvPath) {
    console.log(`\nLoading conversions from backup file: ${backupConvPath} …`);
    const raw = JSON.parse(readFileSync(backupConvPath, "utf-8")) as Array<Record<string, string>>;
    allConvRows = raw;
    console.log(`  ${allConvRows.length} total rows`);
  } else {
    console.log("\nReading data/conversions.csv …");
    allConvRows = parse(readFileSync(resolve(DATA_DIR, "conversions.csv"), "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;
    console.log(`  ${allConvRows.length} rows`);
  }
  const officialConvs = allConvRows.filter((c) => c.source_type === "official_chart");
  console.log(`  ${officialConvs.length} official_chart rows`);

  // Collect all paint IDs referenced by official conversions.
  const officialEndpoints = new Set<string>();
  for (const c of officialConvs) {
    officialEndpoints.add(c.paint_a_id);
    officialEndpoints.add(c.paint_b_id);
  }
  console.log(`  Distinct paint endpoints: ${officialEndpoints.size}`);

  // ── Step 4: Determine retention set ─────────────────────────────────────
  // Retain paints from production that can't come from markdown:
  //   a) Brand has no markdown file (Two Thin Coats).
  //   b) Army Painter Masterclass range.
  //   c) Any remaining official endpoint not in markdown.
  const mdBrandSlugs = new Set(Object.values(BM).map((b) => b.slug));

  const retainIds = new Set<string>();
  for (const p of prodPaints) {
    const slug = Object.values(BM).find((b) => b.brand === p.brand)?.slug;
    const brandHasMd = slug ? mdBrandSlugs.has(slug) : false;
    const isMasterclass = p.brand === "Army Painter" && p.range === "Masterclass";
    const isOfficialEndpoint = officialEndpoints.has(p.id) && !mdIds.has(p.id);

    if (!brandHasMd || isMasterclass || isOfficialEndpoint) {
      retainIds.add(p.id);
    }
  }
  console.log(
    `\nRetention set: ${retainIds.size} paints (Two Thin Coats, Masterclass, official endpoints not in markdown)`,
  );

  // Convert retained prod paints to PaintRecord shape (with r,g,b derived from hex).
  const retainedPaints: Array<Record<string, unknown>> = [];
  for (const id of retainIds) {
    const p = prodById.get(id);
    if (!p) continue;
    const rgb = p.hex ? H2R(p.hex) : null;
    retainedPaints.push({
      id: p.id,
      brand: p.brand,
      range: p.range ?? "",
      name: p.name,
      sku_code: p.sku_code ?? null,
      hex: p.hex ?? null,
      r: rgb?.r ?? null,
      g: rgb?.g ?? null,
      b: rgb?.b ?? null,
      status: p.status ?? "active",
      type: p.type ?? null,
      lab_l: null,
      lab_a: null,
      lab_b: null,
      size_ml: null,
      version: 1,
    });
  }

  // ── Step 5: Build final paint catalog ────────────────────────────────────
  const mdPaintRows: Array<Record<string, unknown>> = mdPaints.map((p) => ({
    id: p.id,
    brand: p.brand,
    range: p.range,
    name: p.name,
    sku_code: p.sku_code,
    hex: p.hex,
    r: p.r,
    g: p.g,
    b: p.b,
    status: p.status,
    type: p.type,
    lab_l: null,
    lab_a: null,
    lab_b: null,
    size_ml: null,
    version: 1,
  }));

  // Merge: markdown first, then retained (markdown takes precedence on same id).
  const mergedById = new Map<string, Record<string, unknown>>();
  for (const r of mdPaintRows) mergedById.set(r.id as string, r);
  for (const r of retainedPaints) {
    if (!mergedById.has(r.id as string)) mergedById.set(r.id as string, r);
  }
  const finalPaints = [...mergedById.values()];

  console.log(`\nFinal paint catalog: ${finalPaints.length} paints`);

  // ── Step 6: Filter official conversions to surviving endpoints ────────────
  const finalIds = new Set(finalPaints.map((p) => p.id as string));
  const finalConvs = officialConvs.filter(
    (c) => finalIds.has(c.paint_a_id) && finalIds.has(c.paint_b_id),
  );
  const dropped = officialConvs.length - finalConvs.length;
  console.log(
    `Official conversions: ${officialConvs.length} → ${finalConvs.length} kept` +
      (dropped > 0
        ? ` (${dropped} dropped — endpoints missing from final catalog)`
        : " (all survive)"),
  );

  // Sanity checks.
  if (finalPaints.length < 11000) {
    throw new Error(
      `Final catalog only ${finalPaints.length} paints — expected ≥ 11 000; aborting`,
    );
  }
  if (finalConvs.length < 700) {
    throw new Error(
      `Only ${finalConvs.length} official conversions survive — expected ≥ 700; aborting`,
    );
  }

  // ── Step 6b: Derive transitive conversions ───────────────────────────────
  console.log("\nDeriving transitive conversions …");
  const paintMinimal = finalPaints.map((p) => ({
    id: p.id as string,
    brand: p.brand as string,
    name: p.name as string,
  }));
  const transitiveConvs = deriveTransitiveConversions(
    finalConvs as unknown as OfficialRow[],
    paintMinimal,
  );
  console.log(
    `  ${transitiveConvs.length} transitive rows derived from ${finalConvs.length} official rows`,
  );

  // Build the combined list: official rows first, then transitive.
  // Transitive rows must carry all columns present in the official CSV rows so that
  // toCsvString produces a consistent header and the seed script can insert them.
  const now = new Date().toISOString();
  const allConvs = [
    ...finalConvs,
    ...transitiveConvs.map((r) => ({
      id: randomUUID(),
      paint_a_id: r.paint_a_id,
      paint_b_id: r.paint_b_id,
      confidence: String(r.confidence),
      source_type: r.source_type,
      source_url: "",
      notes: r.notes,
      verified_count: "0",
      disputed_count: "0",
      created_at: now,
      updated_at: now,
    })),
  ];

  // ── Step 7: Write CSVs ────────────────────────────────────────────────────
  console.log("\nWriting data/paints.csv …");
  writeFileSync(resolve(DATA_DIR, "paints.csv"), toCsvString(finalPaints), "utf-8");
  console.log("  ✓");

  console.log(
    `Writing data/conversions.csv … (${finalConvs.length} official + ${transitiveConvs.length} transitive)`,
  );
  writeFileSync(resolve(DATA_DIR, "conversions.csv"), toCsvString(allConvs), "utf-8");
  console.log("  ✓");

  // Brand breakdown.
  const brandCount: Record<string, number> = {};
  for (const p of finalPaints) {
    const b = p.brand as string;
    brandCount[b] = (brandCount[b] ?? 0) + 1;
  }
  console.log("\nBrand breakdown (top 15):");
  for (const [b, c] of Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)) {
    console.log(`  ${b}: ${c}`);
  }

  console.log(
    "\nDone. Review data/paints.csv and data/conversions.csv, then run:\n" +
      "  npx tsx scripts/rebuild-catalog-prod.ts",
  );
}

main().catch((err: unknown) => {
  console.error("Error:", err);
  process.exit(1);
});
