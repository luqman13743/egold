import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, categories } from "@/db";
import { searchProducts } from "@/services/products";
import { productSearchSchema } from "@/schemas/product";
import { ProductCard } from "@/components/product-card";
import { publicUrlFor } from "@/lib/r2/upload";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) return {};
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || undefined,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) notFound();

  const input = productSearchSchema.parse({ categorySlug: slug, page: sp.page, sort: sp.sort });
  const { items, total } = await searchProducts(input);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-2">{category.name}</h1>
      <p className="text-sm text-ink/50 dark:text-white/50 mb-8">{total} product{total === 1 ? "" : "s"}</p>

      {items.length === 0 ? (
        <p className="text-ink/60 dark:text-white/60">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              salePrice={product.salePrice}
              imageUrl={product.images[0] ? publicUrlFor(product.images[0].objectKey) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
