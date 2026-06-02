import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getBrands, slugifyBrand, resolveBrandSlug } from "@/lib/brands";
import { getBrandPairCounts } from "@/lib/conversions/brand-pairs";

export const revalidate = 86400;

type Props = {
  params: Promise<{ from: string }>;
};

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ from: slugifyBrand(brand) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { from: fromSlug } = await params;
  const brands = await getBrands();
  const fromBrand = resolveBrandSlug(fromSlug, brands);
  if (!fromBrand) return {};

  return {
    title: `Convert ${fromBrand} Paints — Substitutes by Brand`,
    description: `Find ${fromBrand} paint substitutes across Citadel, Vallejo, Army Painter, Reaper, and more. Browse every cross-brand conversion chart.`,
    alternates: {
      canonical: `/convert/${fromSlug}`,
    },
    openGraph: {
      title: `${fromBrand} Paint Conversion Charts`,
      description: `Find ${fromBrand} paint equivalents in other miniature paint brands.`,
    },
  };
}

export default async function BrandIndexPage({ params }: Props) {
  const { from: fromSlug } = await params;
  const [brands, pairCounts] = await Promise.all([getBrands(), getBrandPairCounts()]);
  const fromBrand = resolveBrandSlug(fromSlug, brands);
  if (!fromBrand) notFound();

  const targets = pairCounts
    .filter((p) => p.brand_a === fromBrand && p.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((p) => ({ brand: p.brand_b, slug: slugifyBrand(p.brand_b), count: p.n }));

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Convert", href: "/convert" },
          { label: fromBrand },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Convert {fromBrand} Paints</h1>
        <p className="text-muted-foreground text-lg">
          Choose a target brand to see the full conversion chart for {fromBrand} paints.
        </p>
      </header>

      {targets.length === 0 ? (
        <p className="text-muted-foreground">No conversion data available for {fromBrand} yet.</p>
      ) : (
        <ul className="space-y-2">
          {targets.map(({ brand, slug, count }) => (
            <li key={slug}>
              <Link
                href={`/convert/${fromSlug}/${slug}`}
                className="flex items-center justify-between rounded-lg border border-border px-5 py-4 hover:border-primary hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">
                  {fromBrand}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {brand}
                </span>
                <span className="text-sm text-muted-foreground">{count} matches</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
