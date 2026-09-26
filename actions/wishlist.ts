"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, wishlists } from "@/db";
import { requireSession } from "@/lib/auth/rbac";

export async function addToWishlist(productId: string) {
  const session = await requireSession();
  const existing = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.userId, session.user.id), eq(wishlists.productId, productId)),
  });
  if (existing) return; // no duplicate entries
  await db.insert(wishlists).values({ userId: session.user.id, productId });
  revalidatePath("/wishlist");
}

export async function removeFromWishlist(productId: string) {
  const session = await requireSession();
  await db
    .delete(wishlists)
    .where(and(eq(wishlists.userId, session.user.id), eq(wishlists.productId, productId)));
  revalidatePath("/wishlist");
}
