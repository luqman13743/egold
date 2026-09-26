"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, reviews, orderItems, orders } from "@/db";
import { requireSession } from "@/lib/auth/rbac";
import { rateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
});

export async function submitReview(input: unknown) {
  const session = await requireSession();

  const { allowed } = await rateLimit(`review:${session.user.id}`, 5, 60 * 60); // 5/hour
  if (!allowed) throw new Error("Too many reviews submitted — please try again later.");

  const data = reviewSchema.parse(input);

  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.userId, session.user.id), eq(reviews.productId, data.productId)),
  });
  if (existing) throw new Error("You've already reviewed this product.");

  // Verified purchase = this user has a paid order containing this product.
  const purchase = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, session.user.id), eq(orderItems.productId, data.productId), eq(orders.paymentStatus, "paid")))
    .limit(1);

  await db.insert(reviews).values({
    productId: data.productId,
    userId: session.user.id,
    rating: data.rating,
    title: data.title,
    body: data.body,
    verifiedPurchase: purchase.length > 0,
    status: "pending", // requires moderation before it's publicly visible
  });

  revalidatePath(`/product`);
}
