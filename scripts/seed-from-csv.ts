/**
 * Seed paints and conversions from CSV exports in data/.
 *
 * Usage:
 *   npx tsx scripts/seed-from-csv.ts
 *
 * Expects:
 *   data/paints.csv    — columns matching the paints table (id, brand, range, name, …)
 *   data/conversions.csv — columns matching the conversions table (paint_a_id, paint_b_id, …)
 *
 * Idempotent: uses upsert (on conflict do update), safe to re-run.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment (copies .env.local automatically via dotenv).
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Database } from "../lib/supabase/database.types";

// Load .env.local so this script works without manual env exports.
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function readCsv(filename: string): Record<string, string>[] {
  const path = resolve(process.cwd(), "data", filename);
  const content = readFileSync(path, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function seedPaints() {
  const rows = readCsv("paints.csv");
  const { error } = await supabase.from("paints").upsert(rows as never[], {
    onConflict: "id",
  });
  if (error) throw error;
  console.log(`Upserted ${rows.length} paints.`);
}

async function seedConversions() {
  const rows = readCsv("conversions.csv");
  const { error } = await supabase.from("conversions").upsert(rows as never[], {
    onConflict: "paint_a_id,paint_b_id",
    ignoreDuplicates: false,
  });
  if (error) throw error;
  console.log(`Upserted ${rows.length} conversions.`);
}

(async () => {
  try {
    await seedPaints();
    await seedConversions();
    console.log("Seed complete.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
