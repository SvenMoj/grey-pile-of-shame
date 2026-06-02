/**
 * One-off script: apply the rebuilt catalog to the PRODUCTION database.
 *
 * Pre-requisite: run `scripts/build-catalog-from-markdown.ts` first and
 * review data/paints.csv (≥11 600 rows, with r,g,b) and data/conversions.csv
 * (704 official_chart rows).
 *
 * Steps (FK-safe order):
 *   1. Backup current paints + conversions to data/backups/*.json.
 *   2. DELETE all conversions (FK deps on paints; no ON DELETE CASCADE).
 *   3. DELETE all paints.
 *   4. Upsert all paints from data/paints.csv.
 *   5. Upsert all conversions from data/conversions.csv.
 *   6. Print final counts for verification.
 *
 * Note: the paints table must have r,g,b columns before running this
 * (apply migration 20260602121906_add_rgb_to_paints.sql first).
 *
 * Usage:
 *   npx tsx scripts/rebuild-catalog-prod.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import ws from "ws";
import type { Database } from "../lib/supabase/database.types";
import { sanitizeRow } from "../lib/seed/sanitize-row";

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
const BACKUP_DIR = resolve(DATA_DIR, "backups");

function readCsv(filename: string): Record<string, string>[] {
  const content = readFileSync(resolve(DATA_DIR, filename), "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
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

async function deleteAll(table: "paints" | "conversions" | "submissions"): Promise<void> {
  // Single DELETE WHERE id IS NOT NULL — avoids URL-length limits from batching
  // long text IDs in an .in() filter, and is idempotent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(table) as any).delete().not("id", "is", null);
  if (error) throw error;
}

async function upsertInBatches(
  table: "paints" | "conversions",
  rows: Record<string, unknown>[],
  onConflict: string,
  batchSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      // @ts-expect-error — heterogeneous row shapes
      .upsert(batch, { onConflict });
    if (error) throw error;
    if (i % 5000 === 0 && i > 0) {
      console.log(`    ${i}/${rows.length} …`);
    }
  }
}

async function main(): Promise<void> {
  // ── 0. Validate CSVs ─────────────────────────────────────────────────────
  console.log("Reading data/paints.csv …");
  const paintsCsv = readCsv("paints.csv");
  console.log(`  ${paintsCsv.length} paints`);
  if (paintsCsv.length < 11000) {
    throw new Error(
      `data/paints.csv has only ${paintsCsv.length} rows — expected ≥ 11 000. ` +
        "Run build-catalog-from-markdown.ts first.",
    );
  }
  // Confirm r,g,b columns exist in the CSV.
  if (!("r" in paintsCsv[0])) {
    throw new Error(
      "data/paints.csv is missing 'r' column. Regenerate with build-catalog-from-markdown.ts.",
    );
  }

  console.log("Reading data/conversions.csv …");
  const convsCsv = readCsv("conversions.csv");
  console.log(`  ${convsCsv.length} conversions`);
  if (convsCsv.length < 700) {
    throw new Error(`data/conversions.csv has only ${convsCsv.length} rows — expected ≥ 700.`);
  }

  // ── 1. Backup ─────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  mkdirSync(BACKUP_DIR, { recursive: true });

  console.log(`\n[Step 1] Backing up production tables (${timestamp}) …`);
  console.log("  Backing up paints …");
  const prodPaints = await paginate("paints", "*");
  writeFileSync(
    resolve(BACKUP_DIR, `paints-${timestamp}.json`),
    JSON.stringify(prodPaints, null, 2),
    "utf-8",
  );
  console.log(`    → ${prodPaints.length} rows saved`);

  console.log("  Backing up conversions …");
  const prodConvs = await paginate("conversions", "*");
  writeFileSync(
    resolve(BACKUP_DIR, `conversions-${timestamp}.json`),
    JSON.stringify(prodConvs, null, 2),
    "utf-8",
  );
  console.log(`    → ${prodConvs.length} rows saved`);

  // ── 2. Delete all FK dependents on paints (RESTRICT order) ──────────────
  // conversions and submissions both reference paints with NO ACTION (RESTRICT).
  // Delete them first or the paint deletion will be blocked.
  console.log("\n[Step 2] Deleting all conversions …");
  await deleteAll("conversions");
  console.log(`  Done`);

  console.log("[Step 2b] Deleting all submissions …");
  await deleteAll("submissions");
  console.log(`  Done`);

  // ── 3. Delete all paints ──────────────────────────────────────────────────
  console.log("\n[Step 3] Deleting all paints …");
  await deleteAll("paints");
  console.log(`  Done`);

  // ── 4. Upsert paints ──────────────────────────────────────────────────────
  console.log("\n[Step 4] Upserting paints …");
  const paintRows = paintsCsv.map((row) =>
    sanitizeRow(row, ["lab_l", "lab_a", "lab_b"], ["size_ml", "r", "g", "b", "version"]),
  );
  await upsertInBatches("paints", paintRows, "id");
  console.log(`  Upserted ${paintRows.length} paints`);

  // ── 5. Upsert conversions ─────────────────────────────────────────────────
  console.log("\n[Step 5] Upserting conversions …");
  const convRows = convsCsv.map((row) =>
    sanitizeRow(row, ["confidence"], ["verified_count", "disputed_count"]),
  );
  await upsertInBatches("conversions", convRows, "paint_a_id,paint_b_id");
  console.log(`  Upserted ${convRows.length} conversions`);

  // ── 6. Verify ─────────────────────────────────────────────────────────────
  console.log("\n[Step 6] Verifying final counts …");
  const { count: finalPaintCount } = await supabase
    .from("paints")
    .select("*", { count: "exact", head: true });
  const { count: finalConvCount } = await supabase
    .from("conversions")
    .select("*", { count: "exact", head: true });
  console.log(`  Paints:      ${finalPaintCount ?? "?"}`);
  console.log(`  Conversions: ${finalConvCount ?? "?"}`);

  // Spot check: known official pair.
  const { data: spotCheck } = await supabase
    .from("conversions")
    .select("paint_a_id,paint_b_id,source_type")
    .eq("paint_a_id", "vallejo-game-color-dead-white")
    .eq("paint_b_id", "citadel-layer-white-scar")
    .limit(1);
  console.log(
    `  Spot check (vallejo-game-color-dead-white → citadel-layer-white-scar): ` +
      (spotCheck && spotCheck.length > 0 ? "✓ found" : "✗ MISSING"),
  );

  console.log("\n✓ Done.");
  console.log(`  Backup files: data/backups/paints-${timestamp}.json`);
  console.log(`                data/backups/conversions-${timestamp}.json`);
}

main().catch((err: unknown) => {
  console.error("Error:", err);
  process.exit(1);
});
