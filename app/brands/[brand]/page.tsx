import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PaintSwatch } from "@/components/PaintSwatch";
import { AddToInventoryButton } from "@/components/AddToInventoryButton";
import {
  getBrands,
  getBrandOverviews,
  getPaintsForBrand,
  groupPaintsByRange,
  slugifyBrand,
} from "@/lib/brands";

export const revalidate = 86400;

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ brand: slugifyBrand(brand) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand: slug } = await params;
  const overviews = await getBrandOverviews();
  const overview = overviews.find((b) => b.slug === slug);
  if (!overview) return {};

  const title = `${overview.brand} Paint Catalog — ${overview.paint_count} Paints`;
  const description = `Browse all ${overview.paint_count} ${overview.brand} paints across ${overview.range_count} ranges with colour swatches.`;
  return {
    title,
    description,
    alternates: { canonical: `/brands/${slug}` },
    openGraph: { title, description },
  };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const overviews = await getBrandOverviews();
  const overview = overviews.find((b) => b.slug === slug);
  if (!overview) notFound();

  const paints = await getPaintsForBrand(overview.brand);
  const groups = groupPaintsByRange(paints);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Brands", href: "/brands" }, { label: overview.brand }]} />
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{overview.brand}</h1>
          <p className="text-muted-foreground text-lg">
            {overview.paint_count.toLocaleString()} paints &middot;{" "}
            {overview.range_count.toLocaleString()} ranges
          </p>
        </header>
      </div>

      {groups.map(({ range, paints: rangePaints }) => {
        const id = `range-${range.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <section key={range} aria-labelledby={id}>
            <h2 id={id} className="text-lg font-semibold mb-3">
              {range}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {rangePaints.length.toLocaleString()}
              </span>
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {rangePaints.map((paint) => (
                <li
                  key={paint.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <PaintSwatch hex={paint.hex} />
                  <span className="flex-1 truncate">{paint.name}</span>
                  <AddToInventoryButton paintId={paint.id} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
