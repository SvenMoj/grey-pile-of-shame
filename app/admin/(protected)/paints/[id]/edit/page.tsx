import Link from "next/link";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import type { Paint } from "@/lib/admin/types";
import PaintForm from "../../PaintForm";
import { updatePaintAction } from "../../actions";

export default async function EditPaintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;

  const { data, error } = await adminClient
    .from("paints")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const paint = data as Paint;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/paints" className="text-gray-500 underline text-sm">
          ← Paints
        </Link>
        <h1 className="text-xl font-semibold">Edit paint: {paint.name}</h1>
      </div>
      <PaintForm
        paint={paint}
        action={updatePaintAction}
        error={errorMsg}
        submitLabel="Save changes"
      />
    </div>
  );
}
