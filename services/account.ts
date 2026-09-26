import { eq, and, desc } from "drizzle-orm";
import { db, orders, orderItems, addresses, wishlists, products, reviews } from "@/db";

// Every function here takes userId explicitly and scopes every query to it
// — there is no "get order by id" without also checking ownership, so a
// customer can never fetch another customer's order by guessing an id
// (insecure direct object reference).

export async function getUserOrders(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getUserOrderById(userId: string, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });
  if (!order) return null;

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) });
  return { order, items };
}

export async function getUserAddresses(userId: string) {
  return db.query.addresses.findMany({ where: eq(addresses.userId, userId) });
}

export async function getUserWishlist(userId: string) {
  return db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
    with: { product: { with: { images: { limit: 1 } } } },
  });
}
