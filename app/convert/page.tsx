import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrands, slugifyBrand } from "@/lib/brands";
import { getBrandPairCounts } from "@/lib/conversions/brand-pairs";

export const metadata: Metadata = {
  title: "Miniature Paint Conversion Charts — All Brands",
  description:
    "Free cross-brand miniature paint conversion charts. Find Citadel, Vallejo, Army Painter, Reaper, Scale75, and more substitutes side-by-side.",
};

export default async function ConvertIndexPage() {
  const [brands, pairCounts] = await Promise.all([getBrands(), getBrandPairCounts()]);

  // Total conversions per source brand (sum all target counts)
  const brandsWithCounts = brands.map((brand) => {
    const total = pairCounts.filter((p) => p.brand_a === brand).reduce((s, p) => s + p.n, 0);
    return { brand, slug: slugifyBrand(brand), total };
  });

  // Top pairs by count for the "Popular conversions" section
  const topPairs = [...pairCounts]
    .sort((a, b) => b.n - a.n)
    .slice(0, 12)
    .map((p) => ({
      ...p,
      fromSlug: slugifyBrand(p.brand_a),
      toSlug: slugifyBrand(p.brand_b),
    }));

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Miniature Paint Conversion Charts</h1>
        <p className="text-muted-foreground text-lg">
          Find the closest substitute for any miniature paint across Citadel, Vallejo, Army Painter,
          Reaper, Scale75, and more. Select a brand to start.
        </p>
      </header>

      {/* Brand grid */}
      <section aria-labelledby="brands-heading">
        <h2 id="brands-heading" className="text-xl font-semibold mb-4">
          Choose a source brand
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {brandsWithCounts.map(({ brand, slug, total }) => (
            <Link key={slug} href={`/convert/${slug}`} className="group">
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold leading-tight">{brand}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    {total.toLocaleString()} conversions
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular pairs */}
      {topPairs.length > 0 && (
        <section aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="text-xl font-semibold mb-4">
            Popular conversion charts
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPairs.map((pair) => (
              <li key={`${pair.fromSlug}-${pair.toSlug}`}>
                <Link
                  href={`/convert/${pair.fromSlug}/${pair.toSlug}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:border-primary hover:bg-accent transition-colors"
                >
                  <span className="font-medium">
                    {pair.brand_a}{" "}
                    <ArrowRight className="inline h-3 w-3 text-muted-foreground" aria-hidden />{" "}
                    {pair.brand_b}
                  </span>
                  <span className="text-muted-foreground text-xs">{pair.n} matches</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
