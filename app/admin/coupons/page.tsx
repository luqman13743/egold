import { desc } from "drizzle-orm";
import { db, coupons } from "@/db";
import { CouponManager } from "@/components/admin/coupon-manager";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const list = await db.query.coupons.findMany({ orderBy: [desc(coupons.createdAt)] });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Coupons</h1>
      <CouponManager
        coupons={list.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type as "percentage" | "fixed",
          value: c.value,
          active: c.active,
          expiresAt: c.expiresAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
