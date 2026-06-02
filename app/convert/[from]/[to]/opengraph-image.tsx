import { ImageResponse } from "next/og";
import { getBrands, resolveBrandSlug, slugifyBrand } from "@/lib/brands";
import { getBrandPairCounts } from "@/lib/conversions/brand-pairs";

export const alt = "Paint conversion chart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const pairCounts = await getBrandPairCounts();
  return pairCounts
    .filter((p) => p.n > 0)
    .map((p) => ({ from: slugifyBrand(p.brand_a), to: slugifyBrand(p.brand_b) }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ from: string; to: string }>;
}) {
  const { from: fromSlug, to: toSlug } = await params;
  const brands = await getBrands();
  const fromBrand = resolveBrandSlug(fromSlug, brands) ?? fromSlug;
  const toBrand = resolveBrandSlug(toSlug, brands) ?? toSlug;

  const pairCounts = await getBrandPairCounts();
  const pair = pairCounts.find((p) => p.brand_a === fromBrand && p.brand_b === toBrand);
  const count = pair?.n ?? 0;
  const subtitle = `${count} paint substitute${count === 1 ? "" : "s"} · grey-pile-of-shame`;

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f0f10 0%, #1a1a1c 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "60px 72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "6px",
          padding: "6px 14px",
          marginBottom: "24px",
          fontSize: "15px",
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Paint Conversion Chart
      </div>

      {/* Main heading */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "72px",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.1,
          marginBottom: "20px",
        }}
      >
        <span>{fromBrand}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 20px" }}>→</span>
        <span>{toBrand}</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "28px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0",
        }}
      >
        {subtitle}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
