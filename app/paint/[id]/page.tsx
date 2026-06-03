import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PaintSwatch } from "@/components/PaintSwatch";
import { InventoryButton } from "@/components/InventoryButton";
import { createClient } from "@/lib/supabase/server";
import {
  getPaintById,
  getConversionsForPaint,
  groupConversionsByBrand,
} from "@/lib/conversions/brand-pairs";
import { SOURCE_LABELS, SOURCE_VARIANTS } from "@/lib/conversions/source-display";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const paint = await getPaintById(id);
  if (!paint) return {};
  return {
    title: `${paint.name} (${paint.brand}) — Paint Conversions`,
    description: `Find substitutes and equivalents for ${paint.brand} ${paint.name} across all major miniature paint brands.`,
    alternates: { canonical: `/paint/${id}` },
  };
}

export default async function PaintDetailPage({ params }: Props) {
  const { id } = await params;

  const [paint, conversions] = await Promise.all([getPaintById(id), getConversionsForPaint(id)]);

  if (!paint) notFound();

  const groups = groupConversionsByBrand(conversions);

  // Server-side ownership check — RLS scopes user_paints to the authenticated user.
  // Page is dynamic (reads cookies); logged-out users get an empty set.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ownedIds = new Set<string>();
  if (user) {
    const allPaintIds = [
      paint.id,
      ...groups.flatMap((g) => g.conversions.map((c) => c.paint_b.id)),
    ];
    const { data: owned } = await supabase
      .from("user_paints")
      .select("catalog_paint_id")
      .in("catalog_paint_id", allPaintIds);
    ownedIds = new Set(
      (owned ?? []).map((r) => r.catalog_paint_id).filter((cid): cid is string => cid !== null),
    );
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Convert", href: "/convert" },
          { label: paint.name },
        ]}
      />

      {/* Paint header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <PaintSwatch hex={paint.hex} size="md" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{paint.name}</h1>
              <InventoryButton paintId={paint.id} initialOwned={ownedIds.has(paint.id)} />
            </div>
            <p className="text-muted-foreground text-sm">
              {paint.brand}
              {paint.range ? ` · ${paint.range}` : ""}
              {paint.type ? ` · ${paint.type}` : ""}
              {paint.sku_code ? ` · ${paint.sku_code}` : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Conversions */}
      {groups.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No known conversions for this paint yet.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map(({ brand, conversions: rows }) => (
            <section key={brand} aria-labelledby={`brand-${brand}`}>
              <h2
                id={`brand-${brand}`}
                className="text-lg font-semibold mb-3 pb-2 border-b border-border"
              >
                {brand} equivalents
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[260px]">Paint</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">
                        Range
                      </TableHead>
                      <TableHead className="w-24 text-right">Match</TableHead>
                      <TableHead className="w-28">Source</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/paint/${c.paint_b.id}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <PaintSwatch hex={c.paint_b.hex} size="sm" />
                            <span>{c.paint_b.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.paint_b.range ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {(c.confidence * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={SOURCE_VARIANTS[c.source_type] ?? "outline"}>
                            {SOURCE_LABELS[c.source_type] ?? c.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <InventoryButton
                            paintId={c.paint_b.id}
                            initialOwned={ownedIds.has(c.paint_b.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
