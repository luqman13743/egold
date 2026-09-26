import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/rbac";
import { getUserOrders } from "@/services/account";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Your orders" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

export default async function OrdersPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login?redirect=/account/orders");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your orders</h1>

      {orders.length === 0 ? (
        <p className="text-ink/60 dark:text-white/60">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/account/orders/${order.id}`} className="flex justify-between items-center py-4 text-sm hover:text-accent">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-ink/50 dark:text-white/50">
                    {new Date(order.createdAt).toLocaleDateString()} · {STATUS_LABEL[order.status]}
                  </p>
                </div>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
