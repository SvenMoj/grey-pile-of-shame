import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConversionTable } from "@/components/ConversionTable";
import { JsonLd } from "@/components/JsonLd";
import { getBrands, slugifyBrand, resolveBrandSlug } from "@/lib/brands";
import {
  getBrandPairCounts,
  getConversionsForPair,
  buildFaqItems,
  buildItemListJsonLd,
  buildFaqPageJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/conversions/brand-pairs";

export const revalidate = 86400;
export const dynamicParams = false;

type Props = {
  params: Promise<{ from: string; to: string }>;
};

export async function generateStaticParams() {
  const pairCounts = await getBrandPairCounts();
  return pairCounts
    .filter((p) => p.n > 0)
    .map((p) => ({ from: slugifyBrand(p.brand_a), to: slugifyBrand(p.brand_b) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { from: fromSlug, to: toSlug } = await params;
  const brands = await getBrands();
  const fromBrand = resolveBrandSlug(fromSlug, brands);
  const toBrand = resolveBrandSlug(toSlug, brands);
  if (!fromBrand || !toBrand) return {};

  const pairCounts = await getBrandPairCounts();
  const pair = pairCounts.find((p) => p.brand_a === fromBrand && p.brand_b === toBrand);
  const count = pair?.n ?? 0;

  const title = `${fromBrand} to ${toBrand} Paint Conversion Chart (${count} matches)`;
  const description = `Convert ${fromBrand} paints to ${toBrand} equivalents. ${count} cross-brand substitutes with confidence ratings, official chart and community sources.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/convert/${fromSlug}/${toSlug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandPairPage({ params }: Props) {
  const { from: fromSlug, to: toSlug } = await params;

  const [brands, pairCounts] = await Promise.all([getBrands(), getBrandPairCounts()]);
  const fromBrand = resolveBrandSlug(fromSlug, brands);
  const toBrand = resolveBrandSlug(toSlug, brands);
  if (!fromBrand || !toBrand) notFound();

  const [conversions, siblings] = await Promise.all([
    getConversionsForPair(fromBrand, toBrand),
    // Other targets from the same source brand for internal linking
    Promise.resolve(
      pairCounts
        .filter((p) => p.brand_a === fromBrand && p.brand_b !== toBrand && p.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 5)
        .map((p) => ({ brand: p.brand_b, slug: slugifyBrand(p.brand_b), count: p.n })),
    ),
  ]);

  const count = conversions.length;
  const officialCount = conversions.filter((c) => c.source_type === "official_chart").length;
  const faqItems = buildFaqItems(fromBrand, toBrand, conversions);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const crumbs = [
    { name: "Home", url: baseUrl },
    { name: "Convert", url: `${baseUrl}/convert` },
    { name: fromBrand, url: `${baseUrl}/convert/${fromSlug}` },
    { name: `${fromBrand} → ${toBrand}`, url: `${baseUrl}/convert/${fromSlug}/${toSlug}` },
  ];

  return (
    <>
      {/* Structured data */}
      <JsonLd
        data={buildItemListJsonLd(
          fromBrand,
          toBrand,
          conversions,
          baseUrl,
        ) as Record<string, unknown>}
      />
      <JsonLd data={buildFaqPageJsonLd(faqItems) as Record<string, unknown>} />
      <JsonLd data={buildBreadcrumbJsonLd(crumbs) as Record<string, unknown>} />

      <main className="container mx-auto max-w-4xl px-4 py-12 space-y-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Convert", href: "/convert" },
            { label: fromBrand, href: `/convert/${fromSlug}` },
            { label: `${fromBrand} → ${toBrand}` },
          ]}
        />

        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {fromBrand} to {toBrand} Paint Conversion Chart
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            {count > 0 ? (
              <>
                {count} {fromBrand} paint{count === 1 ? "" : "s"} with a known {toBrand}{" "}
                substitute
                {officialCount > 0 && (
                  <>
                    {" "}— including {officialCount} from an official conversion chart
                  </>
                )}
                . Sorted by match confidence.
              </>
            ) : (
              <>No conversion data found between {fromBrand} and {toBrand} yet.</>
            )}
          </p>
        </header>

        {/* Conversion table */}
        <section aria-labelledby="table-heading">
          <h2 id="table-heading" className="sr-only">
            {fromBrand} to {toBrand} conversion table
          </h2>
          <ConversionTable
            conversions={conversions}
            fromBrand={fromBrand}
            toBrand={toBrand}
          />
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <>
            <Separator />
            <section aria-labelledby="faq-heading" className="space-y-6">
              <h2 id="faq-heading" className="text-xl font-semibold">
                Frequently Asked Questions
              </h2>
              <dl className="space-y-6">
                {faqItems.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <dt className="font-medium">{item.question}</dt>
                    <dd className="text-muted-foreground leading-relaxed">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}

        <Separator />

        {/* Internal navigation */}
        <footer className="space-y-6">
          {/* Reverse direction */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/convert/${toSlug}/${fromSlug}`}
              className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-4 py-2 hover:border-primary hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reverse: {toBrand} → {fromBrand}
            </Link>
            <Link
              href={`/convert/${fromSlug}`}
              className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-4 py-2 hover:border-primary hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              All {fromBrand} conversions
            </Link>
          </div>

          {/* Sibling targets */}
          {siblings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                More {fromBrand} conversion charts:
              </p>
              <ul className="flex flex-wrap gap-2">
                {siblings.map(({ brand, slug, count: sibCount }) => (
                  <li key={slug}>
                    <Link
                      href={`/convert/${fromSlug}/${slug}`}
                      className="inline-flex items-center gap-1.5 text-sm rounded-md border border-border px-3 py-1.5 hover:border-primary hover:bg-accent transition-colors"
                    >
                      {fromBrand}
                      <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                      {brand}
                      <span className="text-muted-foreground text-xs">({sibCount})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </footer>
      </main>
    </>
  );
}
