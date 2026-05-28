import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Paint } from "@/lib/admin/types";
import { softDeletePaintAction } from "./actions";

export default async function AdminPaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;

  let query = adminClient.from("paints").select("*").order("brand").order("name");
  if (brand) query = query.eq("brand", brand) as typeof query;

  const { data, error } = await query;
  const paints = (data ?? []) as Paint[];

  const { data: allBrandsData } = await adminClient.from("paints").select("brand").order("brand");
  const brands = [...new Set((allBrandsData ?? []).map((r: { brand: string }) => r.brand))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Paints ({paints.length})</h1>
        <Link
          href="/admin/paints/new"
          className="bg-gray-900 text-white text-sm rounded px-3 py-1.5"
        >
          + New paint
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error.message}</p>}

      <form method="get" className="flex items-center gap-2">
        <select
          name="brand"
          defaultValue={brand ?? ""}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button type="submit" className="border rounded px-3 py-1 text-sm">
          Filter
        </button>
        {brand && (
          <Link href="/admin/paints" className="text-sm text-gray-500 underline">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border px-3 py-2">ID</th>
              <th className="border px-3 py-2">Brand</th>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Hex</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {paints.length === 0 && (
              <tr>
                <td colSpan={6} className="border px-3 py-4 text-gray-400 text-center">
                  No paints found.
                </td>
              </tr>
            )}
            {paints.map((p) => (
              <tr key={p.id} className={p.status === "discontinued" ? "opacity-50" : ""}>
                <td className="border px-3 py-2 font-mono text-xs">{p.id}</td>
                <td className="border px-3 py-2">{p.brand}</td>
                <td className="border px-3 py-2">{p.name}</td>
                <td className="border px-3 py-2">
                  {p.hex ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block w-4 h-4 rounded border"
                        style={{ backgroundColor: `#${p.hex}` }}
                      />
                      <span className="font-mono text-xs">#{p.hex}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border px-3 py-2">{p.status}</td>
                <td className="border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/paints/${p.id}/edit`} className="underline">
                      Edit
                    </Link>
                    {p.status === "active" && (
                      <form action={softDeletePaintAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-red-600 underline">
                          Discontinue
                        </button>
                      </form>
                    )}
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
