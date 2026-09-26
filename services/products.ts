import { and, eq, gte, lte, ilike, or, sql, desc, asc, isNull } from "drizzle-orm";
import { db, products, productImages, categories, brands, inventory, reviews } from "@/db";
import type { z } from "zod";
import type { productSearchSchema } from "@/schemas/product";

type ProductSearchInput = z.infer<typeof productSearchSchema>;

// All customer-facing product queries filter to published + not soft-deleted
// — draft/archived products must never leak to the storefront regardless
// of how they're queried.
const VISIBLE = and(eq(products.status, "published"), isNull(products.deletedAt));

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), VISIBLE),
    with: {
      images: { orderBy: (img, { asc }) => [asc(img.position)] },
      variants: true,
      category: true,
      brand: true,
      inventory: true,
    },
  });
  return product ?? null;
}

export async function searchProducts(input: ProductSearchInput) {
  const conditions = [VISIBLE];

  if (input.query) {
    conditions.push(
      or(
        ilike(products.name, `%${input.query}%`),
        ilike(products.sku, `%${input.query}%`),
        sql`${products.tags}::text ILIKE ${`%${input.query}%`}`
      )!
    );
  }

  if (input.categorySlug) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, input.categorySlug),
    });
    if (category) conditions.push(eq(products.categoryId, category.id));
  }

  if (input.brandSlug) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.slug, input.brandSlug) });
    if (brand) conditions.push(eq(products.brandId, brand.id));
  }

  if (input.minPrice !== undefined) conditions.push(gte(products.price, String(input.minPrice)));
  if (input.maxPrice !== undefined) conditions.push(lte(products.price, String(input.maxPrice)));

  const orderBy =
    input.sort === "price_asc"
      ? [asc(products.price)]
      : input.sort === "price_desc"
        ? [desc(products.price)]
        : input.sort === "newest"
          ? [desc(products.createdAt)]
          : [desc(products.createdAt)]; // "relevance"/"rating" fall back to newest until
  // a dedicated search engine / rating aggregate is added (see section 10
  // of the spec — Postgres-first, swappable later).

  const offset = (input.page - 1) * input.perPage;

  const [items, totalResult] = await Promise.all([
    db.query.products.findMany({
      where: and(...conditions),
      with: { images: { limit: 1, orderBy: (img, { asc }) => [asc(img.position)] } },
      orderBy,
      limit: input.perPage,
      offset,
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(and(...conditions)),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
    page: input.page,
    perPage: input.perPage,
  };
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    where: VISIBLE,
    with: { images: { limit: 1, orderBy: (img, { asc }) => [asc(img.position)] } },
    orderBy: [desc(products.createdAt)],
    limit,
  });
}

export async function getProductReviews(productId: string) {
  return db.query.reviews.findMany({
    where: and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}
