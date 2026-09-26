import Link from "next/link";
import { getDashboardStats } from "@/services/admin-dashboard";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Dashboard — Admin" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Revenue (30d)", value: formatPrice(stats.revenue30d) },
    { label: "Orders (30d)", value: stats.orders30d },
    { label: "Pending orders", value: stats.pendingOrders },
    { label: "Customers", value: stats.customers },
    { label: "Active products", value: stats.activeProducts },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-sand dark:border-white/10 p-4">
            <p className="text-xs text-ink/50 dark:text-white/50">{card.label}</p>
            <p className="text-xl font-medium mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-medium mb-3">Recent orders</h2>
          <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10 text-sm">
            {stats.recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex justify-between py-2.5 hover:text-accent">
                  <span>#{order.id.slice(0, 8)} · {order.status}</span>
                  <span className="tabular-nums">{formatPrice(order.total)}</span>
                </Link>
              </li>
            ))}
            {stats.recentOrders.length === 0 && <li className="py-3 text-ink/50">No orders yet.</li>}
          </ul>
        </section>

        <section>
          <h2 className="font-medium mb-3">Low stock</h2>
          <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10 text-sm">
            {stats.lowStock.map((row) => (
              <li key={row.id} className="flex justify-between py-2.5">
                <span>{row.product.name}</span>
                <span className="tabular-nums text-rust">{row.stock - row.reserved} left</span>
              </li>
            ))}
            {stats.lowStock.length === 0 && <li className="py-3 text-ink/50">Nothing low on stock.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
