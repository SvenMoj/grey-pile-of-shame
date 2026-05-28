import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { PaintRow } from "@/lib/admin/types";
import ConversionForm from "../ConversionForm";
import { createConversionAction } from "../actions";

export default async function NewConversionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const { data } = await adminClient
    .from("paints")
    .select("id, brand, name")
    .eq("status", "active")
    .order("brand")
    .order("name");
  const paints = (data ?? []) as PaintRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/conversions" className="text-gray-500 underline text-sm">
          ← Conversions
        </Link>
        <h1 className="text-xl font-semibold">New conversion</h1>
      </div>
      <ConversionForm
        paints={paints}
        action={createConversionAction}
        error={error}
        submitLabel="Create conversion"
      />
    </div>
  );
}
