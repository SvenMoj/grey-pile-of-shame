import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Paint } from "@/lib/admin/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <Button size="sm" asChild>
          <Link href="/admin/paints/new">+ New paint</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <form method="get" className="flex items-center gap-2">
        <select
          name="brand"
          defaultValue={brand ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        {brand && (
          <Button variant="link" size="sm" asChild className="h-auto p-0">
            <Link href="/admin/paints">Clear</Link>
          </Button>
        )}
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Hex</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paints.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No paints found.
              </TableCell>
            </TableRow>
          )}
          {paints.map((p) => (
            <TableRow key={p.id} className={p.status === "discontinued" ? "opacity-50" : ""}>
              <TableCell className="font-mono text-xs">{p.id}</TableCell>
              <TableCell>{p.brand}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>
                {p.hex ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-4 w-4 rounded border"
                      style={{ backgroundColor: `#${p.hex}` }}
                    />
                    <span className="font-mono text-xs">#{p.hex}</span>
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="link" size="sm" asChild className="h-auto p-0">
                    <Link href={`/admin/paints/${p.id}/edit`}>Edit</Link>
                  </Button>
                  {p.status === "active" && (
                    <form action={softDeletePaintAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button
                        variant="link"
                        size="sm"
                        type="submit"
                        className="h-auto p-0 text-destructive"
                      >
                        Discontinue
                      </Button>
                    </form>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(page > 1 || hasNextPage) && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page - 1, brand)}>← Prev</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              ← Prev
            </Button>
          )}
          <span className="text-muted-foreground">
            Page {page} · {from + 1}–{from + paints.length} of {totalCount}
          </span>
          {hasNextPage ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page + 1, brand)}>Next →</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
