import { sql, eq, gte, and, ne } from "drizzle-orm";
import { db, orders, products, users, inventory } from "@/db";

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueResult] = await db
    .select({ total: sql<string>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, thirtyDaysAgo)));

  const [orderCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(gte(orders.createdAt, thirtyDaysAgo));

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  const [customerCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "customer"));

  const [productCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(ne(products.status, "archived"));

  const lowStock = await db.query.inventory.findMany({
    where: sql`${inventory.stock} - ${inventory.reserved} <= ${inventory.lowStockThreshold}`,
    with: { product: true },
    limit: 10,
  });

  const recentOrders = await db.query.orders.findMany({
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 8,
  });

  return {
    revenue30d: parseFloat(revenueResult?.total ?? "0"),
    orders30d: orderCountResult?.count ?? 0,
    pendingOrders: pendingResult?.count ?? 0,
    customers: customerCountResult?.count ?? 0,
    activeProducts: productCountResult?.count ?? 0,
    lowStock,
    recentOrders,
  };
}
