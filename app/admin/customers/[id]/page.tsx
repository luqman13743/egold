import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, users, orders } from "@/db";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Customer — Admin" };

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!customer) notFound();

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, id),
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1">{customer.name}</h1>
      <p className="text-ink/60 dark:text-white/60 mb-8">{customer.email}</p>

      <h2 className="font-medium mb-3">Order history</h2>
      <ul className="divide-y divide-sand dark:divide-white/10 border-t border-b border-sand dark:border-white/10">
        {customerOrders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="flex justify-between items-center py-3 text-sm hover:text-accent">
              <span>#{order.id.slice(0, 8)}</span>
              <StatusBadge status={order.status} />
              <span className="tabular-nums">{formatPrice(order.total)}</span>
            </Link>
          </li>
        ))}
        {customerOrders.length === 0 && <li className="py-4 text-sm text-ink/50">No orders yet.</li>}
      </ul>
    </div>
  );
}
