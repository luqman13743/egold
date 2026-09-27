import Link from "next/link";
import { searchProducts } from "@/services/products";
import { productSearchSchema } from "@/schemas/product";
import { ProductCard } from "@/components/product-card";
import { publicUrlFor } from "@/lib/r2/upload";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full catalog — filter by category, brand and price.",
  alternates: { canonical: "/shop" },
};

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = productSearchSchema.safeParse({
    categorySlug: params.category,
    brandSlug: params.brand,
    minPrice: params.min,
    maxPrice: params.max,
    sort: params.sort,
    page: params.page,
  });

  const input = parsed.success ? parsed.data : productSearchSchema.parse({});
  const { items, total, perPage, page } = await searchProducts(input);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-3xl">Shop</h1>
        <form className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-ink/60 dark:text-white/60">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={input.sort}
            className="rounded border border-sand dark:border-white/10 bg-transparent px-2 py-1.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-display">No products match these filters.</p>
          <Link href="/shop" className="mt-3 inline-block text-sm text-accent hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                salePrice={product.salePrice}
                imageUrl={product.images[0] ? publicUrlFor(product.images[0].objectKey) : undefined}
                imageAlt={product.images[0]?.altText ?? undefined}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex justify-center gap-2 text-sm" aria-label="Pagination">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={`/shop?page=${p}${input.sort !== "relevance" ? `&sort=${input.sort}` : ""}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`h-8 w-8 flex items-center justify-center rounded ${
                      p === page ? "bg-accent text-white" : "hover:bg-sand dark:hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
