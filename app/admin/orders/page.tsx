import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, orders } from "@/db";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage() {
  const list = await db.query.orders.findMany({ orderBy: [desc(orders.createdAt)], limit: 100 });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Orders</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
              <th className="py-2 pr-4 font-normal">Order</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 pr-4 font-normal">Payment</th>
              <th className="py-2 pr-4 font-normal">Total</th>
              <th className="py-2 font-normal">Placed</th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => (
              <tr key={order.id} className="border-b border-sand dark:border-white/10">
                <td className="py-3 pr-4">
                  <Link href={`/admin/orders/${order.id}`} className="hover:text-accent font-medium">
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                <td className="py-3 pr-4"><StatusBadge status={order.paymentStatus} /></td>
                <td className="py-3 pr-4 tabular-nums">{formatPrice(order.total)}</td>
                <td className="py-3 text-ink/50 dark:text-white/50">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-ink/50">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
