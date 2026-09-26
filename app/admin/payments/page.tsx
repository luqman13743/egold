import { desc } from "drizzle-orm";
import { db, payments } from "@/db";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Payments — Admin" };

export default async function AdminPaymentsPage() {
  const list = await db.query.payments.findMany({
    orderBy: [desc(payments.createdAt)],
    limit: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Payments</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/50 dark:text-white/50 border-b border-sand dark:border-white/10">
            <th className="py-2 pr-4 font-normal">Order</th>
            <th className="py-2 pr-4 font-normal">Provider</th>
            <th className="py-2 pr-4 font-normal">Amount</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b border-sand dark:border-white/10">
              <td className="py-2.5 pr-4">
                <a href={`/admin/orders/${p.orderId}`} className="hover:text-accent">#{p.orderId.slice(0, 8)}</a>
              </td>
              <td className="py-2.5 pr-4 capitalize">{p.provider}</td>
              <td className="py-2.5 pr-4 tabular-nums">{formatPrice(p.amount)}</td>
              <td className="py-2.5 pr-4"><StatusBadge status={p.status} /></td>
              <td className="py-2.5 text-ink/50 dark:text-white/50">{new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-ink/50">No payments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
