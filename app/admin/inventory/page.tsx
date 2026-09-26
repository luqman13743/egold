import { db } from "@/db";
import { InventoryRow } from "@/components/admin/inventory-row";

export const metadata = { title: "Inventory — Admin" };

export default async function AdminInventoryPage() {
  const rows = await db.query.inventory.findMany({
    with: { product: true },
    orderBy: (i, { asc }) => [asc(i.stock)],
    limit: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Inventory</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
              <th className="py-2 pr-4 font-normal">Product</th>
              <th className="py-2 pr-4 font-normal">Stock</th>
              <th className="py-2 pr-4 font-normal">Reserved</th>
              <th className="py-2 pr-4 font-normal">Available</th>
              <th className="py-2 font-normal">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <InventoryRow
                key={row.id}
                productId={row.productId}
                productName={row.product.name}
                stock={row.stock}
                reserved={row.reserved}
                lowStockThreshold={row.lowStockThreshold}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
