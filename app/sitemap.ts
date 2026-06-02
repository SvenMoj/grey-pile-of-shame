import type { MetadataRoute } from "next";
import { getBrands, slugifyBrand } from "@/lib/brands";
import { getBrandPairCounts } from "@/lib/conversions/brand-pairs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, pairCounts] = await Promise.all([getBrands(), getBrandPairCounts()]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/convert`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const brandIndexPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE_URL}/convert/${slugifyBrand(brand)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const brandDetailPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE_URL}/brands/${slugifyBrand(brand)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const pairPages: MetadataRoute.Sitemap = pairCounts
    .filter((p) => p.n > 0)
    .map((p) => ({
      url: `${BASE_URL}/convert/${slugifyBrand(p.brand_a)}/${slugifyBrand(p.brand_b)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    }));

  return [...staticPages, ...brandIndexPages, ...brandDetailPages, ...pairPages];
}
