"use server";

import { adminClient } from "@/lib/supabase/admin";
import { getAdminUserOrRedirect } from "@/lib/admin/auth";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

export type ImportResult =
  | { success: true; count: number; skipped: number; errors: string[] }
  | { success: false; error: string };

export async function importPaintsAction(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  await getAdminUserOrRedirect();

  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return { success: false, error: "No file selected." };

  let rows: Record<string, string>[];
  try {
    const text = await file.text();
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return {
      success: false,
      error: `CSV parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const errors: string[] = [];
  const validRows: Record<string, unknown>[] = [];

  rows.forEach((row, i) => {
    if (!row.id || !row.brand || !row.name) {
      errors.push(`Row ${i + 2}: missing required fields (id, brand, name)`);
    } else {
      validRows.push(row);
    }
  });

  if (validRows.length === 0)
    return {
      success: false,
      error: `No valid rows. ${errors.join("; ")}`,
    };

  const { error } = await adminClient
    .from("paints")
    .upsert(validRows as never[], { onConflict: "id" });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/paints");

  return {
    success: true,
    count: validRows.length,
    skipped: rows.length - validRows.length,
    errors,
  };
}

export async function importConversionsAction(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  await getAdminUserOrRedirect();

  const file = formData.get("csv") as File | null;
  if (!file || file.size === 0) return { success: false, error: "No file selected." };

  let rows: Record<string, string>[];
  try {
    const text = await file.text();
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return {
      success: false,
      error: `CSV parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const errors: string[] = [];
  const validRows: Record<string, unknown>[] = [];

  rows.forEach((row, i) => {
    if (!row.paint_a_id || !row.paint_b_id || !row.confidence || !row.source_type) {
      errors.push(
        `Row ${i + 2}: missing required fields (paint_a_id, paint_b_id, confidence, source_type)`,
      );
    } else {
      validRows.push(row);
    }
  });

  if (validRows.length === 0)
    return {
      success: false,
      error: `No valid rows. ${errors.join("; ")}`,
    };

  const { error } = await adminClient.from("conversions").upsert(validRows as never[], {
    onConflict: "paint_a_id,paint_b_id",
    ignoreDuplicates: false,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/conversions");

  return {
    success: true,
    count: validRows.length,
    skipped: rows.length - validRows.length,
    errors,
  };
}
