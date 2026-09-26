"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, coupons } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";

const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
});

export async function createCoupon(input: unknown) {
  const session = await requireRole("manager");
  const data = couponSchema.parse(input);

  const [coupon] = await db
    .insert(coupons)
    .values({
      code: data.code,
      type: data.type,
      value: String(data.value),
      minOrderAmount: data.minOrderAmount ? String(data.minOrderAmount) : undefined,
      maxDiscount: data.maxDiscount ? String(data.maxDiscount) : undefined,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      usageLimit: data.usageLimit,
      perUserLimit: data.perUserLimit,
    })
    .returning();

  await recordAudit({ actorId: session.user.id, action: "coupon.create", targetType: "coupon", targetId: coupon.id, metadata: { code: coupon.code } });
  revalidatePath("/admin/coupons");
  return coupon;
}

export async function toggleCouponActive(couponId: string, active: boolean) {
  const session = await requireRole("manager");
  await db.update(coupons).set({ active }).where(eq(coupons.id, couponId));
  await recordAudit({ actorId: session.user.id, action: "coupon.toggle", targetType: "coupon", targetId: couponId, metadata: { active } });
  revalidatePath("/admin/coupons");
}
