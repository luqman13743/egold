import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, orders, orderItems } from "@/db";
import { formatPrice } from "@/lib/format";

interface Props {
  searchParams: Promise<{ order?: string; status?: string }>;
}

export const metadata = { title: "Order confirmation" };

export default async function ConfirmationPage({ searchParams }: Props) {
  const { order: orderId, status: queryStatus } = await searchParams;

  if (!orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-2xl">No order found</h1>
        <Link href="/shop" className="mt-4 inline-block text-accent hover:underline">Continue shopping</Link>
      </div>
    );
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  const items = order ? await db.query.orderItems.findMany({ where: eq(orderItems.orderId, order.id) }) : [];

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-2xl">Order not found</h1>
      </div>
    );
  }

  if (queryStatus === "cancelled") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-2xl">Payment cancelled</h1>
        <p className="mt-2 text-ink/60 dark:text-white/60">Your order is saved — you can try paying again.</p>
        <Link href="/checkout" className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-white text-sm font-medium hover:bg-accent-dim">
          Retry payment
        </Link>
      </div>
    );
  }

  // The page NEVER declares "payment successful" itself — it reports
  // whatever paymentStatus currently sits in the database, which only a
  // verified webhook is allowed to set to "paid". A customer landing here
  // straight off a gateway redirect may still show "pending" for a few
  // seconds until the webhook lands, and that's the honest state.
  const statusCopy: Record<string, string> = {
    pending: "We're confirming your payment — this can take a moment.",
    paid: "Payment received. Thank you!",
    failed: "This payment didn't go through. You can try again from your orders.",
    refunded: "This order has been refunded.",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <h1 className="font-display text-3xl">
        {order.paymentMethod === "cod" ? "Order placed" : "Thank you for your order"}
      </h1>
      <p className="mt-2 text-ink/70 dark:text-white/70">
        {order.paymentMethod === "cod" ? "Pay on delivery." : statusCopy[order.paymentStatus]}
      </p>

      <div className="mt-8 rounded-md border border-sand dark:border-white/10 p-5">
        <p className="text-sm text-ink/50 dark:text-white/50 mb-3">Order #{order.id.slice(0, 8)}</p>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.productName} × {item.quantity}</span>
              <span className="tabular-nums">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-sand dark:border-white/10 flex justify-between font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <Link href="/shop" className="mt-8 inline-block text-accent hover:underline text-sm">
        Continue shopping
      </Link>
    </div>
  );
}
