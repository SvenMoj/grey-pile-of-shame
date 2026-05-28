import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Conversion, Paint } from "@/lib/admin/types";
import { deleteConversionAction } from "./actions";

type ConversionWithNames = Conversion & {
  paint_a: Pick<Paint, "brand" | "name"> | null;
  paint_b: Pick<Paint, "brand" | "name"> | null;
};

export default async function AdminConversionsPage({
  searchParams,
}: {
  searchParams: Promise<{ paint?: string }>;
}) {
  const { paint: paintFilter } = await searchParams;

  let query = adminClient
    .from("conversions")
    .select("*, paint_a:paints!paint_a_id(brand, name), paint_b:paints!paint_b_id(brand, name)")
    .order("created_at", { ascending: false });

  if (paintFilter) {
    query = query.or(
      `paint_a_id.eq.${paintFilter},paint_b_id.eq.${paintFilter}`,
    ) as typeof query;
  }

  const { data, error } = await query;
  const conversions = (data ?? []) as ConversionWithNames[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">
          Conversions ({conversions.length})
        </h1>
        <Link
          href="/admin/conversions/new"
          className="bg-gray-900 text-white text-sm rounded px-3 py-1.5"
        >
          + New conversion
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error.message}</p>}

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border px-3 py-2">Paint A</th>
              <th className="border px-3 py-2">Paint B</th>
              <th className="border px-3 py-2">Confidence</th>
              <th className="border px-3 py-2">Source</th>
              <th className="border px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="border px-3 py-4 text-gray-400 text-center"
                >
                  No conversions found.
                </td>
              </tr>
            )}
            {conversions.map((c) => (
              <tr key={c.id}>
                <td className="border px-3 py-2">
                  {c.paint_a
                    ? `${c.paint_a.brand} — ${c.paint_a.name}`
                    : c.paint_a_id}
                </td>
                <td className="border px-3 py-2">
                  {c.paint_b
                    ? `${c.paint_b.brand} — ${c.paint_b.name}`
                    : c.paint_b_id}
                </td>
                <td className="border px-3 py-2">
                  {(c.confidence * 100).toFixed(0)}%
                </td>
                <td className="border px-3 py-2">{c.source_type}</td>
                <td className="border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/conversions/${c.id}/edit`}
                      className="underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteConversionAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-red-600 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
