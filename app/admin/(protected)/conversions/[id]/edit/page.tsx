import Link from "next/link";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Conversion, PaintRow } from "@/lib/admin/types";
import ConversionForm from "../../ConversionForm";
import { updateConversionAction } from "../../actions";

export default async function EditConversionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;

  const [{ data: convData, error: convErr }, { data: paintsData }] = await Promise.all([
    adminClient.from("conversions").select("*").eq("id", id).single(),
    adminClient.from("paints").select("id, brand, name").order("brand").order("name"),
  ]);

  if (convErr || !convData) notFound();

  const conversion = convData as Conversion;
  const paints = (paintsData ?? []) as PaintRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/conversions" className="text-gray-500 underline text-sm">
          ← Conversions
        </Link>
        <h1 className="text-xl font-semibold">Edit conversion</h1>
      </div>
      <ConversionForm
        paints={paints}
        conversion={conversion}
        action={updateConversionAction}
        error={errorMsg}
        submitLabel="Save changes"
      />
    </div>
  );
}
