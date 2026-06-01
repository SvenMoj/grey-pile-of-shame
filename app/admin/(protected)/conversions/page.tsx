import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import type { Conversion, Paint } from "@/lib/admin/types";
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
    query = query.or(`paint_a_id.eq.${paintFilter},paint_b_id.eq.${paintFilter}`) as typeof query;
  }

  const { data, error } = await query;
  const conversions = (data ?? []) as ConversionWithNames[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Conversions ({conversions.length})</h1>
        <Button size="sm" asChild>
          <Link href="/admin/conversions/new">+ New conversion</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paint A</TableHead>
            <TableHead>Paint B</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Source</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No conversions found.
              </TableCell>
            </TableRow>
          )}
          {conversions.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                {c.paint_a ? `${c.paint_a.brand} — ${c.paint_a.name}` : c.paint_a_id}
              </TableCell>
              <TableCell>
                {c.paint_b ? `${c.paint_b.brand} — ${c.paint_b.name}` : c.paint_b_id}
              </TableCell>
              <TableCell>{(c.confidence * 100).toFixed(0)}%</TableCell>
              <TableCell>{c.source_type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="link" size="sm" asChild className="h-auto p-0">
                    <Link href={`/admin/conversions/${c.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteConversionAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button
                      variant="link"
                      size="sm"
                      type="submit"
                      className="h-auto p-0 text-destructive"
                    >
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
