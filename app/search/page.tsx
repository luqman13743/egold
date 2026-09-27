import { searchProducts } from "@/services/products";
import { productSearchSchema } from "@/schemas/product";
import { ProductCard } from "@/components/product-card";
import { publicUrlFor } from "@/lib/r2/upload";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const parsed = productSearchSchema.safeParse({ query: q || undefined, page: params.page });
  const input = parsed.success ? parsed.data : productSearchSchema.parse({});
  const results = q ? await searchProducts(input) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-6">Search</h1>

      <form className="max-w-md mb-10">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products, SKU, brand…"
          className="w-full rounded border border-sand dark:border-white/10 bg-transparent px-4 py-3 text-sm"
          autoFocus
        />
      </form>

      {!q && <p className="text-ink/60 dark:text-white/60">Start typing to search the catalog.</p>}

      {results && (
        results.items.length === 0 ? (
          <p className="text-ink/60 dark:text-white/60">No results for &ldquo;{q}&rdquo;.</p>
        ) : (
          <>
            <p className="text-sm text-ink/50 dark:text-white/50 mb-6">{results.total} result{results.total === 1 ? "" : "s"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {results.items.map((product) => (
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
          </>
        )
      )}
    </div>
  );
}
