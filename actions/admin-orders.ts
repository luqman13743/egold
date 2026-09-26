"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, orders } from "@/db";
import { requireRole } from "@/lib/auth/rbac";
import { recordAudit } from "@/lib/audit";

const orderStatusSchema = z.enum([
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded",
]);

export async function updateOrderStatus(orderId: string, status: unknown, trackingNumber?: string) {
  const session = await requireRole("staff");
  const parsedStatus = orderStatusSchema.parse(status);

  const existing = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!existing) throw new Error("Order not found");

  await db
    .update(orders)
    .set({
      status: parsedStatus,
      trackingNumber: trackingNumber || existing.trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await recordAudit({
    actorId: session.user.id,
    action: "order.status_change",
    targetType: "order",
    targetId: orderId,
    metadata: { from: existing.status, to: parsedStatus },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function refundOrder(orderId: string, amount?: number, reason?: string) {
  const session = await requireRole("admin");
  const { getPaymentProvider } = await import("@/lib/payments");
  const { payments } = await import("@/db");

  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, orderId) });
  if (!payment) throw new Error("No payment found for this order");

  const provider = getPaymentProvider();
  const result = await provider.refundPayment({
    providerPaymentId: payment.providerPaymentId,
    amount,
    reason,
  });

  // Order/payment status still only moves to "refunded" once the webhook
  // confirms it — this call starts the refund, it doesn't finalize state.
  await recordAudit({
    actorId: session.user.id,
    action: "order.refund_initiated",
    targetType: "order",
    targetId: orderId,
    metadata: { refundId: result.refundId, amount, reason },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return result;
}
