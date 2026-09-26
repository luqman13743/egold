import Link from "next/link";
import { desc, isNull } from "drizzle-orm";
import { db, products } from "@/db";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  const list = await db.query.products.findMany({
    where: isNull(products.deletedAt),
    orderBy: [desc(products.updatedAt)],
    with: { images: { limit: 1 } },
    limit: 100,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Products</h1>
        <Link href="/admin/products/create" className="rounded-md bg-accent px-4 py-2 text-white text-sm font-medium hover:bg-accent-dim">
          New product
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
              <th className="py-2 pr-4 font-normal">Product</th>
              <th className="py-2 pr-4 font-normal">SKU</th>
              <th className="py-2 pr-4 font-normal">Price</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 font-normal">Updated</th>
            </tr>
          </thead>
          <tbody>
            {list.map((product) => (
              <tr key={product.id} className="border-b border-sand dark:border-white/10">
                <td className="py-3 pr-4">
                  <Link href={`/admin/products/${product.id}/edit`} className="hover:text-accent font-medium">
                    {product.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-ink/60 dark:text-white/60">{product.sku}</td>
                <td className="py-3 pr-4 tabular-nums">{formatPrice(product.price)}</td>
                <td className="py-3 pr-4"><StatusBadge status={product.status} /></td>
                <td className="py-3 text-ink/50 dark:text-white/50">{new Date(product.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-ink/50">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
