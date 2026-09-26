import { sql, gte, eq, and, desc } from "drizzle-orm";
import { db, orders, orderItems } from "@/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Analytics — Admin" };

export default async function AdminAnalyticsPage() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const dailyRevenue = await db
    .select({
      day: sql<string>`date(${orders.createdAt})`,
      total: sql<string>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)))
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(sql`date(${orders.createdAt})`);

  const topProducts = await db
    .select({
      name: orderItems.productName,
      unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<string>`sum(${orderItems.unitPrice} * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.paymentStatus, "paid"))
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(10);

  const maxRevenue = Math.max(1, ...dailyRevenue.map((d) => parseFloat(d.total)));

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Analytics</h1>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Revenue — last 14 days</h2>
        <div className="flex items-end gap-1 h-32 border-b border-sand dark:border-white/10">
          {dailyRevenue.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.day}: ${formatPrice(d.total)}`}>
              <div
                className="w-full bg-accent rounded-t"
                style={{ height: `${(parseFloat(d.total) / maxRevenue) * 100}%`, minHeight: parseFloat(d.total) > 0 ? "2px" : "0" }}
              />
            </div>
          ))}
          {dailyRevenue.length === 0 && <p className="text-sm text-ink/50 pb-2">No paid orders in this window.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-3">Top products by units sold</h2>
        <table className="w-full text-sm max-w-xl">
          <thead>
            <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
              <th className="py-2 pr-4 font-normal">Product</th>
              <th className="py-2 pr-4 font-normal">Units sold</th>
              <th className="py-2 font-normal">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="border-b border-sand dark:border-white/10">
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4 tabular-nums">{p.unitsSold}</td>
                <td className="py-2 tabular-nums">{formatPrice(p.revenue)}</td>
              </tr>
            ))}
            {topProducts.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-ink/50">No sales yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
