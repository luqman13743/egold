import type { MetadataRoute } from "next";
import { db, products, categories } from "@/db";
import { eq, isNull, and } from "drizzle-orm";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "", "/shop", "/categories", "/search", "/about", "/contact", "/faq",
  "/privacy-policy", "/terms", "/shipping-policy", "/return-policy", "/refund-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productList, categoryList] = await Promise.all([
    db.query.products.findMany({
      where: and(eq(products.status, "published"), isNull(products.deletedAt)),
      columns: { slug: true, updatedAt: true },
    }),
    db.query.categories.findMany({ columns: { slug: true, updatedAt: true } }),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.6,
    })),
    ...categoryList.map((c) => ({
      url: `${siteUrl}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productList.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
