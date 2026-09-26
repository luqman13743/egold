import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/rbac";
import { getUserOrderById } from "@/services/account";
import { formatPrice } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: Props) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login?redirect=/account/orders");

  const { id } = await params;
  // getUserOrderById scopes by userId internally — a customer requesting
  // another customer's order id simply gets a 404, never that order's data.
  const result = await getUserOrderById(session.user.id, id);
  if (!result) notFound();

  const { order, items } = result;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-2xl mb-1">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-sm text-ink/50 dark:text-white/50 mb-8">
        Placed {new Date(order.createdAt).toLocaleDateString()} · Status: {order.status} · Payment: {order.paymentStatus}
      </p>

      {order.trackingNumber && (
        <p className="text-sm mb-6">Tracking number: <span className="font-medium">{order.trackingNumber}</span></p>
      )}

      <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between py-3 text-sm">
            <span>{item.productName} × {item.quantity}</span>
            <span className="tabular-nums">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 text-sm max-w-xs ml-auto">
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Discount</span><span>-{formatPrice(order.discountTotal)}</span></div>
        <div className="flex justify-between"><span className="text-ink/60 dark:text-white/60">Shipping</span><span>{formatPrice(order.shippingTotal)}</span></div>
        <div className="flex justify-between font-medium pt-1 border-t border-sand dark:border-white/10"><span>Total</span><span>{formatPrice(order.total)}</span></div>
      </div>
    </div>
  );
}
