import { and, eq, count } from "drizzle-orm";
import { db, coupons, couponUsage } from "@/db";

export class CouponError extends Error {}

interface ValidateCouponInput {
  code: string;
  userId?: string;
  subtotal: number;
}

/**
 * Validates a coupon and returns the discount amount in the store's minor
 * currency unit. Called only from the server during checkout — a coupon
 * discount from the client is never trusted, only the code string is.
 */
export async function validateAndPriceCoupon(input: ValidateCouponInput) {
  const coupon = await db.query.coupons.findFirst({
    where: and(eq(coupons.code, input.code.toUpperCase()), eq(coupons.active, true)),
  });

  if (!coupon) throw new CouponError("Coupon not found");

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new CouponError("Coupon is not active yet");
  if (coupon.expiresAt && now > coupon.expiresAt) throw new CouponError("Coupon has expired");

  if (coupon.minOrderAmount && input.subtotal < parseFloat(coupon.minOrderAmount)) {
    throw new CouponError(`Order must be at least ${coupon.minOrderAmount} to use this coupon`);
  }

  if (coupon.usageLimit !== null) {
    const [{ value: totalUses }] = await db
      .select({ value: count() })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, coupon.id));
    if (totalUses >= coupon.usageLimit) throw new CouponError("Coupon usage limit reached");
  }

  if (input.userId && coupon.perUserLimit !== null) {
    const [{ value: userUses }] = await db
      .select({ value: count() })
      .from(couponUsage)
      .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, input.userId)));
    if (userUses >= coupon.perUserLimit) throw new CouponError("You've already used this coupon");
  }

  let discount =
    coupon.type === "percentage"
      ? (input.subtotal * parseFloat(coupon.value)) / 100
      : parseFloat(coupon.value);

  if (coupon.maxDiscount) discount = Math.min(discount, parseFloat(coupon.maxDiscount));
  discount = Math.min(discount, input.subtotal); // never discount below zero

  return { couponId: coupon.id, code: coupon.code, discount };
}
