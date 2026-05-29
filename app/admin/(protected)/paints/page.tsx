import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Paint } from "@/lib/admin/types";
import { softDeletePaintAction } from "./actions";

const PAGE_SIZE = 50;

function pageHref(page: number, brand?: string) {
  const params = new URLSearchParams({ ...(brand ? { brand } : {}), page: String(page) });
  return `/admin/paints?${params}`;
}

export default async function AdminPaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; page?: string }>;
}) {
  const { brand, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("paints")
    .select("*", { count: "exact" })
    .order("brand")
    .order("name")
    .range(from, to);
  if (brand) query = query.eq("brand", brand) as typeof query;

  const { data, error, count } = await query;
  const paints = (data ?? []) as Paint[];
  const totalCount = count ?? 0;
  const hasNextPage = from + paints.length < totalCount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brandsData } = await (adminClient.rpc as any)("paint_brands");
  const brands = (brandsData ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Paints ({totalCount})</h1>
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

      {(page > 1 || hasNextPage) && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1, brand)} className="border rounded px-3 py-1">
              ← Prev
            </Link>
          ) : (
            <span className="border rounded px-3 py-1 text-gray-300">← Prev</span>
          )}
          <span className="text-gray-500">
            Page {page} · {from + 1}–{from + paints.length} of {totalCount}
          </span>
          {hasNextPage ? (
            <Link href={pageHref(page + 1, brand)} className="border rounded px-3 py-1">
              Next →
            </Link>
          ) : (
            <span className="border rounded px-3 py-1 text-gray-300">Next →</span>
          )}
        </div>
      )}
    </div>
  );
}
