import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, orders, orderItems, addresses, users } from "@/db";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Order — Admin" };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) notFound();

  const [items, address, customer] = await Promise.all([
    db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) }),
    order.addressId ? db.query.addresses.findFirst({ where: eq(addresses.id, order.addressId) }) : null,
    order.userId ? db.query.users.findFirst({ where: eq(users.id, order.userId) }) : null,
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl">Order #{order.id.slice(0, 8)}</h1>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
      </div>

      <div className="grid sm:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-medium text-ink/50 dark:text-white/50 mb-2">Customer</h2>
          <p className="text-sm">{customer?.name ?? address?.fullName ?? "Guest"}</p>
          <p className="text-sm text-ink/60 dark:text-white/60">{customer?.email}</p>
        </div>
        {address && (
          <div>
            <h2 className="text-sm font-medium text-ink/50 dark:text-white/50 mb-2">Delivery address</h2>
            <p className="text-sm">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
            <p className="text-sm">{address.city}{address.province ? `, ${address.province}` : ""} {address.postalCode}</p>
            <p className="text-sm text-ink/60 dark:text-white/60">{address.phone}</p>
          </div>
        )}
      </div>

      <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10 mb-6">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between py-3 text-sm">
            <span>{item.productName} × {item.quantity}</span>
            <span className="tabular-nums">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="max-w-xs ml-auto space-y-1 text-sm mb-10">
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Discount</span><span>-{formatPrice(order.discountTotal)}</span></div>
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Shipping</span><span>{formatPrice(order.shippingTotal)}</span></div>
        <div className="flex justify-between font-medium pt-1 border-t border-sand dark:border-white/10"><span>Total</span><span>{formatPrice(order.total)}</span></div>
      </div>

      <OrderStatusForm orderId={order.id} currentStatus={order.status} trackingNumber={order.trackingNumber} paymentStatus={order.paymentStatus} />
    </div>
  );
}
