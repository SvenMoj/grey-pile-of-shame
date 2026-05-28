import Link from "next/link";
import PaintForm from "../PaintForm";
import { createPaintAction } from "../actions";

export default async function NewPaintPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/paints" className="text-gray-500 underline text-sm">
          ← Paints
        </Link>
        <h1 className="text-xl font-semibold">New paint</h1>
      </div>
      <PaintForm action={createPaintAction} error={error} submitLabel="Create paint" />
    </div>
  );
}
