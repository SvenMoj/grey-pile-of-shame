import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaintSwatch } from "@/components/PaintSwatch";
import { getBrandOverviews } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Miniature Paint Brands — Catalog Overview",
  description:
    "Browse every miniature paint brand in the catalog: paint counts, ranges, and colour swatches for Citadel, Vallejo, Army Painter, Reaper, Scale75, and more.",
};

export default async function BrandsPage() {
  const brands = await getBrandOverviews();

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Miniature Paint Brands</h1>
        <p className="text-muted-foreground text-lg">
          Explore the full catalog for every brand — paints, ranges, and colours at a glance.
        </p>
      </header>

      <section aria-labelledby="brands-heading">
        <h2 id="brands-heading" className="text-xl font-semibold mb-4">
          All brands
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {brands.map(({ brand, slug, paint_count, range_count, sample_hexes }) => (
            <Link key={slug} href={`/brands/${slug}`} className="group">
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold leading-tight">{brand}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {paint_count.toLocaleString()} paints &middot; {range_count.toLocaleString()}{" "}
                    ranges
                  </p>
                  {sample_hexes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sample_hexes.map((hex, i) => (
                        <PaintSwatch key={i} hex={hex} size="sm" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
